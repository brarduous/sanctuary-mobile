import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import {Platform} from 'react-native';
import {campaignFromParams,cleanCampaign,UUID,type Campaign,type FunnelRecord} from './attributionCore';
const KEY='sanctuary:acquisition:v1';
// Existing installations record app_open, rather than being relabeled installs.
const RELEASE_AT=Date.parse(process.env.EXPO_PUBLIC_ATTRIBUTION_RELEASE_AT || '2026-11-03T15:30:00Z');
const ENDPOINT=(process.env.EXPO_PUBLIC_ATTRIBUTION_URL||'https://www.sanctuaryapp.us')+'/api/attribution';
type State={id:string;first:Campaign;last:Campaign;clickId?:string;pending?:FunnelRecord;firstSent:boolean};
let ready:Promise<State>|undefined,flushing:Promise<void>|undefined;
async function initialize():Promise<State> {
 const saved=await AsyncStorage.getItem(KEY);if(saved){try{const state=JSON.parse(saved);if(UUID.test(state.id))return state;}catch{}}
 const id=Crypto.randomUUID();let first:Campaign={},last:Campaign={},clickId:string|undefined;
 if(Platform.OS==='android') {
  // Failure must be retried; don't permanently classify a temporarily
  // unavailable Play referrer as organic.
  const referrer=await Application.getInstallReferrerAsync();
  const params=new URLSearchParams(referrer);last=campaignFromParams(params);first=last;
  try{const original=cleanCampaign(JSON.parse(params.get('sanctuary_first_touch')||'null'));if(Object.keys(original).length)first=original;}catch{}
  const click=params.get('sanctuary_click_id');if(click&&UUID.test(click))clickId=click;
 }
 const installed=await Application.getInstallationTimeAsync();
 const state:State={id,first,last,clickId,firstSent:false};
 state.pending={event_id:Crypto.randomUUID(),event:installed.getTime()>=RELEASE_AT?'app_first_open':'app_open',platform:Platform.OS as 'ios'|'android',visitor_id:id,session_id:Crypto.randomUUID(),first_touch:first,last_touch:last,is_test:__DEV__,...(clickId?{click_id:clickId}:{})};
 await AsyncStorage.setItem(KEY,JSON.stringify(state));return state;
}
async function state(){try{return await (ready ||= initialize());}catch(error){ready=undefined;throw error;}}
export async function flushAcquisition() {
 if(Platform.OS!=='ios'&&Platform.OS!=='android')return;
 if(flushing)return flushing;
 flushing=(async()=>{
  const s=await state();if(!s.pending)return;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(s.pending),signal:controller.signal});if(!response.ok)throw new Error('Acquisition pending');delete s.pending;s.firstSent=true;await AsyncStorage.setItem(KEY,JSON.stringify(s));}
  finally{clearTimeout(timer);}
 })().finally(()=>{flushing=undefined;});return flushing;
}
export async function captureAcquisitionLink(url:string|null) {
 if(!url||!/^https:\/\/(www\.)?sanctuaryapp\.us\/|^sanctuary:\/\//.test(url))return;
 const params=new URLSearchParams(url.split('?')[1]?.split('#')[0]||''),campaign=campaignFromParams(params);
 if(!Object.keys(campaign).length)return;
 const s=await state();s.last=campaign;
 // An installed-app deep link is re-engagement, not deferred install evidence.
 if(!Object.keys(s.first).length)s.first=campaign;
 await AsyncStorage.setItem(KEY,JSON.stringify(s));
}
export function startAcquisitionTracking() {
 if(Platform.OS!=='ios'&&Platform.OS!=='android')return()=>{};
 const run=()=>{void flushAcquisition().catch(()=>undefined);};
 run();void Linking.getInitialURL().then(captureAcquisitionLink).catch(()=>undefined);
 const link=Linking.addEventListener('url',event=>{void captureAcquisitionLink(event.url).catch(()=>undefined);});
 const timer=setInterval(run,30000);return()=>{clearInterval(timer);link.remove();};
}
