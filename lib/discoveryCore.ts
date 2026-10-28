export type DiscoverySource = { id: string; type: 'scripture' | 'primary' | 'scholarly' | 'official_tradition'; title: string; publisher: string; url: string; locator: string; excerpt: string; rights: string };
export type Discovery = {
  id: string; revision: number; publicationDate: string | null; kind: 'biblical_text' | 'historical' | 'tradition';
  category: string; prompt: string; heading: string; scopeNote: string; traditionLabel?: string;
  choices: { id: string; text: string }[]; correctOptionId: string; explanation: string;
  sources: DiscoverySource[]; claims: { id: string; text: string; sourceIds: string[] }[];
  answerClaimId: string; explanationClaimIds: string[]; scriptureReference?: string; translation?: string;
  url: string; correctionNotice?: string | null;
  difficulty?: {rubricVersion: 'discovery-difficulty-v1';level:'easy'|'moderate'|'challenging';score:number};
};
export type DiscoveryBundle = { schemaVersion: 1; enabled: boolean; items: Discovery[]; evergreen: Discovery[]; withdrawnIds: string[]; bundleRevision: string; serverTime: string };
export type DiscoveryCompletion = { eventId: string; discoveryId: string; revision: number; mode: 'answered' | 'revealed'; optionId: string | null; occurredAt: string; localDate: string; timeZone: string; elapsedMs?:number; outcome?:'correct'|'incorrect'|'timeout'|'revealed'; puzzleDate?:string|null; timedOut?:boolean };
export type DiscoveryProgress = { total: number; completions: Record<string, DiscoveryCompletion>; pending: Record<string, DiscoveryCompletion> };
export type SyncResult = { eventId: string; status: 'accepted' | 'unavailable'; completion?: { discovery_id: string; revision: number; mode: 'answered' | 'revealed'; option_id: string | null; event_id: string; occurred_at: string; local_date: string; time_zone: string; elapsed_ms?:number|null; outcome?:DiscoveryCompletion['outcome']|null; puzzle_date?:string|null } };

export function discoveryLocalDate(now = new Date(), timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year','month','day'].map(type => parts.find(part => part.type === type)!.value).join('-');
}
export function isDiscovery(value: unknown): value is Discovery {
  if (!value || typeof value !== 'object') return false;
  const item = value as Discovery;
  return typeof item.id === 'string' && /^[a-f0-9-]{36}$/i.test(item.id) && Number.isInteger(item.revision) && item.revision > 0
    && ['biblical_text','historical','tradition'].includes(item.kind)
    && ['prompt','heading','scopeNote','category','explanation','url'].every(key => typeof item[key as keyof Discovery] === 'string')
    && Array.isArray(item.choices) && item.choices.length === 4 && item.choices.every(choice => typeof choice.id === 'string' && typeof choice.text === 'string')
    && new Set(item.choices.map(choice => choice.id)).size === 4 && item.choices.some(choice => choice.id === item.correctOptionId)
    && Array.isArray(item.sources) && item.sources.length > 0 && item.sources.every(source => typeof source.url === 'string' && /^https:\/\//.test(source.url) && typeof source.excerpt === 'string' && typeof source.locator === 'string')
    && Array.isArray(item.claims) && Array.isArray(item.explanationClaimIds)
    && (item.difficulty==null || (item.difficulty.rubricVersion==='discovery-difficulty-v1' && Number.isInteger(item.difficulty.score) && item.difficulty.score>=0 && item.difficulty.score<=8 && item.difficulty.level===(item.difficulty.score<=2 ? 'easy':item.difficulty.score<=5 ? 'moderate':'challenging')));
}
export function discoveryDifficultyLabel(item:Discovery) {
  return item.difficulty ? {easy:'Easy',moderate:'Moderate',challenging:'Challenging'}[item.difficulty.level] : null;
}
export function isDiscoveryBundle(value: unknown): value is DiscoveryBundle {
  if (!value || typeof value !== 'object') return false;
  const bundle = value as DiscoveryBundle;
  return bundle.schemaVersion === 1 && typeof bundle.enabled === 'boolean' && Array.isArray(bundle.items) && bundle.items.length <= 20 && bundle.items.every(isDiscovery)
    && Array.isArray(bundle.evergreen) && bundle.evergreen.length <= 10 && bundle.evergreen.every(isDiscovery)
    && Array.isArray(bundle.withdrawnIds) && bundle.withdrawnIds.every(id => typeof id === 'string') && typeof bundle.bundleRevision === 'string' && typeof bundle.serverTime === 'string';
}
export function selectDiscovery(bundle: DiscoveryBundle | null, today = discoveryLocalDate()) {
  if (!bundle?.enabled) return null;
  const scheduled = bundle.items.find(item => item.publicationDate === today && !bundle.withdrawnIds.includes(item.id));
  if (scheduled) return { item: scheduled, isToday: true };
  const fallback = bundle.evergreen.find(item => !bundle.withdrawnIds.includes(item.id) && (!item.publicationDate || item.publicationDate <= today));
  return fallback ? { item: fallback, isToday: false } : null;
}
export function discoveryShareText(item: Discovery, fact = false) {
  return fact ? `${item.heading}\n\n${item.explanation}\n\n${item.sources.map(source => source.locator).join('; ')}\n${item.url}`
    : `${discoveryDifficultyLabel(item) ? `${discoveryDifficultyLabel(item)} · Daily Discovery\n\n`:''}${item.prompt}\n\n${item.choices.map((choice,index) => `${String.fromCharCode(65+index)}. ${choice.text}`).join('\n')}\n\nExplore with Sanctuary\n${item.url}`;
}
