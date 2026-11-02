const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{act,create}=require('react-test-renderer');global.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,mocks){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,{exports,console,require(name){return name in mocks?mocks[name]:require(name);}});return exports;}
test('evening consent requests OS access only on intent, preserves fresh preferences and binds registration to the current account',async()=>{
 let owner='alice',status='denied',canAskAgain=true,grant=true,switchDuringPrompt=false;
 const calls={prompts:0,registrations:[],writes:[],local:[]};
 const module=load('lib/triviaReminders.ts',{
  'expo-notifications':{async getPermissionsAsync(){return {status,canAskAgain};},async requestPermissionsAsync(){calls.prompts++;if(switchDuringPrompt)owner='bob';return {status:grant?'granted':'denied'};}},
  'expo-device':{isDevice:true},'@react-native-async-storage/async-storage':{async setItem(key,value){calls.local.push([key,value]);}},
  './discoveries':{async discoverySessionId(){return owner;}},
  './api':{async fetchUserProfile(id){return {user_id:id,user_preferences:{preferredTheme:'dark',notifications:{news:true,devotionals:true}}};},async updateUserProfile(id,value,strict){calls.writes.push({id,value,strict});}},
  './pushNotifications':{async registerForPushNotificationsAsync(){return 'ExponentPushToken[synthetic]';},async savePushTokenToProfile(...args){calls.registrations.push(args);}},
 });
 assert.equal(calls.prompts,0,'import and ordinary rendering never prompt');
 grant=false;await assert.rejects(module.enableTriviaEveningReminder('alice'),error=>error.code==='denied');
 assert.equal(calls.writes.length,0);assert.equal(calls.registrations.length,0);
 canAskAgain=false;await assert.rejects(module.requestTriviaReminderAccess('alice'),error=>error.code==='denied');assert.equal(calls.prompts,1,'permanent denial does not repeat OS prompts');
 canAskAgain=true;grant=true;switchDuringPrompt=true;
 await assert.rejects(module.enableTriviaEveningReminder('alice'),error=>error.code==='account');assert.equal(calls.writes.length,0);
 owner='alice';switchDuringPrompt=false;
 await module.enableTriviaEveningReminder('alice');
 assert.equal(calls.registrations[0][0],'alice');assert.equal(calls.registrations[0][2],true);
 assert.equal(calls.writes[0].id,'alice');assert.equal(calls.writes[0].value.user_preferences.notifications.trivia,true);
 assert.equal(calls.writes[0].value.user_preferences.notifications.news,true);assert.equal(calls.writes[0].value.user_preferences.preferredTheme,'dark');
 assert.equal(calls.local[0][0],module.triviaReminderChoiceKey('alice'));
});
test('declining is persistent per account; guests and already-enabled profiles are never offered the prompt',async()=>{
 let account='alice',enabled=false,enableCalls=0;
 const disk=new Map();
 const module=load('components/TriviaReminderOptIn.tsx',{
  'react-native':{View:'View',Text:'Text',Linking:{async openSettings(){}}},
  '@react-native-async-storage/async-storage':{async getItem(key){return disk.get(key)||null;},async setItem(key,value){disk.set(key,value);}},
  '@/context/AuthContext':{useAuth:()=>({user:account?{id:account}:null,profile:account?{user_id:account,user_preferences:{notifications:{trivia:enabled}}}:null,async refreshProfile(){}})},
  '@/lib/triviaReminders':{triviaReminderChoiceKey:id=>'choice:'+id,async enableTriviaEveningReminder(){enableCalls++;},TriviaReminderError:class extends Error{}},
  '@/constants/Colors':{light:{}},'@/constants/Layout':{Layout:{},Typography:{}},'./useColorScheme':{useColorScheme:()=> 'light'},'./DiscoveryUI':{DiscoveryButton:props=>React.createElement('Button',props)},
 }).default;
 let renderer;await act(async()=>{renderer=create(React.createElement(module));});
 assert.equal(enableCalls,0);assert.equal(renderer.root.findAllByType('Button').length,2);
 await act(async()=>{renderer.root.findAllByType('Button').find(node=>node.props.label==='No thanks').props.onPress();});
 assert.equal(renderer.toJSON(),null);await act(async()=>renderer.unmount());
 await act(async()=>{renderer=create(React.createElement(module));});assert.equal(renderer.toJSON(),null,'decline survives remount');
 account='bob';await act(async()=>renderer.update(React.createElement(module)));assert.equal(renderer.root.findAllByType('Button').length,2);
 account=null;await act(async()=>renderer.update(React.createElement(module)));assert.equal(renderer.toJSON(),null);
 account='carol';enabled=true;await act(async()=>renderer.update(React.createElement(module)));assert.equal(renderer.toJSON(),null);
 await act(async()=>renderer.unmount());assert.equal(enableCalls,0);
});
