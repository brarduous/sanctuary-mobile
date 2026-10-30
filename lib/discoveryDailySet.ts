import type {Discovery,DiscoveryBundle,DiscoveryCompletion} from './discoveryCore.ts';
export const DAILY_LABELS=['Easy','Medium','Hard'] as const;
export type DailyResult='correct'|'incorrect'|'timeout'|'revealed'|null;
export function dailySetForDate(bundle:DiscoveryBundle|null,date:string):Discovery[] {
 if(!bundle?.enabled)return [];
 const items=bundle.items.filter(item=>item.publicationDate===date && item.setPosition && !bundle.withdrawnIds.includes(item.id)).sort((a,b)=>a.setPosition!-b.setPosition!);
 return items.length===3 && new Set(items.map(item=>item.id)).size===3 && items.every((item,i)=>item.setPosition===i+1) ? items:[];
}
export function dailySetResults(items:Discovery[],completions:Record<string,DiscoveryCompletion>):DailyResult[] {
 return [0,1,2].map(i=>{
  const item=items[i],done=item && completions[item.id];
  return done && done.revision===item.revision && done.puzzleDate===item.publicationDate ? done.outcome || (done.mode==='revealed' ? 'revealed':done.optionId===item.correctOptionId ? 'correct':'incorrect'):null;
 });
}
export function dailyResultLabel(result:DailyResult) {
 return result===null ? 'Not played':result==='correct' ? 'Correct':result==='timeout' ? 'Time’s up':result==='revealed' ? 'Revealed':'Incorrect';
}
export function dailySetShareText(date:string,results:DailyResult[]) {
 const row=[0,1,2].map(i=>results[i]==='correct' ? '🟩':results[i] ? '🟥':'⬜').join('');
 const correct=results.filter(r=>r==='correct').length,played=results.filter(Boolean).length;
 return `Sanctuary Trivia · ${date}\n${row}\nEasy · Medium · Hard\n${correct}/3 correct${played<3 ? ` · ${played}/3 played`:''}\nhttps://sanctuaryapp.us/discoveries?date=${encodeURIComponent(date)}`;
}
// A win means all three correct that day. A partial set cannot earn a win.
export function dailySetStreak(completions:DiscoveryCompletion[],today:string) {
 const days=new Map<string,Map<number,DiscoveryCompletion>>();
 for(const result of completions) {
  if(!result.setPosition || !result.puzzleDate || result.puzzleDate!==result.localDate || result.puzzleDate>today)continue;
  const day=days.get(result.puzzleDate) || new Map<number,DiscoveryCompletion>();
  if(!day.has(result.setPosition))day.set(result.setPosition,result);
  days.set(result.puzzleDate,day);
 }
 const wins=(date:string)=>{const rows=days.get(date);return rows?.size===3 && [...rows.values()].every(r=>r.outcome==='correct');};
 const shift=(date:string,n:number)=>{const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 let cursor=wins(today) ? today:days.get(today)?.size===3 ? null:shift(today,-1),current=0;
 while(cursor && wins(cursor)){current++;cursor=shift(cursor,-1);}
 return current;
}
