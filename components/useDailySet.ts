import {useCallback,useEffect,useState} from 'react';
import {useDiscoveries} from '@/context/DiscoveryContext';
import {dailySetForDate} from '@/lib/discoveryDailySet';
import {discoveryStore,fetchDiscoveryBundle} from '@/lib/discoveries';
import type {DiscoveryBundle} from '@/lib/discoveryCore';
export default function useDailySet(date:string) {
 const {bundle,today,error:bundleError,refresh}=useDiscoveries();
 const [remote,setRemote]=useState<{date:string;bundle:DiscoveryBundle|null}|null>(null);
 const [loading,setLoading]=useState(false),[error,setError]=useState('');
 const [retryCount,setRetryCount]=useState(0);
 const local=dailySetForDate(bundle,date),available=local.length===3;
 useEffect(()=>{
  if(available || date===today || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date>today){setLoading(false);setError('');return;}
  let active=true;setLoading(true);setError('');
  void (async()=>{
   try{const id=await discoveryStore.installationId();const body=await fetchDiscoveryBundle(id,Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',undefined,date);if(active)setRemote({date,bundle:body});}
   catch{if(active)setError('This daily set could not load. Please connect and try again.');}
   finally{if(active)setLoading(false);}
  })();
  return()=>{active=false;};
 },[date,today,available,retryCount]);
 const retry=useCallback(()=>{if(date===today)void refresh(true);else setRetryCount(count=>count+1);},[date,today,refresh]);
 const historical=remote?.date===date && date<today && remote.bundle ? {...remote.bundle,withdrawnIds:[...new Set([...remote.bundle.withdrawnIds,...(bundle?.withdrawnIds || [])])]}:null;
 return {items:available ? local:dailySetForDate(historical,date),loading:loading || (!bundle && !bundleError),error,retry};
}
