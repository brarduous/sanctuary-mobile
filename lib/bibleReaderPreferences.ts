export type BibleVersion='WEB'|'ASV'|'NIV'|'KJV';
export type BibleTextSize='normal'|'large'|'extra';
export function resolveBibleReaderPreferences(version:string | null,size:string | null) {
  return {
    version:(['WEB','ASV','NIV','KJV'].includes(version || '') ? version : 'WEB') as BibleVersion,
    textSize:(['normal','large','extra'].includes(size || '') ? size : 'normal') as BibleTextSize,
  };
}
