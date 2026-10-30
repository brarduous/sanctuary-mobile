import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {isDiscovery} from '../lib/discoveryCore.ts';
import {dailySetForDate,dailySetResults,dailySetShareText,dailySetStreak} from '../lib/discoveryDailySet.ts';
import {createDiscoveryStore} from '../lib/discoveryStore.ts';
const date='2026-10-30';
const items=[1,2,3].map(setPosition=>({id:randomUUID(),revision:1,publicationDate:date,setPosition}));
const bundle={enabled:true,items,withdrawnIds:[]};
const done=(item,outcome='correct')=>({eventId:randomUUID(),discoveryId:item.id,revision:1,puzzleDate:date,localDate:date,setPosition:item.setPosition,outcome,mode:'answered',optionId:'option-1',occurredAt:date+'T12:00:00Z'});
test('new grading and legacy saved games retain their own bands; forged labels and unknown rubrics reject',()=>{
 const source=JSON.parse(readFileSync(new URL('../../sanctuary-backend/content/discoveries/biblical-candidates.json',import.meta.url),'utf8'))[0];
 const item={id:source.id,revision:1,publicationDate:date,...source.content,explanation:source.content.claims[0].text,url:`https://sanctuaryapp.us/discoveries/${source.id}`};
 assert.ok(isDiscovery({...item,difficulty:{rubricVersion:'discovery-difficulty-v1',score:6,level:'challenging'}}));
 assert.ok(isDiscovery({...item,difficulty:{rubricVersion:'discovery-difficulty-v2',score:6,level:'moderate'}}));
 assert.ok(isDiscovery({...item,difficulty:{rubricVersion:'discovery-difficulty-v2',score:8,level:'challenging'}}));
 assert.equal(isDiscovery({...item,difficulty:{rubricVersion:'discovery-difficulty-v2',score:6,level:'challenging'}}),false);
 assert.equal(isDiscovery({...item,difficulty:{rubricVersion:'unknown',score:6,level:'moderate'}}),false);
});
test('daily set selection is complete, fixed in difficulty order, and honors withdrawals',()=>{
 assert.deepEqual(dailySetForDate({...bundle,items:[items[2],items[0],items[1]]},date),items);
 for(const b of [{...bundle,items:items.slice(0,2)},{...bundle,items:[items[0],items[0],items[2]]},{...bundle,enabled:false},{...bundle,withdrawnIds:[items[1].id]}])assert.deepEqual(dailySetForDate(b,date),[]);
 assert.deepEqual(dailySetForDate(bundle,'2026-10-31'),[]);
});
test('share rows represent all 64 combinations honestly without questions or answer spoilers',()=>{
 for(const a of [null,'correct','incorrect','timeout'])for(const b of [null,'correct','incorrect','revealed'])for(const c of [null,'correct','incorrect','timeout']){
  const outcomes=[a,b,c],text=dailySetShareText(date,outcomes),played=outcomes.filter(Boolean).length;
  assert.equal(text.split('\n')[1],outcomes.map(r=>r==='correct' ? '🟩':r ? '🟥':'⬜').join(''));
  assert.ok(text.includes(`${outcomes.filter(r=>r==='correct').length}/3 correct`));
  assert.equal(text.includes('/3 played'),played<3);
  assert.ok(text.endsWith('/trivia?date=2026-10-30'));
  for(const spoiler of ['option-1','Mark','Jesus','correct answer','Sycamore'])assert.ok(!text.includes(spoiler));
 }
});
test('only the matching item revision/date contributes to the three-square result',()=>{
 const completions=Object.fromEntries(items.map((item,i)=>[item.id,done(item,i===1 ? 'incorrect':'correct')]));
 assert.deepEqual(dailySetResults(items,completions),['correct','incorrect','correct']);
 completions[items[0].id].revision=2;completions[items[2].id].puzzleDate='2026-10-29';
 assert.deepEqual(dailySetResults(items,completions),[null,'incorrect',null]);
});
test('a perfect-set streak requires all three wins and survives a partial next day across DST',()=>{
 const day=(date,outcomes=['correct','correct','correct'])=>outcomes.map((outcome,i)=>({...done(items[i],outcome),puzzleDate:date,localDate:date}));
 assert.equal(dailySetStreak([...day('2026-10-31'),...day('2026-11-01')],'2026-11-01'),2);
 assert.equal(dailySetStreak([...day('2026-10-31'),day('2026-11-01')[0]],'2026-11-01'),1);
 assert.equal(dailySetStreak([...day('2026-10-31'),...day('2026-11-01',['correct','incorrect','correct'])],'2026-11-01'),0);
 assert.equal(dailySetStreak(day('2026-10-31').map(r=>({...r,localDate:'2026-11-01'})),'2026-11-01'),0);
 assert.equal(dailySetStreak([{...done(items[0]),setPosition:undefined}],'2026-10-30'),0,'legacy single questions cannot earn a perfect set');
});
test('three offline results survive restart, guest import and canonical server reconciliation',async()=>{
 const memory=new Map(),storage={async getItem(k){return memory.get(k)||null;},async setItem(k,v){memory.set(k,v);},async removeItem(k){memory.delete(k);}};
 let store=createDiscoveryStore(storage,randomUUID);
 for(const item of items)await store.complete(null,done(item));
 store=createDiscoveryStore(storage,randomUUID);await store.mergeGuest('member');
 assert.equal(Object.keys((await store.progress('member')).pending).length,3);
 await store.sync('member',async()=> 'member',async events=>({results:events.map(e=>({eventId:e.eventId,status:'accepted',completion:{discovery_id:e.discoveryId,revision:e.revision,event_id:e.eventId,mode:e.mode,option_id:e.optionId,occurred_at:e.occurredAt,local_date:e.localDate,time_zone:'UTC',outcome:e.setPosition===2 ? 'incorrect':'correct',puzzle_date:e.puzzleDate,set_position:e.setPosition}}))}));
 const progress=await store.progress('member');assert.equal(Object.keys(progress.pending).length,0);
 assert.deepEqual(dailySetResults(items,progress.completions),['correct','incorrect','correct']);
});
