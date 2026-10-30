import assert from 'node:assert/strict';
import Colors from '../constants/Colors.ts';
const luminance = hex => {
 const rgb = hex.slice(1).match(/../g).map(x => parseInt(x,16)/255).map(c => c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)**2.4);
 return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
};
const ratio = (a,b) => { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };
for (const name of ['light','dark']) {
 const theme=Colors[name];
 for (const [text,surface] of [['text','background'],['text','card'],['text','readingSurface'],['mutedForeground','background'],['mutedForeground','card'],['tint','selection'],['success','successSurface'],['text','successSurface'],['onAction','action'],['onTint','tint'],['error','errorSurface'],['onDisabled','disabled']]) {
  const contrast=ratio(theme[text],theme[surface]);
  assert.ok(contrast>=4.5, `${name} ${text}/${surface}: ${contrast.toFixed(2)} below 4.5`);
 }
 assert.ok(ratio(theme.focus,theme.card)>=3, `${name} focus below 3:1`);
}
console.log('Verified semantic text/action/error/disabled contrast (4.5:1) and focus contrast (3:1) in both themes.');
