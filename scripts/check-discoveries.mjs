import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createDiscoveryStore} from '../lib/discoveryStore.ts';
import {discoveryLocalDate,selectDiscovery,discoveryShareText,discoveryDifficultyLabel,isDiscovery} from '../lib/discoveryCore.ts';
const candidate=JSON.parse(readFileSync(new URL('../../sanctuary-backend/content/discoveries/biblical-candidates.json',import.meta.url)))[0];
const item={id:candidate.id,revision:1,publicationDate:'2026-10-28',...candidate.content,explanation:candidate.content.claims[0].text,url:`https://sanctuaryapp.us/discoveries/${candidate.id}`};
const event=(overrides={})=>({eventId:randomUUID(),discoveryId:item.id,revision:1,mode:'answered',optionId:item.correctOptionId,occurredAt:'2026-10-28T12:00:00Z',localDate:'2026-10-28',timeZone:'America/New_York',...overrides});
function storage(){const map=new Map();return {map,async getItem(k){return map.get(k)||null;},async setItem(k,v){map.set(k,v);},async removeItem(k){map.delete(k);}};}
const canonical=e=>({discovery_id:e.discoveryId,revision:e.revision,mode:e.mode,option_id:e.optionId,event_id:e.eventId,occurred_at:e.occurredAt,local_date:e.localDate,time_zone:e.timeZone});
test('assessed difficulty is labeled in sharing and invalid bands are rejected',()=>{
 const graded={...item,difficulty:{rubricVersion:'discovery-difficulty-v1',level:'moderate',score:4}};
 assert.equal(discoveryDifficultyLabel(graded),'Moderate');assert.match(discoveryShareText(graded),/^Moderate · Daily Discovery/);assert.equal(isDiscovery(graded),true);
 assert.equal(isDiscovery({...graded,difficulty:{...graded.difficulty,level:'easy'}}),false);
 assert.equal(discoveryDifficultyLabel({...item,difficulty:undefined}),null,'legacy content does not receive an invented difficulty');
});
test('local calendar handles UTC boundaries, DST, and date-line travel',()=>{
 const now=new Date('2026-10-28T01:00:00Z');
 assert.equal(discoveryLocalDate(now,'America/New_York'),'2026-10-27');
 assert.equal(discoveryLocalDate(now,'Pacific/Kiritimati'),'2026-10-28');
 assert.equal(discoveryLocalDate(new Date('2026-11-01T05:59:00Z'),'America/New_York'),'2026-11-01');
 assert.equal(discoveryLocalDate(new Date('2026-11-01T06:01:00Z'),'America/New_York'),'2026-11-01');
});
test('future cache is never mislabeled as today, and withdrawals/visibility are honored',()=>{
 const bundle={schemaVersion:1,enabled:true,items:[item],evergreen:[item],withdrawnIds:[]};
 assert.equal(selectDiscovery(bundle,'2026-10-28').isToday,true);
 assert.equal(selectDiscovery(bundle,'2026-10-27'),null);
 assert.equal(selectDiscovery(bundle,'2026-10-29').isToday,false);
 assert.equal(selectDiscovery({...bundle,withdrawnIds:[item.id]},'2026-10-28'),null);
 assert.equal(selectDiscovery({...bundle,enabled:false},'2026-10-28'),null);
 assert.ok(!discoveryShareText(item).includes(item.explanation));
});
test('offline completion survives process restart and retries, once per discovery',async()=>{
 const disk=storage();let store=createDiscoveryStore(disk,randomUUID);const e=event();
 await store.complete('alice',e);
 store=createDiscoveryStore(disk,randomUUID);
 assert.equal((await store.progress('alice')).pending[e.eventId].optionId,e.optionId);
 await assert.rejects(store.sync('alice',async()=> 'alice',async()=>{throw new Error('offline');}));
 assert.equal(Object.keys((await store.progress('alice')).pending).length,1);
 await store.complete('alice',event({mode:'revealed',optionId:null}));assert.equal((await store.progress('alice')).total,1);
 await store.sync('alice',async()=> 'alice',async events=>({results:events.map(e=>({eventId:e.eventId,status:'accepted',completion:canonical(e)}))}));
 assert.equal(Object.keys((await store.progress('alice')).pending).length,0);assert.equal((await store.progress('alice')).total,1);
});
test('a new tap during sync is retained and acknowledged in a second batch',async()=>{
 const store=createDiscoveryStore(storage(),randomUUID);await store.complete('alice',event());
 let calls=0;
 await store.sync('alice',async()=> 'alice',async events=>{
  if(calls++===0)await store.complete('alice',event({discoveryId:randomUUID()}));
  return {results:events.map(e=>({eventId:e.eventId,status:'accepted',completion:canonical(e)}))};
 });
 const progress=await store.progress('alice');assert.equal(progress.total,2);assert.equal(Object.keys(progress.pending).length,0);assert.equal(calls,2);
});
test('canonical server choice wins and unavailable content is removed from totals',async()=>{
 const store=createDiscoveryStore(storage(),randomUUID);const e=event();await store.complete('alice',e);
 await store.sync('alice',async()=> 'alice',async()=>({results:[{eventId:e.eventId,status:'accepted',completion:canonical({...e,mode:'revealed',optionId:null,eventId:randomUUID()})}]}));
 assert.equal((await store.progress('alice')).completions[item.id].mode,'revealed');
 const e2=event({discoveryId:randomUUID()});await store.complete('alice',e2);
 await store.sync('alice',async()=> 'alice',async()=>({results:[{eventId:e2.eventId,status:'unavailable'}]}));
 assert.equal((await store.progress('alice')).total,1);
});
test('guest progress is never silently uploaded; explicit merge is idempotent',async()=>{
 const store=createDiscoveryStore(storage(),randomUUID);await store.complete(null,event());
 assert.equal(Object.keys((await store.progress(null)).pending).length,0);assert.equal((await store.progress('alice')).total,0);
 await store.mergeGuest('alice');await store.mergeGuest('alice');assert.equal((await store.progress('alice')).total,1);assert.equal((await store.progress(null)).total,0);
});
test('account switching cannot send or acknowledge another account’s events',async()=>{
 const store=createDiscoveryStore(storage(),randomUUID);const e=event();await store.complete('alice',e);
 let identity='alice',sent=0;
 await store.sync('alice',async()=>identity,async events=>{sent++;identity='bob';return {results:events.map(e=>({eventId:e.eventId,status:'accepted',completion:canonical(e)}))};});
 assert.equal(sent,1);assert.equal(Object.keys((await store.progress('alice')).pending).length,1);assert.equal((await store.progress('bob')).total,0);
 await store.clearAccount('alice');assert.equal((await store.progress('alice')).total,0);
});
test('storage failure cannot acknowledge a completion or erase corrupt pending data',async()=>{
 const disk=storage();const original=disk.setItem;disk.setItem=async()=>{throw new Error('disk full');};
 const store=createDiscoveryStore(disk,randomUUID);await assert.rejects(store.complete('alice',event()),/disk full/);
 disk.setItem=original;assert.equal((await store.progress('alice')).total,0);
 disk.map.set('discovery:v1:progress:alice','corrupt');await assert.rejects(store.complete('alice',event()));assert.equal(disk.map.get('discovery:v1:progress:alice'),'corrupt');
});
