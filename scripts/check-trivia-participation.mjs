import test from 'node:test';
import assert from 'node:assert/strict';
import {participationStreak,participationDays} from '../lib/triviaParticipation.ts';
import {dailySetPerfectStreak} from '../lib/discoveryDailySet.ts';
import {createDiscoveryStore} from '../lib/discoveryStore.ts';
const day=(date,outcomes=['incorrect','timeout','revealed'])=>outcomes.map((outcome,index)=>({eventId:`${date}-${index}`,discoveryId:`${date}-q${index}`,revision:1,mode:outcome==='incorrect'?'answered':'revealed',optionId:null,occurredAt:`${date}T19:00:00Z`,localDate:date,timeZone:'America/New_York',puzzleDate:date,setPosition:index+1,outcome}));
test('participation is independent of accuracy, and a partial today preserves yesterday across DST/month boundaries',()=>{
 const history=[...day('2026-10-31'),...day('2026-11-01')];
 assert.equal(participationStreak(history,'2026-11-01'),2);
 assert.equal(dailySetPerfectStreak(history,'2026-11-01'),0);
 assert.equal(participationStreak([...history,...day('2026-11-02').slice(0,2)],'2026-11-02'),2);
 assert.equal(participationStreak([...history,...day('2026-11-02')],'2026-11-02'),3);
 assert.equal(participationStreak(history,'2026-11-03'),0);
 assert.equal(participationStreak([...day('2026-12-31'),...day('2027-01-01')],'2027-01-01'),2);
});
test('retries, reused questions, invalid slots, future dates and archive play cannot invent a daily award',()=>{
 const rows=day('2026-11-02');
 assert.equal(participationStreak([...rows,...rows],'2026-11-02'),1);
 assert.equal(participationStreak(rows.map(row=>({...row,discoveryId:'same-question'})),'2026-11-02'),0);
 assert.equal(participationStreak(rows.map(row=>({...row,setPosition:4})),'2026-11-02'),0);
 assert.equal(participationStreak(day('2026-11-03'),'2026-11-02'),0);
 assert.equal(participationStreak(rows.map(row=>({...row,puzzleDate:'2026-11-01',dailyPlayDate:null})),'2026-11-02'),0);
 assert.equal(participationStreak(day('2026-02-30'),'2026-03-01'),0);
});
test('carried displays preserve canonical play dates and a newly played carried set earns its real local day once',()=>{
 const yesterday=day('2026-11-01').map(row=>({...row,puzzleDate:'2026-11-02',originalPuzzleDate:'2026-11-01',dailyPlayDate:'2026-11-01'}));
 assert.deepEqual([...participationDays(yesterday)],['2026-11-01']);
 assert.equal(participationStreak(yesterday,'2026-11-02'),1);
 const playedToday=day('2026-11-02').map(row=>({...row,puzzleDate:'2026-11-01',originalPuzzleDate:'2026-11-01',dailyPlayDate:'2026-11-02'}));
 assert.equal(participationStreak(playedToday,'2026-11-02'),1);
 assert.equal(participationStreak([...yesterday,...yesterday.map(row=>({...row,localDate:'2026-11-02',dailyPlayDate:'2026-11-02'}))],'2026-11-02'),1);
});
test('offline guest history, explicit import, canonical play-date reconciliation and account isolation survive restart',async()=>{
 const disk=new Map(),storage={async getItem(key){return disk.get(key)||null;},async setItem(key,value){disk.set(key,value);},async removeItem(key){disk.delete(key);}};
 let store=createDiscoveryStore(storage,()=>crypto.randomUUID());
 for(const row of day('2026-11-02'))await store.complete(null,row);
 store=createDiscoveryStore(storage,()=>crypto.randomUUID());
 assert.equal(participationStreak(Object.values((await store.progress(null)).completions),'2026-11-02'),1);
 assert.equal(participationStreak(Object.values((await store.progress('alice')).completions),'2026-11-02'),0);
 await store.mergeGuest('alice');
 assert.equal(participationStreak(Object.values((await store.progress('bob')).completions),'2026-11-02'),0);
 await store.sync('alice',async()=> 'alice',async events=>({results:events.map(row=>({eventId:row.eventId,status:'accepted',completion:{event_id:row.eventId,discovery_id:row.discoveryId,revision:1,mode:row.mode,option_id:null,occurred_at:row.occurredAt,local_date:row.localDate,time_zone:row.timeZone,puzzle_date:'2026-11-02',original_puzzle_date:'2026-11-01',daily_play_date:'2026-11-02',set_position:row.setPosition,outcome:row.outcome}}))}));
 const saved=await store.progress('alice');
 assert.equal(Object.keys(saved.pending).length,0);
 assert.equal(participationStreak(Object.values(saved.completions),'2026-11-02'),1);
 assert.equal(Object.values(saved.completions)[0].originalPuzzleDate,'2026-11-01');
});
