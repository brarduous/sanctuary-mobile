const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{act,create}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
test('trivia haptics follow the system preference, skip background work and tolerate unavailable hardware',async()=>{
 const calls=[];let listener,value,removed=false,fail=false;
 const appState={currentState:'active'},exportsObject={};
 const haptics={NotificationFeedbackType:{Success:'success'},async selectionAsync(){if(fail)throw new Error('No haptic engine');calls.push('selection');},async notificationAsync(type){calls.push(type);}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/useTriviaFeedback.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports:exportsObject,require(name){
  if(name==='expo-haptics')return haptics;
  if(name==='react-native')return {AppState:appState,AccessibilityInfo:{async isReduceMotionEnabled(){return false;},addEventListener(_event,callback){listener=callback;return {remove(){removed=true;}};}}};
  return require(name);
 }});
 function Probe(){value=exportsObject.default();return null;}
 let renderer;await act(async()=>{renderer=create(React.createElement(Probe));});
 value('selection');value('correct');assert.deepEqual(calls,['selection','success']);
 await act(async()=>listener(true));value('selection');assert.equal(calls.length,2);
 await act(async()=>listener(false));appState.currentState='background';value('correct');assert.equal(calls.length,2);
 appState.currentState='active';fail=true;
 assert.doesNotThrow(()=>value('selection'));await new Promise(resolve=>setImmediate(resolve));
 await act(async()=>renderer.unmount());assert.equal(removed,true);
});
