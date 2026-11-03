const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function load(file,mocks,extra={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,require:n=>mocks[n]||require(n),URL,URLSearchParams,Date,AbortController,console,process,setTimeout,clearTimeout,setInterval,clearInterval,__DEV__:false,...extra});return module.exports;}
const core=load('lib/attributionCore.ts',{});
function native({old=false,offline=false}={}){
 const storage=new Map(),requests=[];let failures=offline?1:0;
 const click=crypto.randomUUID(),first={utm_source:'instagram',utm_campaign:'first'},last={utm_source:'meta',utm_campaign:'trivia_first20',utm_content:'quiz_v2'};
 const ref=new URLSearchParams({...last,sanctuary_click_id:click,sanctuary_first_touch:JSON.stringify(first)}).toString();
 const mocks={'@react-native-async-storage/async-storage':{getItem:async k=>storage.get(k)||null,setItem:async(k,v)=>storage.set(k,v)},'expo-application':{getInstallReferrerAsync:async()=>ref,getInstallationTimeAsync:async()=>new Date(old?'2026-10-01T12:00:00Z':'2026-11-04T12:00:00Z')},'expo-crypto':{randomUUID:()=>crypto.randomUUID()},'expo-linking':{},'react-native':{Platform:{OS:'android'}},'./attributionCore':core};
 const fetch=async(_url,opts)=>{requests.push(JSON.parse(opts.body));return {ok:failures-->0?false:true};};
 return {api:load('lib/acquisition.ts',mocks,{fetch}),requests,storage,click,first,last};
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
