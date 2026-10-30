import React,{useEffect,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import {BookOpen,ChevronRight} from 'lucide-react-native';
import {useColorScheme} from './useColorScheme';
import Colors from '@/constants/Colors';
import {Layout,Typography} from '@/constants/Layout';
import {useDiscoveries} from '@/context/DiscoveryContext';
import {discoveryMetric} from '@/lib/discoveries';
import {dailySetForDate,dailySetResults,dailySetStreak} from '@/lib/discoveryDailySet';
import {DiscoveryButton} from './DiscoveryUI';
import DailySetScore from './DailySetScore';
export default function DailyDiscoveryCard(){
 const {bundle,today,progress,hasGuestProgress,mergeGuest}=useDiscoveries();
 const theme=Colors[useColorScheme() ?? 'light'],router=useRouter();
 const [mergeError,setMergeError]=useState<string|null>(null);
 const items=dailySetForDate(bundle,today),item=items[0];
 const results=dailySetResults(items,progress.completions),played=results.filter(Boolean).length;
 const streak=dailySetStreak(Object.values(progress.completions),today);
 useEffect(()=>{if(item)discoveryMetric(item,'card_viewed');},[item?.id]);
 if(!item)return null;
 return <View style={{marginBottom:Layout.sectionGap}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12}}><BookOpen size={16} color={theme.mutedForeground} accessible={false}/><Text accessibilityRole="header" style={{...Typography.formLabel,color:theme.text}}>Trivia</Text></View>
  <View style={{padding:Layout.cardPadding,borderRadius:24,borderWidth:1,borderColor:theme.border,backgroundColor:theme.card,gap:18}}>
   <View style={{gap:8}}><Text accessibilityRole="header" style={{fontSize:25,lineHeight:33,fontFamily:Layout.serif,color:theme.text}}>Your daily three.</Text><Text style={{...Typography.helper,color:theme.mutedForeground}}>Easy, medium, hard. Three discoveries worth sharing.</Text></View>
   <DailySetScore results={results}/>
   {played ? <Text style={{...Typography.metadata,color:theme.mutedForeground}}>{played===3 ? `${results.filter(r=>r==='correct').length}/3 correct`:`${played}/3 played · progress saved`}</Text>:null}
   <DiscoveryButton variant="primary" label={played===3 ? 'View and share results':played ? 'Keep playing':'Play today’s three'} onPress={()=>router.push('/discoveries')} icon={<ChevronRight size={18} color={theme.onAction} accessible={false}/>}/>
   {streak>0 ? <Text style={{...Typography.metadata,color:theme.tint}}>{streak}-day perfect-set streak</Text>:null}
   {hasGuestProgress ? <Pressable accessibilityRole="button" onPress={()=>{void mergeGuest().catch(()=>setMergeError('Your discoveries could not be imported. Please try again.'));}} style={{minHeight:44,justifyContent:'center'}}><Text style={{...Typography.helper,color:theme.tint}}>Add discoveries explored before signing in</Text></Pressable>:null}
   {mergeError ? <Text accessibilityRole="alert" style={{...Typography.helper,color:theme.error}}>{mergeError}</Text>:null}
  </View>
 </View>;
}
