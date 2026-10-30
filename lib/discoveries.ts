import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { createDiscoveryStore } from './discoveryStore';
import { isDiscovery, isDiscoveryBundle } from './discoveryCore';
import type { Discovery, DiscoveryBundle, DiscoveryCompletion, SyncResult } from './discoveryCore';

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL || 'https://api.sanctuaryapp.us'}/api/v1/discoveries`;
// Isolate simulator preview data from real account progress/outboxes. This is a
// storage namespace only: it never bypasses authentication or publication rules.
const localPreview=__DEV__ && ['http://127.0.0.1:4013','http://localhost:4013','http://127.0.0.1:4014','http://localhost:4014'].includes(process.env.EXPO_PUBLIC_BACKEND_URL || '');
const storageKey=(key:string)=>localPreview ? `discovery-preview:${key}`:key;
export const discoveryStore = createDiscoveryStore({
  getItem:key=>AsyncStorage.getItem(storageKey(key)),
  setItem:(key,value)=>AsyncStorage.setItem(storageKey(key),value),
  removeItem:key=>AsyncStorage.removeItem(storageKey(key)),
}, () => Crypto.randomUUID());
export async function discoverySessionId() {
  return (await supabase.auth.getSession()).data.session?.user.id || null;
}
async function request(path: string, options: RequestInit = {}, account?: string) {
  const session = (await supabase.auth.getSession()).data.session;
  if (account && session?.user.id !== account) throw new Error('Your account changed. Please try again.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(),10000);
  try {
    return await fetch(`${BASE}${path}`, { ...options, signal: controller.signal, headers: { 'Content-Type':'application/json', ...(session ? { Authorization:`Bearer ${session.access_token}` } : {}), ...options.headers } });
  } finally { clearTimeout(timeout); }
}
export async function fetchDiscoveryBundle(installationId: string, timeZone: string, etag?: string, date?:string): Promise<DiscoveryBundle | null> {
  const response = await request(`/bundle?dailySet=1&installationId=${encodeURIComponent(installationId)}&timeZone=${encodeURIComponent(timeZone)}${date ? `&date=${encodeURIComponent(date)}`:''}`,{headers:etag ? {'If-None-Match':`"${etag}"`} : {}});
  if (response.status === 304) return null;
  if (!response.ok) throw new Error('Discoveries could not refresh. Your saved discoveries are still available.');
  const body: unknown = await response.json();
  if (!isDiscoveryBundle(body)) throw new Error('Invalid discovery response.');
  return body;
}
export async function fetchDiscovery(id: string): Promise<Discovery | null> {
  const response = await request(`/${encodeURIComponent(id)}?dailySet=1`);
  if (response.status === 404 || response.status === 410) return null;
  if (!response.ok) throw new Error('This discovery could not refresh.');
  const body = await response.json();
  if (!isDiscovery(body.discovery)) throw new Error('Invalid discovery response.');
  return body.discovery;
}
export async function sendDiscoveryCompletions(account: string, events: DiscoveryCompletion[]): Promise<{results:SyncResult[]}> {
  const response = await request('/completions',{method:'POST',body:JSON.stringify({events})},account);
  if (!response.ok) throw new Error('Your discovery progress is saved on this device and will sync later.');
  const body = await response.json();
  if (!Array.isArray(body.results)) throw new Error('Invalid sync acknowledgement.');
  return body;
}
export async function fetchDiscoveryProgress(account: string) {
  const response = await request('/progress',{},account);
  if (!response.ok) throw new Error('Your discovery progress could not refresh.');
  const body = await response.json();
  if (!Number.isInteger(body.total) || body.total < 0 || !Array.isArray(body.completions)) throw new Error('Invalid discovery progress.');
  return body as {total:number;completions:NonNullable<SyncResult['completion']>[]};
}
export async function reportDiscovery(item: Discovery, reason: string) {
  const response = await request(`/${item.id}/reports`,{method:'POST',body:JSON.stringify({revision:item.revision,reason})});
  if (!response.ok) throw new Error('Your report could not be sent. Please try again when connected.');
}
export function discoveryMetric(item: Discovery, event: string) {
  // Aggregate first-party events only. No user/device ID or answer is transmitted.
  void request('/metrics',{method:'POST',body:JSON.stringify({eventId:Crypto.randomUUID(),discoveryId:item.id,event,platform:'mobile'})}).catch(() => undefined);
}
