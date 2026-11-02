import React,{useEffect,useRef,useState} from 'react';
import {Linking,Text,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '@/context/AuthContext';
import {enableTriviaEveningReminder,triviaReminderChoiceKey,TriviaReminderError} from '@/lib/triviaReminders';
import Colors from '@/constants/Colors';
import {Layout,Typography} from '@/constants/Layout';
import {useColorScheme} from './useColorScheme';
import {DiscoveryButton} from './DiscoveryUI';
export default function TriviaReminderOptIn(){
 const {user,profile,refreshProfile}=useAuth();
 const account=user?.id||null,active=useRef(account);active.current=account;
 const [choice,setChoice]=useState<{account:string;value:string|null}|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[denied,setDenied]=useState(false);
 const theme=Colors[useColorScheme()??'light'];
 useEffect(()=>{
  let live=true;setChoice(null);setError('');setDenied(false);setBusy(false);
  if(account)void AsyncStorage.getItem(triviaReminderChoiceKey(account)).then(value=>{if(live)setChoice({account,value});}).catch(()=>{if(live)setChoice({account,value:'unavailable'});});
  return()=>{live=false;};
 },[account]);
 if(!account||profile?.user_id!==account||profile.user_preferences?.notifications?.trivia===true||!choice||choice.account!==account||choice.value!==null)return null;
 const decide=async(enable:boolean)=>{
  if(busy)return;const owner=account;setBusy(true);setError('');setDenied(false);
  try{
   if(enable)await enableTriviaEveningReminder(owner);else await AsyncStorage.setItem(triviaReminderChoiceKey(owner),'declined');
   if(active.current!==owner)return;
   setChoice({account:owner,value:enable?'enabled':'declined'});
   if(enable)await refreshProfile();
  }catch(failure){if(active.current===owner){setError(failure instanceof Error?failure.message:'Could not save your choice. Please try again.');setDenied(failure instanceof TriviaReminderError&&failure.code==='denied');}}
  finally{if(active.current===owner)setBusy(false);}
 };
 return <View style={{padding:Layout.cardPadding,gap:14,borderRadius:Layout.cardRadius,borderWidth:1,borderColor:theme.border,backgroundColor:theme.readingSurface}}>
  <Text accessibilityRole="header" style={{...Typography.editorialTitle,fontFamily:Layout.serif,color:theme.text}}>A little time for Trivia.</Text>
  <Text style={{...Typography.helper,color:theme.mutedForeground}}>Want an evening invitation? Around 7 p.m. in your local time, we’ll remind you only when your daily three are unfinished. It’s optional.</Text>
  <DiscoveryButton variant="primary" label={busy?'Saving…':'Remind me in the evening'} disabled={busy} onPress={()=>{void decide(true);}}/>
  <DiscoveryButton variant="quiet" label="No thanks" disabled={busy} onPress={()=>{void decide(false);}}/>
  {error?<Text accessibilityRole="alert" style={{...Typography.helper,color:theme.error}}>{error}</Text>:null}
  {denied?<DiscoveryButton label="Open notification settings" onPress={()=>{void Linking.openSettings();}}/>:null}
 </View>;
}
