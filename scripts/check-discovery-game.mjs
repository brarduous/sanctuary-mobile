import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {TRIVIA_DURATION_MS,triviaClock,isTriviaRound,triviaElapsed,eliminatedChoices,triviaStats,triviaShareText,formatTriviaTime} from '../lib/discoveryGame.ts';
import {createDiscoveryStore} from '../lib/discoveryStore.ts';
const item={id:'a',revision:1,correctOptionId:'c',choices:['a','b','c','d'].map(id=>({id}))};
function storage(){const map=new Map();return {map,async getItem(k){return map.get(k)||null;},async setItem(k,v){map.set(k,v);},async removeItem(k){map.delete(k);}};}
test('timer bounds, deterministic elimination, and monotonic time never expose the answer early',()=>{
 const round={startedAt:1000,lastElapsedMs:8000,durationMs:TRIVIA_DURATION_MS};
 assert.equal(triviaElapsed(round,900),8000);assert.equal(triviaElapsed(round,1500,9000),9000);assert.equal(triviaElapsed(round,50000),40000);
 assert.deepEqual(eliminatedChoices(item,26999),[]);assert.equal(eliminatedChoices(item,27000).length,1);assert.equal(eliminatedChoices(item,34000).length,2);
 assert.equal(eliminatedChoices(item,40000).length,2);assert.ok(!eliminatedChoices(item,40000).includes('c'));
 assert.deepEqual(eliminatedChoices(item,34000),eliminatedChoices(item,34000));
});
test('a reopened round retains its deadline, checkpoints, and account isolation',async()=>{
 const disk=storage();let store=createDiscoveryStore(disk,randomUUID);
 const first=await store.beginRound('alice','a',1,1000);
 await store.checkpointRound('alice','a',1,10000);
 store=createDiscoveryStore(disk,randomUUID);
 const reopened=await store.beginRound('alice','a',1,15000);
 assert.equal(reopened.startedAt,first.startedAt);assert.equal(reopened.lastElapsedMs,10000);
 assert.equal(await store.round('bob','a',1),null);
 assert.equal((await store.beginRound('bob','a',1,18000)).startedAt,18000);
 await store.clearAccount('alice');assert.equal(await store.round('alice','a',1),null);assert.ok(await store.round('bob','a',1));
});
test('daily win streaks cross month/DST boundaries, break on losses and gaps, and exclude archives',()=>{
 const result=(date,outcome='correct',localDate=date)=>({puzzleDate:date,localDate,outcome});
 let stats=triviaStats([result('2026-10-30'),result('2026-10-31'),result('2026-11-01')],'2026-11-01');assert.equal(stats.current,3);assert.equal(stats.best,3);
 assert.equal(triviaStats([result('2026-10-31')],'2026-11-01').current,1,'yesterday stays active until today is played');
 assert.equal(triviaStats([result('2026-10-31'),result('2026-11-01','incorrect')],'2026-11-01').current,0);
 assert.equal(triviaStats([result('2026-10-30')],'2026-11-01').current,0);
 assert.equal(triviaStats([result('2026-10-31','correct','2026-11-01')],'2026-11-01').current,0,'practice cannot inflate a daily streak');
});
test('simple result sharing is truthful, spoiler-free, and uses correct ordinal streaks',()=>{
 const single=triviaShareText({outcome:'correct',streak:1});
 assert.equal(triviaShareText({outcome:'correct',streak:5,playedToday:false}),'I played Sanctuary trivia. Give it a try!\nhttps://sanctuaryapp.us/discoveries');
 assert.equal(single,'I answered Sanctuary trivia correctly today!\nhttps://sanctuaryapp.us/discoveries');
 for(const [n,ordinal] of [[2,'2nd'],[3,'3rd'],[4,'4th'],[11,'11th'],[12,'12th'],[13,'13th'],[21,'21st'],[22,'22nd'],[23,'23rd'],[111,'111th']])assert.ok(triviaShareText({outcome:'correct',streak:n}).includes(`${ordinal} day in a row!`));
 for(const outcome of ['incorrect','timeout','revealed',undefined]) {
   const text=triviaShareText({outcome,streak:5});
   assert.equal(text,'I played Sanctuary trivia today. Give it a try!\nhttps://sanctuaryapp.us/discoveries');
   assert.ok(!text.includes('correctly'));
 }
 for(const forbidden of ['🟩','⬜','Rainbow','Genesis','option-1','According to','/discoveries/'])assert.ok(!single.includes(forbidden));
 assert.equal(formatTriviaTime(undefined),'—');
 for(const path of ['../../sanctuary-layperson-web/src/lib/discoveryGame.ts','../../sanctuary-marketing-home/lib/discoveryGame.ts'])assert.equal(readFileSync(new URL('../lib/discoveryGame.ts',import.meta.url),'utf8'),readFileSync(new URL(path,import.meta.url),'utf8'),'all trivia clients use the same rules');
});

test('reading time permits answers with the full countdown intact, and each boundary is exact',()=>{
 assert.deepEqual(triviaClock(0),{reading:true,readingRemaining:20,remaining:20,expired:false});
 assert.deepEqual(triviaClock(19999),{reading:true,readingRemaining:1,remaining:20,expired:false});
 assert.deepEqual(eliminatedChoices(item,20000),[]);
 assert.deepEqual(triviaClock(20000),{reading:false,readingRemaining:0,remaining:20,expired:false});
 assert.equal(triviaClock(39999).remaining,1);assert.equal(triviaClock(40000).expired,true);
 assert.equal(formatTriviaTime(35000),'35.0s');
 const legacy={startedAt:1000,lastElapsedMs:0,durationMs:20000};
 assert.equal(isTriviaRound(legacy),true);assert.equal(triviaElapsed(legacy,50000),20000);
 assert.equal(triviaClock(7000,legacy.durationMs).reading,false);
 assert.equal(eliminatedChoices(item,7000,legacy.durationMs).length,1);
 assert.equal(triviaClock(20000,legacy.durationMs).expired,true);
 assert.equal(isTriviaRound({...legacy,durationMs:30000}),false);
});
test('legacy saved rounds restore without restarting their clock or changing their deadline',async()=>{
 const disk=storage();let store=createDiscoveryStore(disk,randomUUID);
 await store.beginRound(null,'a',1,1000);
 disk.map.set('discovery:v1:rounds:guest:a:1',JSON.stringify({startedAt:1000,lastElapsedMs:8000,durationMs:20000}));
 store=createDiscoveryStore(disk,randomUUID);
 const round=await store.beginRound(null,'a',1,12000);
 assert.equal(round.durationMs,20000);assert.equal(round.startedAt,1000);
 await store.checkpointRound(null,'a',1,35000);
 assert.equal((await store.round(null,'a',1)).lastElapsedMs,20000);
});
