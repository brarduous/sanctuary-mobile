const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function load(file,mocks,extra={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,require:n=>mocks[n]||require(n),URL,URLSearchParams,Date,AbortController,console,process,setTimeout,clearTimeout,setInterval,clearInterval,__DEV__:false,...extra});return module.exports;}
const core=load('lib/attributionCore.ts',{});
function native({old=false,offline=false,releaseAt='2026-11-03T15:30:00Z',isTest=false,remoteReleaseAt=null,referrerTest=false}={}){
 const storage=new Map(),requests=[];let failures=offline?1:0;
 const click=crypto.randomUUID(),first={utm_source:'instagram',utm_campaign:'first'},last={utm_source:'meta',utm_campaign:'trivia_first20',utm_content:'quiz_v2'};
 const ref=new URLSearchParams({...last,sanctuary_click_id:click,sanctuary_first_touch:JSON.stringify(first),...(referrerTest?{sanctuary_test:'1'}:{})}).toString();
 const mocks={'@react-native-async-storage/async-storage':{getItem:async k=>storage.get(k)||null,setItem:async(k,v)=>storage.set(k,v)},'expo-application':{getInstallReferrerAsync:async()=>ref,getInstallationTimeAsync:async()=>new Date(old?'2026-10-01T12:00:00Z':'2026-11-04T12:00:00Z')},'expo-crypto':{randomUUID:()=>crypto.randomUUID()},'expo-linking':{},'react-native':{Platform:{OS:'android'}},'./attributionCore':core};
 const fetch=async(_url,opts)=>{if(!opts.body)return {ok:true,json:async()=>({androidReleaseAt:remoteReleaseAt,iosReleaseAt:remoteReleaseAt})};requests.push(JSON.parse(opts.body));return {ok:failures-->0?false:true};};
 return {api:load('lib/acquisition.ts',mocks,{fetch,process:{env:{EXPO_PUBLIC_ATTRIBUTION_RELEASE_AT:releaseAt,EXPO_PUBLIC_ATTRIBUTION_TEST:String(isTest)}}}),requests,storage,click,first,last};
}
test('Android install referrer preserves original and last campaign, and concurrent startup sends once',async()=>{
 const n=native();await Promise.all([n.api.flushAcquisition(),n.api.flushAcquisition()]);
 assert.equal(n.requests.length,1);assert.equal(n.requests[0].event,'app_first_open');assert.equal(n.requests[0].click_id,n.click);assert.equal(n.requests[0].first_touch.utm_campaign,'first');assert.equal(n.requests[0].last_touch.utm_campaign,'trivia_first20');
 await n.api.flushAcquisition();assert.equal(n.requests.length,1);
});
test('offline first-open retries the same event without losing attribution',async()=>{
 const n=native({offline:true});await assert.rejects(n.api.flushAcquisition());await n.api.flushAcquisition();assert.equal(n.requests.length,2);assert.equal(n.requests[0].event_id,n.requests[1].event_id);assert.equal(n.requests[1].click_id,n.click);
});
test('existing app update cannot be reported as a new install',async()=>{
 const n=native({old:true});await n.api.flushAcquisition();assert.equal(n.requests[0].event,'app_open');
});
test('unpublished or invalid cutoff waits without permanently classifying an install',async()=>{
 for(const releaseAt of ['', 'not-a-date']){const n=native({releaseAt});await assert.rejects(n.api.flushAcquisition(),/publication date pending/);assert.equal(n.requests.length,0);assert.equal(n.storage.size,0);}
});
test('remote store publication dates distinguish a new install from an existing update',async()=>{
 for(const old of [true,false]){const n=native({old,releaseAt:'',remoteReleaseAt:'2026-11-03T15:30:00Z'});await n.api.flushAcquisition();assert.equal(n.requests[0].event,old?'app_open':'app_first_open');}
});
test('internal release-mode builds mark native observations as test traffic',async()=>{
 const n=native({isTest:true});await n.api.flushAcquisition();assert.equal(n.requests[0].is_test,true);
});
test('marked Play test installs verify first-open attribution before publication without entering real totals',async()=>{
 const n=native({referrerTest:true,releaseAt:'',remoteReleaseAt:null});await n.api.flushAcquisition();assert.equal(n.requests[0].event,'app_first_open');assert.equal(n.requests[0].is_test,true);assert.equal(n.requests[0].click_id,n.click);assert.equal(n.requests[0].last_touch.utm_campaign,'trivia_first20');
});
function metaNative({platform='ios',status='granted',requestResult='granted',identifier='advertising-id',enabled=true,active=true,physical=true}={}){
 const calls=[],os={OS:platform},appState={currentState:active?'active':'background'};let permission=status;
 const mocks={
  'react-native':{Platform:os,AppState:appState},
  'expo-device':{isDevice:physical},
  'expo-tracking-transparency':{
   getTrackingPermissionsAsync:async()=>({status:permission,canAskAgain:permission==='undetermined'}),
   requestTrackingPermissionsAsync:async()=>{calls.push('request');permission=requestResult;return {status:permission,canAskAgain:false};},
   getAdvertisingId:()=>identifier,
  },
  'react-native-fbsdk-next':{Settings:{initializeSDK:()=>calls.push('initialize'),setAutoLogAppEventsEnabled:v=>calls.push('auto:'+v),setAdvertiserIDCollectionEnabled:v=>calls.push('id:'+v),setAdvertiserTrackingEnabled:async v=>{calls.push('tracking:'+v);return v;}}},
 };
 const api=load('lib/metaAttribution.ts',mocks,{process:{env:{EXPO_PUBLIC_META_APP_EVENTS_ENABLED:enabled?'true':'false'}}});
 return {api,calls,setPermission:value=>{permission=value;},appState};
}
test('Meta initializes once after granted ATT, even during concurrent startup',async()=>{
 const n=metaNative({status:'undetermined'});await Promise.all([n.api.syncMetaAttribution({requestPermission:true}),n.api.syncMetaAttribution({requestPermission:true})]);
 assert.deepEqual(n.calls.slice(0,2),['request','initialize']);assert.equal(n.calls.filter(c=>c==='initialize').length,1);
 await n.api.syncMetaAttribution();assert.equal(n.calls.filter(c=>c==='initialize').length,1);
});
test('denied ATT never initializes Meta or enables identifier collection',async()=>{
 const n=metaNative({status:'denied'});assert.equal(await n.api.syncMetaAttribution({requestPermission:true}),false);assert.deepEqual(n.calls,[]);
});
test('foreground checks never prompt for undetermined ATT',async()=>{
 const n=metaNative({status:'undetermined'});assert.equal(await n.api.syncMetaAttribution(),false);assert.deepEqual(n.calls,[]);
});
test('revoked permission disables automatic events and advertising identifiers',async()=>{
 const n=metaNative();await n.api.syncMetaAttribution();n.calls.length=0;n.setPermission('denied');await n.api.syncMetaAttribution();assert.deepEqual(n.calls,['auto:false','id:false','tracking:false']);
});
test('Android advertising opt-out and disabled or non-device builds do not start Meta',async()=>{
 for(const settings of [{platform:'android',identifier:null},{enabled:false},{physical:false},{active:false}]){const n=metaNative(settings);assert.equal(await n.api.syncMetaAttribution({requestPermission:true}),false);assert.deepEqual(n.calls,[]);}
});
