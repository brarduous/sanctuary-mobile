import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useAuth } from './AuthContext';
import { discoveryLocalDate, isDiscoveryBundle, selectDiscovery } from '@/lib/discoveryCore';
import type { Discovery, DiscoveryBundle, DiscoveryCompletion, DiscoveryProgress } from '@/lib/discoveryCore';
import {dailySetForDate,dailySetResults} from '@/lib/discoveryDailySet';
import {discoveryMetric,type TriviaEntrySource} from '@/lib/discoveries';
import { discoverySessionId, discoveryStore, fetchDiscoveryBundle, fetchDiscoveryProgress, sendDiscoveryCompletions } from '@/lib/discoveries';
import bundled from '@/assets/discoveries/approved-fallback.json';
import type { TriviaTiming } from '@/lib/discoveryGame';

const empty = (): DiscoveryProgress => ({total:0,completions:{},pending:{}});
type DiscoveryContextValue = {
  bundle: DiscoveryBundle | null; today: string; selection: ReturnType<typeof selectDiscovery>; progress: DiscoveryProgress;
  error: string | null; refreshing: boolean; refresh: (force?:boolean) => Promise<void>; complete: (item: Discovery, mode: DiscoveryCompletion['mode'], optionId?: string,timing?:TriviaTiming,source?:TriviaEntrySource) => Promise<void>;
  mergeGuest: () => Promise<void>; hasGuestProgress: boolean;
};
const Context = createContext<DiscoveryContextValue | null>(null);
export function DiscoveryProvider({children}: {children:React.ReactNode}) {
  const {user,loading} = useAuth();
  const account = user?.id || null;
  const active = useRef(account); active.current = account;
  const [bundle,setBundle] = useState<DiscoveryBundle | null>(null);
  const bundleRef = useRef<DiscoveryBundle | null>(null);
  const [today,setToday] = useState(discoveryLocalDate);
  const [progress,setProgress] = useState<DiscoveryProgress>(empty);
  const [progressAccount,setProgressAccount] = useState(account);
  const [error,setError] = useState<string | null>(null);
  const [hasGuestProgress,setHasGuestProgress] = useState(false);
  const refreshing = useRef(false);
  const [isRefreshing,setIsRefreshing] = useState(true);
  const calendar = useRef(discoveryLocalDate());
  const completedMetrics=useRef(new Set<string>());
  const retryAfter = useRef(0);
  const nextBundleRefresh = useRef(0);
  const refreshLatest = useRef<() => Promise<void>>(async () => undefined);

  const refresh = useCallback(async (force=false) => {
    const date = discoveryLocalDate();
    if (force || date !== calendar.current) nextBundleRefresh.current=0;
    calendar.current=date; setToday(date);
    if (loading || refreshing.current) return;
    refreshing.current = true; setIsRefreshing(true);
    const owner = account;
    try {
      const cached = await discoveryStore.bundle();
      const local = isDiscoveryBundle(cached) ? cached : isDiscoveryBundle(bundled) ? bundled : null;
      if (active.current !== owner) return;
      if (!bundleRef.current && local) {bundleRef.current=local;setBundle(local);}
      const localProgress = await discoveryStore.progress(owner);
      const guestProgress = owner ? await discoveryStore.progress(null) : null;
      if (active.current !== owner) return;
      setProgress(localProgress);
      setHasGuestProgress(Boolean(guestProgress && Object.keys(guestProgress.completions).length));
      if (Date.now() >= nextBundleRefresh.current) {
        const installation = await discoveryStore.installationId();
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const remote = await fetchDiscoveryBundle(installation,zone,bundleRef.current?.bundleRevision);
        if (active.current !== owner) return;
        if (remote) {
          await discoveryStore.saveBundle(remote);
          bundleRef.current=remote; setBundle(remote);
        }
        nextBundleRefresh.current=Date.now()+15*60000;
      }
      if (owner) {
        await discoveryStore.sync(owner,discoverySessionId,events => sendDiscoveryCompletions(owner,events));
        const remoteProgress = await fetchDiscoveryProgress(owner);
        if (active.current !== owner) return;
        const reconciled = await discoveryStore.reconcile(owner,remoteProgress);
        if (active.current !== owner) return;
        setProgress(reconciled);
      }
      setError(null); retryAfter.current=0;
    } catch (failure) {
      if (active.current === owner) setError(failure instanceof Error ? failure.message : 'Discoveries could not refresh.');
      retryAfter.current=Date.now()+60000;
    } finally {
      refreshing.current=false; setIsRefreshing(false);
      if (active.current !== owner || calendar.current !== date) {
        nextBundleRefresh.current=0;
        void refreshLatest.current();
      }
    }
  },[account,loading]);
  refreshLatest.current=refresh;

  useEffect(() => {
    setProgress(empty()); setProgressAccount(account); setError(null); setHasGuestProgress(false);
    nextBundleRefresh.current=0;
    void refresh();
    const subscription = AppState.addEventListener('change',state => {if (state==='active') void refresh();});
    // Recompute local calendar even across DST/travel. Retry pending network work
    // while foregrounded; the OS need not run a background task for durability.
    const timer = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      const date = discoveryLocalDate();
      setToday(previous => { if (date !== previous) nextBundleRefresh.current=0; return date; });
      if (Date.now() >= retryAfter.current) void refresh();
    },60000);
    return () => {subscription.remove();clearInterval(timer);};
  },[refresh]);

  const complete = useCallback(async (item:Discovery,mode:DiscoveryCompletion['mode'],optionId?:string,timing?:TriviaTiming,source?:TriviaEntrySource) => {
    const owner = account;
    const event:DiscoveryCompletion = {eventId:Crypto.randomUUID(),discoveryId:item.id,revision:item.revision,mode,optionId:optionId || null,occurredAt:new Date().toISOString(),localDate:discoveryLocalDate(),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',outcome:mode==='answered' ? optionId===item.correctOptionId ? 'correct':'incorrect' : timing?.timedOut ? 'timeout':'revealed',puzzleDate:item.publicationDate,...(item.setPosition ? {setPosition:item.setPosition}:{}),...timing};
    const next = await discoveryStore.complete(owner,event);
    const date=discoveryLocalDate(),items=dailySetForDate(bundleRef.current,date),metricKey=`${owner||'guest'}:${date}`;
    if(active.current===owner&&items.length===3&&dailySetResults(items,next.completions).every(Boolean)&&!completedMetrics.current.has(metricKey)){
      completedMetrics.current.add(metricKey);discoveryMetric(items[0],'set_completed',{date,source});
    }
    if (active.current === owner) setProgress(next);
    if (owner) void discoveryStore.sync(owner,discoverySessionId,events => sendDiscoveryCompletions(owner,events)).then(async () => {
      const saved = await discoveryStore.progress(owner);
      if (active.current === owner) setProgress(saved);
    }).catch(() => {retryAfter.current=Date.now()+60000;});
  },[account]);
  const mergeGuest = useCallback(async () => {
    if (!account) return;
    const next = await discoveryStore.mergeGuest(account);
    if (active.current !== account) return;
    setProgress(next);setHasGuestProgress(false);await refresh();
  },[account,refresh]);
  const forceRefresh = useCallback(async () => {nextBundleRefresh.current=0;await refresh();},[refresh]);
  return <Context.Provider value={{bundle,today,selection:selectDiscovery(bundle,today),progress:progressAccount===account ? progress : empty(),error,refreshing:isRefreshing,refresh:forceRefresh,complete,mergeGuest,hasGuestProgress:progressAccount===account && hasGuestProgress}}>{children}</Context.Provider>;
}
export function useDiscoveries() {const value=useContext(Context);if (!value) throw new Error('DiscoveryProvider is required.');return value;}
