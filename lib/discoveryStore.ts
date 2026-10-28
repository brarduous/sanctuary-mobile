import type { DiscoveryBundle, DiscoveryCompletion, DiscoveryProgress, SyncResult } from './discoveryCore';
import { isTriviaRound, TRIVIA_DURATION_MS, type TriviaRound } from './discoveryGame.ts';

type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> };
const empty = (): DiscoveryProgress => ({ total: 0, completions: {}, pending: {} });
export const discoveryProgressKey = (account: string | null) => `discovery:v1:progress:${account || 'guest'}`;
const BUNDLE = 'discovery:v1:bundle';
const roundIndex=(account:string|null)=>`discovery:v1:rounds:${account || 'guest'}`;
const roundKey=(account:string|null,id:string,revision:number)=>`${roundIndex(account)}:${id}:${revision}`;
const fromServer=(row:NonNullable<SyncResult['completion']>):DiscoveryCompletion=>({eventId:row.event_id,discoveryId:row.discovery_id,revision:row.revision,mode:row.mode,optionId:row.option_id,occurredAt:row.occurred_at,localDate:row.local_date,timeZone:row.time_zone,...(typeof row.elapsed_ms==='number' ? {elapsedMs:row.elapsed_ms}:{}),...(row.outcome ? {outcome:row.outcome}:{}),...(row.puzzle_date ? {puzzleDate:row.puzzle_date}:{})});

// This is the only writer. A single queue serializes read/modify/write and sync
// acknowledgements so a concurrent tap cannot be lost when a request completes.
export function createDiscoveryStore(storage: Storage, uuid: () => string) {
  let writes: Promise<unknown> = Promise.resolve();
  let syncInFlight: Promise<void> | null = null;
  function serial<T>(operation: () => Promise<T>): Promise<T> {
    const result = writes.then(operation);
    writes = result.catch(() => undefined);
    return result;
  }
  async function read(account: string | null): Promise<DiscoveryProgress> {
    const raw = await storage.getItem(discoveryProgressKey(account));
    if (!raw) return empty();
    // Preserve corrupt progress/outbox for recovery rather than silently replacing
    // pending completions. Corrupt public content can safely be fetched again.
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1 || !parsed.completions || !parsed.pending || !Number.isInteger(parsed.total)) throw new Error('Your discovery progress could not be read. Please try again.');
    return { total: parsed.total, completions: parsed.completions, pending: parsed.pending };
  }
  async function save(account: string | null, state: DiscoveryProgress) {
    await storage.setItem(discoveryProgressKey(account), JSON.stringify({version:1,...state}));
    return state;
  }
  return {
    round(account:string|null,id:string,revision:number) {return serial(async()=>{
      const raw=await storage.getItem(roundKey(account,id,revision));
      if(!raw)return null;
      const value:unknown=JSON.parse(raw);
      if(!isTriviaRound(value))throw new Error('This round could not be restored.');
      return value;
    });},
    beginRound(account:string|null,id:string,revision:number,now=Date.now()) {return serial(async()=>{
      const state=await read(account);if(state.completions[id])return null;
      const key=roundKey(account,id,revision),raw=await storage.getItem(key);
      if(raw){const round:unknown=JSON.parse(raw);if(!isTriviaRound(round))throw new Error('This round could not be restored.');return round;}
      const index:unknown=JSON.parse(await storage.getItem(roundIndex(account)) || '[]');
      if(!Array.isArray(index) || index.some(key=>typeof key!=='string'))throw new Error('Round history could not be read.');
      const round:TriviaRound={startedAt:now,lastElapsedMs:0,durationMs:TRIVIA_DURATION_MS};
      await storage.setItem(roundIndex(account),JSON.stringify([...new Set([...index,key])]));
      await storage.setItem(key,JSON.stringify(round));return round;
    });},
    checkpointRound(account:string|null,id:string,revision:number,elapsedMs:number) {return serial(async()=>{
      const key=roundKey(account,id,revision),raw=await storage.getItem(key);if(!raw)return;
      const round:unknown=JSON.parse(raw);if(!isTriviaRound(round))throw new Error('This round could not be restored.');
      await storage.setItem(key,JSON.stringify({...round,lastElapsedMs:Math.max(round.lastElapsedMs,Math.min(TRIVIA_DURATION_MS,elapsedMs))}));
    });},
    progress(account: string | null) { return serial(() => read(account)); },
    installationId() { return serial(async () => {
      const key = 'discovery:v1:installation';
      const existing = await storage.getItem(key);
      if (existing) return existing;
      const id = uuid(); await storage.setItem(key,id); return id;
    }); },
    bundle() { return serial(async (): Promise<DiscoveryBundle | null> => {
      try { return JSON.parse(await storage.getItem(BUNDLE) || 'null'); } catch { await storage.removeItem(BUNDLE); return null; }
    }); },
    saveBundle(bundle: DiscoveryBundle) { return serial(() => storage.setItem(BUNDLE,JSON.stringify(bundle))); },
    complete(account: string | null, completion: DiscoveryCompletion) { return serial(async () => {
      const state = await read(account);
      if (state.completions[completion.discoveryId]) return state;
      if (Object.keys(state.pending).length >= 500) throw new Error('Your offline discoveries need to sync before recording another. Please connect and try again.');
      const completions = {...state.completions,[completion.discoveryId]:completion};
      // Bound recent history without removing anything still pending.
      const recent = Object.entries(completions).sort((a,b) => b[1].occurredAt.localeCompare(a[1].occurredAt));
      const pendingIds = new Set(Object.values(state.pending).map(event => event.discoveryId));
      pendingIds.add(completion.discoveryId);
      const retained = Object.fromEntries(recent.filter(([id],index) => index < 2000 || pendingIds.has(id)));
      return save(account,{total:state.total+1,completions:retained,pending:account ? {...state.pending,[completion.eventId]:completion} : {}});
    }); },
    mergeGuest(account: string) { return serial(async () => {
      const [guest, state] = await Promise.all([read(null),read(account)]);
      for (const event of Object.values(guest.completions)) {
        if (!state.completions[event.discoveryId]) {
          if (Object.keys(state.pending).length >= 500) throw new Error('Please sync your discoveries before importing more.');
          const imported = {...event,eventId:uuid()};
          state.completions[event.discoveryId] = imported; state.pending[imported.eventId] = imported; state.total++;
        }
      }
      await save(account,state);
      await storage.removeItem(discoveryProgressKey(null));
      return state;
    }); },
    clearAccount(account: string) { return serial(async()=>{
      const index=JSON.parse(await storage.getItem(roundIndex(account)) || '[]');
      if(Array.isArray(index))for(const key of index)if(typeof key==='string' && key.startsWith(roundIndex(account)+':'))await storage.removeItem(key);
      await storage.removeItem(roundIndex(account));await storage.removeItem(discoveryProgressKey(account));
    }); },
    reconcile(account: string, remote: {total:number;completions:SyncResult['completion'][]}) { return serial(async () => {
      const state = await read(account);
      const remoteIds = new Set<string>();
      for (const row of remote.completions) {
        if (!row) continue;
        remoteIds.add(row.discovery_id);
        state.completions[row.discovery_id] = fromServer(row);
      }
      state.total = remote.total + Object.values(state.pending).filter(event => !remoteIds.has(event.discoveryId)).length;
      return save(account,state);
    }); },
    sync(account: string, currentAccount: () => Promise<string | null>, send: (events: DiscoveryCompletion[]) => Promise<{results:SyncResult[]}>) {
      if (syncInFlight) return syncInFlight;
      syncInFlight = (async () => {
        while (await currentAccount() === account) {
          const state = await serial(() => read(account));
          const events = Object.values(state.pending).slice(0,50);
          if (!events.length) return;
          const {results} = await send(events);
          if (await currentAccount() !== account) return;
          const acknowledged = results.filter(result => events.some(event => event.eventId === result.eventId) && ['accepted','unavailable'].includes(result.status));
          if (!acknowledged.length) throw new Error('Discovery sync was not acknowledged.');
          await serial(async () => {
            const latest = await read(account);
            for (const result of acknowledged) {
              delete latest.pending[result.eventId];
              const row = result.completion;
              if (result.status === 'accepted' && row) latest.completions[row.discovery_id] = fromServer(row);
              if (result.status === 'unavailable') {
                const rejected = events.find(event => event.eventId === result.eventId)!;
                if (latest.completions[rejected.discoveryId]) { delete latest.completions[rejected.discoveryId]; latest.total = Math.max(0,latest.total-1); }
              }
            }
            await save(account,latest);
          });
        }
      })().finally(() => {syncInFlight=null;});
      return syncInFlight;
    },
  };
}
