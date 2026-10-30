import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { discoveryStore } from '@/lib/discoveries';
import { TRIVIA_DURATION_MS, triviaElapsed, type TriviaRound } from '@/lib/discoveryGame';

export default function useTriviaRound(id?:string,revision?:number,finished=false) {
  const {user,loading}=useAuth();
  const account:string|null=user?.id || null;
  const identity=`${account}:${id}:${revision}`;
  const active=useRef(identity);active.current=identity;
  const [snapshot,setSnapshot]=useState<{identity:string;round:TriviaRound|null;ready:boolean}>({identity,round:null,ready:false});
  const [elapsed,setElapsed]=useState(0);
  const [starting,setStarting]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [restoreAttempt,setRestoreAttempt]=useState(0);
  const clock=useRef({identity,base:0,monotonic:performance.now()});
  const round=snapshot.identity===identity ? snapshot.round:null;
  const readElapsed=useCallback(()=>round ? Math.floor(triviaElapsed(round,Date.now(),clock.current.identity===identity ? clock.current.base+performance.now()-clock.current.monotonic:0)):0,[round,identity]);
  useEffect(()=>{
    if(!id || !revision || loading)return;
    let live=true;setError(null);setStarting(false);setElapsed(0);
    void discoveryStore.round(account,id,revision).then(saved=>{
      if(!live || active.current!==identity)return;
      const elapsed=saved ? triviaElapsed(saved,Date.now()):0;
      clock.current={identity,base:elapsed,monotonic:performance.now()};setElapsed(elapsed);
      setSnapshot({identity,round:saved,ready:true});
    }).catch(()=>{if(live && active.current===identity){setError('This round could not be restored.');setSnapshot({identity,round:null,ready:false});}});
    return()=>{live=false;};
  },[account,id,revision,identity,loading,restoreAttempt]);
  useEffect(()=>{
    if(!round || finished)return;
    const update=()=>setElapsed(readElapsed());update();
    const timer=setInterval(update,200);
    const listener=AppState.addEventListener('change',state=>{
      update();
      if(state!=='active' && id && revision)void discoveryStore.checkpointRound(account,id,revision,readElapsed()).catch(()=>undefined);
    });
    return()=>{clearInterval(timer);listener.remove();};
  },[round,finished,readElapsed,account,id,revision]);
  const start=useCallback(async()=>{
    if(!id || !revision || starting || loading || error==='This round could not be restored.' || finished)return;
    setStarting(true);setError(null);
    try {
      const saved=await discoveryStore.beginRound(account,id,revision);
      if(active.current!==identity)return;
      if(saved){const elapsed=triviaElapsed(saved,Date.now());clock.current={identity,base:elapsed,monotonic:performance.now()};setSnapshot({identity,round:saved,ready:true});setElapsed(elapsed);}
    } catch {if(active.current===identity)setError('Your round could not start. Try again.');}
    finally {if(active.current===identity)setStarting(false);}
  },[id,revision,starting,loading,error,finished,account,identity]);
  return {identity,owner:account,started:Boolean(round),ready:!loading && snapshot.identity===identity && snapshot.ready,starting,start,retryRestore:()=>setRestoreAttempt(value=>value+1),error,elapsed,readElapsed,remaining:Math.max(0,Math.ceil((TRIVIA_DURATION_MS-elapsed)/1000)),expired:Boolean(round) && elapsed>=TRIVIA_DURATION_MS};
}
