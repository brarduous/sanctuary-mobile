const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const React=require('react');
const {act,create}=require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
test('mount never requests permission; cold notification is routed once and token refresh respects the grant',async()=>{
 let status='denied',prompts=0,clears=0,responseListener,foreground,pushes=[],value;
 const registrations=[];const profileWrites=[];const profileQuery={update(value){profileWrites.push(value);return this;},eq(){return this;},select(){return this;},async single(){return {data:{user_id:'current-user'},error:null};}};
 let cold={actionIdentifier:'default',notification:{request:{identifier:'cold',content:{data:{url:'/discoveries/test',notificationDeliveryId:'delivery'}}}}};
 const notifications={
  setNotificationHandler(){},async getPermissionsAsync(){return {status};},async requestPermissionsAsync(){prompts++;return {status:'granted'};},
  async getDevicePushTokenAsync(){return {type:'ios',data:'test-device-token'};},async getExpoPushTokenAsync(){return {data:'ExponentPushToken[test]'};},
  async getLastNotificationResponseAsync(){return cold;},async clearLastNotificationResponseAsync(){clears++;cold=null;},
  addPushTokenListener(){return {remove(){}};},addNotificationReceivedListener(){return {remove(){}};},
  addNotificationResponseReceivedListener(listener){responseListener=listener;return {remove(){}};}
 };
 const exportsObject={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/pushNotifications.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,{exports:exportsObject,console,alert:()=>{throw new Error('Permission denial should not alert');},require(name){
  const mocks={'expo-constants':{expoConfig:{extra:{eas:{projectId:'test-project'}}}},'expo-device':{isDevice:true},'expo-notifications':notifications,'@react-native-async-storage/async-storage':{async getItem(){return 'complete';}},'react-native':{Platform:{OS:'ios'},AppState:{addEventListener(_event,listener){foreground=listener;return {remove(){}};}}},'expo-router':{router:{push:url=>pushes.push(url)}},'./supabase':{supabase:{from:()=>profileQuery}},'./api':{recordNotificationOpen:async()=>{},registerNotificationCapabilities:async(token,version)=>registrations.push({token,version})}};
  return name in mocks ? mocks[name]:require(name);
 }});
 function Probe(){value=exportsObject.usePushNotifications();return null;}
 let renderer;
 await act(async()=>{renderer=create(React.createElement(Probe));await new Promise(resolve=>setImmediate(resolve));});
 assert.equal(prompts,0);assert.deepEqual(pushes,['/discoveries/test']);assert.equal(clears,1);assert.equal(value.expoPushToken,'');
 await act(async()=>{responseListener({actionIdentifier:'default',notification:{request:{identifier:'cold',content:{data:{url:'/discoveries/test'}}}}});});
 assert.equal(pushes.length,1);
 await act(async()=>{responseListener({actionIdentifier:'default',notification:{request:{identifier:'invalid',content:{data:{url:'//untrusted.example'}}}}});});assert.equal(pushes.length,1);
 status='granted';await act(async()=>{foreground('active');await new Promise(resolve=>setImmediate(resolve));});
 assert.equal(value.expoPushToken,'ExponentPushToken[test]');assert.equal(prompts,0);
 await exportsObject.savePushTokenToProfile('current-user','ExponentPushToken[test]');
 assert.equal(profileWrites.length,1);assert.deepEqual(registrations,[{token:'ExponentPushToken[test]',version:'unknown'}]);assert.equal(prompts,0);
 await act(async()=>renderer.unmount());
});
