// Campaign metadata only: never accept answers, prayer text, emails or full URLs.
export const CAMPAIGN_KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','campaign_id','adset_id','ad_id','placement'] as const;
export type Campaign = Partial<Record<typeof CAMPAIGN_KEYS[number], string>>;
export const ATTRIBUTION_TTL = 30 * 24 * 60 * 60 * 1000;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function cleanCampaign(input: unknown): Campaign {
 const result: Campaign = {};
 if (!input || typeof input !== 'object' || Array.isArray(input)) return result;
 for (const key of CAMPAIGN_KEYS) {
  const value = (input as Record<string,unknown>)[key];
  if (typeof value === 'string' && value.length <= 100 && /^[a-zA-Z0-9 _.,()~:+-]+$/.test(value)) result[key] = value;
 }
 return result;
}
export function campaignFromParams(params: URLSearchParams): Campaign {
 return cleanCampaign(Object.fromEntries(CAMPAIGN_KEYS.map(key => [key, params.get(key)])));
}
export function campaignToken(campaign: Campaign) {
 const token=[campaign.utm_source, campaign.utm_campaign, campaign.utm_content].filter(Boolean).join('_').replace(/[^a-zA-Z0-9_-]/g,'_') || 'sanctuary_web';
 if(token.length<=30)return token;
 let hash=2166136261;for(const char of token)hash=Math.imul(hash^char.charCodeAt(0),16777619);
 return token.slice(0,21)+'_'+(hash>>>0).toString(16).padStart(8,'0');
}
export const FUNNEL_EVENTS = ['trivia_landing_view','trivia_quiz_started','trivia_set_opened','trivia_round_started','trivia_round_completed','trivia_set_completed','trivia_share_initiated','app_download_cta','store_click','app_first_open','app_open'] as const;
export type FunnelEvent = typeof FUNNEL_EVENTS[number];
export type FunnelRecord = {
 event_id: string; event: FunnelEvent; platform: 'web'|'ios'|'android';
 visitor_id: string; session_id: string; click_id?: string; store_platform?: 'ios'|'android';
 quiz_run_id?: string; quiz_date?: string;
 first_touch: Campaign; last_touch: Campaign; is_test: boolean;
};
export type QuizContext = {quiz_run_id:string;quiz_date:string};
export function isQuizDate(value:unknown):value is string {return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function parseFunnelRecord(value: unknown): FunnelRecord | null {
 if (!value || typeof value !== 'object') return null;
 const b=value as Record<string,unknown>;
 if (!UUID.test(String(b.event_id)) || !UUID.test(String(b.visitor_id)) || !UUID.test(String(b.session_id)) || !FUNNEL_EVENTS.includes(b.event as FunnelEvent) || !['web','ios','android'].includes(String(b.platform))) return null;
 if(b.quiz_run_id!=null||b.quiz_date!=null||b.event==='trivia_quiz_started'){if(!String(b.event).startsWith('trivia_')||!UUID.test(String(b.quiz_run_id))||!isQuizDate(b.quiz_date))return null;}
 if (b.click_id != null && !UUID.test(String(b.click_id))) return null;
 if (b.store_platform != null && (b.event!=='store_click'||!['ios','android'].includes(String(b.store_platform)))) return null;
 if (['app_first_open','app_open'].includes(String(b.event)) ? b.platform === 'web' : b.platform !== 'web') return null;
 return {event_id:String(b.event_id),event:b.event as FunnelEvent,platform:b.platform as FunnelRecord['platform'],visitor_id:String(b.visitor_id),session_id:String(b.session_id),...(b.click_id ? {click_id:String(b.click_id)}:{}),...(b.store_platform ? {store_platform:b.store_platform as 'ios'|'android'}:{}),...(b.quiz_run_id ? {quiz_run_id:String(b.quiz_run_id),quiz_date:String(b.quiz_date)}:{}),first_touch:cleanCampaign(b.first_touch),last_touch:cleanCampaign(b.last_touch),is_test:b.is_test===true};
}
export function storeDestination(platform: 'ios'|'android', campaign: Campaign, clickId: string, providerToken?: string, firstCampaign?: Campaign) {
 const url = new URL(platform === 'ios' ? 'https://apps.apple.com/us/app/sanctuary-daily-faith-focus/id6757966099' : 'https://play.google.com/store/apps/details?id=us.sanctuaryapp.app');
 if (platform === 'android') {
  const referrer=new URLSearchParams(cleanCampaign(campaign));
  if (UUID.test(clickId)) referrer.set('sanctuary_click_id',clickId);
  if(firstCampaign && Object.keys(firstCampaign).length)referrer.set('sanctuary_first_touch',JSON.stringify(cleanCampaign(firstCampaign)));
  url.searchParams.set('referrer',referrer.toString());
 } else if (providerToken && /^\d+$/.test(providerToken)) {
  url.searchParams.set('pt',providerToken);url.searchParams.set('ct',campaignToken(campaign));url.searchParams.set('mt','8');
 }
 return url.toString();
}
