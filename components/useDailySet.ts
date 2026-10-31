import {useCallback,useEffect,useState} from 'react';
import {useAuth} from '@/context/AuthContext';
import {triviaDateAccess} from '@/lib/discoveryDates';
import {useDiscoveries} from '@/context/DiscoveryContext';
import {dailySetForDate} from '@/lib/discoveryDailySet';
import {discoveryStore,fetchDiscoveryBundle} from '@/lib/discoveries';
import type {DiscoveryBundle} from '@/lib/discoveryCore';
export default function useDailySet(date:string) {
 const {user,profile,loading:authLoading}=useAuth();
 const isPro=Boolean(user && profile?.user_id===user.id && profile?.subscription_tier==='pro');
 const {bundle,today,error:bundleError,refresh}=useDiscoveries();
 const [remote,setRemote]=useState<{date:string;account:string|null;bundle:DiscoveryBundle|null}|null>(null);
 const [loading,setLoading]=useState(false),[error,setError]=useState('');
 const [retryCount,setRetryCount]=useState(0);
 const allowed=triviaDateAccess(date,today,isPro)==='allowed';
 const local=allowed ? dailySetForDate(bundle,date):[],available=local.length===3;
 useEffect(()=>{
  if(!allowed || authLoading || available || date===today || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date>today){setLoading(false);setError('');return;}
  let active=true;setLoading(true);setError('');
  void (async()=>{
   try{const id=await discoveryStore.installationId();const body=await fetchDiscoveryBundle(id,Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',undefined,date);if(active)setRemote({date,account:user?.id || null,bundle:body});}
   catch{if(active)setError('This daily set could not load. Please connect and try again.');}
   finally{if(active)setLoading(false);}
  })();
  return()=>{active=false;};
 },[date,today,available,retryCount,allowed,authLoading,user?.id]);
 const retry=useCallback(()=>{if(date===today)void refresh(true);else setRetryCount(count=>count+1);},[date,today,refresh]);
 const historical=allowed && remote?.account===(user?.id || null) && remote?.date===date && date<today && remote.bundle ? {...remote.bundle,withdrawnIds:[...new Set([...remote.bundle.withdrawnIds,...(bundle?.withdrawnIds || [])])]}:null;
 return {items:!allowed ? []:available ? local:dailySetForDate(historical,date),loading:loading || (!bundle && !bundleError),error,retry};
}
