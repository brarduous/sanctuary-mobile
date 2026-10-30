import React from 'react';
import {ActivityIndicator,Alert,ScrollView,Share,Text,View} from 'react-native';
import {Stack,useLocalSearchParams,useRouter} from 'expo-router';
import {ChevronRight,Share2} from 'lucide-react-native';
import {useDiscoveries} from '@/context/DiscoveryContext';
import Colors from '@/constants/Colors';
import {useColorScheme} from '@/components/useColorScheme';
import {DiscoveryButton} from '@/components/DiscoveryUI';
import {Typography,Layout} from '@/constants/Layout';
import DailySetScore from '@/components/DailySetScore';
import useDailySet from '@/components/useDailySet';
import {DAILY_LABELS,dailyResultLabel,dailySetResults,dailySetShareText,dailySetStreak} from '@/lib/discoveryDailySet';

export default function DailyTriviaEntry(){
 const {bundle,error,today,progress}=useDiscoveries();
 const params=useLocalSearchParams<{date?:string}>();
 const date=params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) && params.date<=today ? params.date:today;
 const {items,loading,error:setError,retry}=useDailySet(date);
 const router=useRouter(),theme=Colors[useColorScheme() ?? 'light'];
 const results=dailySetResults(items,progress.completions),played=results.filter(Boolean).length,correct=results.filter(r=>r==='correct').length;
 const next=results.findIndex(r=>!r),streak=dailySetStreak(Object.values(progress.completions),today);
 const open=(index:number)=>router.push({pathname:'/discoveries/[id]',params:{id:items[index].id}});
 const share=async()=>{try{await Share.share({title:'Sanctuary Trivia',message:dailySetShareText(date,results)});}catch{Alert.alert('Sharing unavailable','Please try again.');}};
 return <><Stack.Screen options={{title:'Trivia',headerShown:true,headerShadowVisible:false}}/><ScrollView style={{flex:1,backgroundColor:theme.background}} contentContainerStyle={{padding:24,paddingBottom:48,gap:24}}>
  <View style={{gap:10}}><Text style={{...Typography.metadata,color:theme.mutedForeground}}>{new Date(date+'T12:00:00Z').toLocaleDateString(undefined,{month:'long',day:'numeric',timeZone:'UTC'})}</Text><Text accessibilityRole="header" style={{...Typography.editorialTitle,color:theme.text}}>Your daily three.</Text><Text style={{...Typography.helper,color:theme.mutedForeground}}>Start easy. Make a connection. Take on the hard one.</Text></View>
  {loading && !items.length ? <ActivityIndicator color={theme.tint} accessibilityLabel="Loading three questions"/>:items.length===3 ? <>
   <View style={{padding:Layout.cardPadding,borderRadius:24,borderWidth:1,borderColor:theme.border,backgroundColor:theme.card,gap:22}}>
    <DailySetScore results={results}/>
    <View style={{gap:5}}><Text accessibilityLiveRegion="polite" style={{fontFamily:Layout.serif,fontSize:30,color:theme.text}}>{played===3 ? `${correct} out of 3`:`${played} of 3 played`}</Text><Text style={{...Typography.helper,color:theme.mutedForeground}}>{played===3 ? 'Three discoveries. One result to share.':'20 seconds per question. Your progress saves as you go.'}</Text></View>
    {next>=0 ? <DiscoveryButton variant="primary" label={`${played ? 'Continue':'Start'} ${DAILY_LABELS[next].toLowerCase()}`} onPress={()=>open(next)} icon={<ChevronRight size={18} color={theme.onAction} accessible={false}/>}/>:null}
    {played>0 ? <DiscoveryButton variant={played===3 ? 'primary':'quiet'} label="Share your Results" onPress={()=>{void share();}} icon={<Share2 size={17} color={played===3 ? theme.onAction:theme.tint} accessible={false}/>}/>:null}
   </View>
   <View style={{gap:10}}>{items.map((item,index)=><DiscoveryButton key={item.id} label={`${DAILY_LABELS[index]} · ${results[index] ? dailyResultLabel(results[index]):'Ready to play'}`} accessibilityLabel={`${results[index] ? 'Review':'Play'} ${DAILY_LABELS[index].toLowerCase()} question. ${dailyResultLabel(results[index])}`} onPress={()=>open(index)} icon={<ChevronRight size={17} color={theme.tint} accessible={false}/>}/>)}</View>
   {streak>0 ? <Text style={{...Typography.metadata,color:theme.tint}}>{streak}-day perfect-set streak</Text>:null}
   <Text style={{...Typography.metadata,color:theme.mutedForeground}}>Shared squares show Easy → Medium → Hard. Questions and answers stay out of your result.</Text>
  </>:<View style={{gap:16}}><Text style={{...Typography.helper,color:theme.text}}>{error || setError || 'Your next daily three is on the way.'}</Text><DiscoveryButton label="Try again" onPress={retry}/></View>}
  {!bundle && error ? <Text accessibilityRole="alert" style={{...Typography.helper,color:theme.error}}>{error}</Text>:null}
 </ScrollView></>;
}
