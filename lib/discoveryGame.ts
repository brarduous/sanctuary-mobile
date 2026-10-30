export const TRIVIA_DURATION_MS=20_000;
export const ELIMINATION_AT_MS=[7_000,14_000] as const;
export type TriviaOutcome='correct'|'incorrect'|'timeout'|'revealed';
export type TriviaTiming={elapsedMs:number;timedOut?:boolean};
export type TriviaRound={startedAt:number;lastElapsedMs:number;durationMs:typeof TRIVIA_DURATION_MS};
export type TriviaResult={elapsedMs?:number;outcome?:TriviaOutcome;puzzleDate?:string|null;localDate:string};
export type StreakMode='correct'|'played';
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
function validDate(date:string) {
  if(!datePattern.test(date))return false;
  const value=new Date(`${date}T12:00:00Z`);
  return Number.isFinite(value.getTime()) && value.toISOString().slice(0,10)===date;
}
export function shiftTriviaDate(date:string,days:number) {
  const value=new Date(`${date}T12:00:00Z`);value.setUTCDate(value.getUTCDate()+days);return value.toISOString().slice(0,10);
}
export function triviaElapsed(round:TriviaRound,now:number,monotonicElapsed=0) {
  return Math.min(TRIVIA_DURATION_MS,Math.max(0,round.lastElapsedMs,now-round.startedAt,monotonicElapsed));
}
export function isTriviaRound(value:unknown):value is TriviaRound {
  const x=value as TriviaRound;
  return Boolean(x && Number.isFinite(x.startedAt) && x.startedAt>0 && x.durationMs===TRIVIA_DURATION_MS && Number.isFinite(x.lastElapsedMs) && x.lastElapsedMs>=0 && x.lastElapsedMs<=TRIVIA_DURATION_MS);
}
export function eliminatedChoices(item:{id:string;revision:number;correctOptionId:string;choices:{id:string}[]},elapsedMs:number) {
  const count=ELIMINATION_AT_MS.filter(at=>elapsedMs>=at).length;
  const hash=(text:string)=>{let value=2166136261;for(const letter of text)value=Math.imul(value^letter.charCodeAt(0),16777619);return value>>>0;};
  return item.choices.filter(choice=>choice.id!==item.correctOptionId)
    .sort((a,b)=>hash(`${item.id}:${item.revision}:${a.id}`)-hash(`${item.id}:${item.revision}:${b.id}`))
    .slice(0,count).map(choice=>choice.id);
}
export function formatTriviaTime(elapsedMs?:number) {
  return elapsedMs===undefined ? '—' : `${(Math.max(0,Math.min(TRIVIA_DURATION_MS,elapsedMs))/1000).toFixed(1)}s`;
}
export function triviaStats(results:TriviaResult[],today:string,mode:StreakMode='correct') {
  const days=new Map<string,TriviaResult>();
  for(const result of results) {
    if(!result.outcome || !result.puzzleDate || !validDate(result.puzzleDate) || result.puzzleDate!==result.localDate || result.puzzleDate>today)continue;
    // One daily result. Callers supply canonical first-accepted completions.
    if(!days.has(result.puzzleDate))days.set(result.puzzleDate,result);
  }
  const qualifies=(day:string)=>{const result=days.get(day);return Boolean(result && (mode==='played' || result.outcome==='correct'));};
  let current=0,best=0,run=0,previous:string|null=null;
  for(const day of [...days.keys()].sort()) {
    run=qualifies(day) ? (previous && shiftTriviaDate(previous,1)===day ? run+1:1):0;
    best=Math.max(best,run);previous=day;
  }
  const anchor=qualifies(today) ? today : !days.has(today) ? shiftTriviaDate(today,-1):null;
  if(anchor)for(let day=anchor;qualifies(day);day=shiftTriviaDate(day,-1))current++;
  const history=Array.from({length:7},(_,i)=>{
    const date=shiftTriviaDate(today,i-6);return {date,outcome:days.get(date)?.outcome || null};
  });
  return {current,best,history};
}
function ordinal(day:number) {
  const remainder=day%100;
  const suffix=remainder>=11 && remainder<=13 ? 'th' : day%10===1 ? 'st' : day%10===2 ? 'nd' : day%10===3 ? 'rd' : 'th';
  return `${day}${suffix}`;
}
export function triviaShareText(input:{outcome?:TriviaOutcome;streak:number;playedToday?:boolean}) {
  if(input.playedToday===false)return 'I played Sanctuary trivia. Give it a try!\nhttps://sanctuaryapp.us/discoveries';
  const sentence=input.outcome==='correct'
    ? input.streak>1 ? `I answered Sanctuary trivia correctly for the ${ordinal(input.streak)} day in a row!` : 'I answered Sanctuary trivia correctly today!'
    : 'I played Sanctuary trivia today. Give it a try!';
  return `${sentence}\nhttps://sanctuaryapp.us/discoveries`;
}
