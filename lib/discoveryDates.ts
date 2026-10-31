// Trivia dates are calendar dates, never instants shifted by the viewer's timezone.
export function isTriviaDate(value:unknown):value is string {
 return typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
}
export function formatTriviaDate(date:string) {
 if(!isTriviaDate(date))return '';
 const [year,month,day]=date.split('-');
 return `${month}/${day}/${year}`;
}
export function shiftTriviaDate(date:string,days:number) {
 const value=new Date(`${date}T12:00:00Z`);value.setUTCDate(value.getUTCDate()+days);return value.toISOString().slice(0,10);
}
export function triviaDateAccess(date:string,today:string,isPro:boolean) {
 if(!isTriviaDate(date) || date>today)return 'unavailable';
 return date<today && !isPro ? 'pro-required':'allowed';
}
