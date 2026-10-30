import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Check, ChevronRight, Flame } from 'lucide-react-native';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';
import { useDiscoveries } from '@/context/DiscoveryContext';
import { discoveryMetric } from '@/lib/discoveries';
import { triviaStats, formatTriviaTime } from '@/lib/discoveryGame';
import { DifficultyBadge, DiscoveryButton } from './DiscoveryUI';

export default function DailyDiscoveryCard() {
  const {selection,today,progress,hasGuestProgress,mergeGuest} = useDiscoveries();
  const theme = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  const [mergeError,setMergeError] = useState<string | null>(null);
  const item = selection?.item;
  const stats=useMemo(()=>triviaStats(Object.values(progress.completions),today),[progress,today]);
  useEffect(() => {if (item) discoveryMetric(item,'card_viewed');},[item?.id]); // one impression per selected item
  if (!item) return null;
  const completed = Boolean(progress.completions[item.id]);
  const open = () => router.push({pathname:'/discoveries/[id]',params:{id:item.id}});
  return (
    <View style={{marginBottom:Layout.sectionGap}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12}}>
        <BookOpen size={16} color={theme.mutedForeground} accessible={false}/>
        <Text accessibilityRole="header" style={{...Typography.formLabel,color:theme.text}}>Daily Trivia</Text>
      </View>
      <View style={{padding:Layout.cardPadding,borderRadius:24,borderWidth:1,borderColor:theme.border,backgroundColor:theme.card,gap:16}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
          <Text style={{...Typography.metadata,color:theme.mutedForeground}}>{selection.isToday ? 'Today’s question' : 'From the collection'}</Text>
          <DifficultyBadge item={item}/>
        </View>
        <View style={{gap:8}}>
          <Text style={{...Typography.metadata,color:theme.tint,fontWeight:'600'}}>20 seconds · {item.kind==='biblical_text' ? 'Bible' : item.category}</Text>
          <Text accessibilityRole="header" style={{fontSize:23,lineHeight:32,fontFamily:Layout.serif,color:theme.text}}>{completed ? 'Your daily result' : 'Today’s question'}</Text>
        </View>
        {completed ? <View style={{flexDirection:'row',alignItems:'center',gap:7}}><Check size={16} color={theme.success} accessible={false}/><Text accessibilityLiveRegion="polite" style={{...Typography.helper,color:theme.success,flex:1}}>Completed</Text></View> : null}
        <View style={{gap:4}}>
          <DiscoveryButton variant="primary" label={completed ? 'View result' : 'Play'} accessibilityLabel={completed ? 'View today’s trivia result' : 'Play today’s trivia'} onPress={() => open()} icon={<ChevronRight size={18} color={theme.onAction} accessible={false}/>}/>
        </View>
        {stats.current>0 ? <View style={{flexDirection:'row',alignItems:'center',gap:6}}><Flame size={15} color={theme.tint} accessible={false}/><Text style={{...Typography.metadata,color:theme.tint}}>{stats.current}-day win streak</Text></View>:null}
        {progress.completions[item.id]?.elapsedMs!==undefined ? <Text style={{...Typography.metadata,color:theme.mutedForeground}}>Response time · {formatTriviaTime(progress.completions[item.id].elapsedMs)}</Text>:null}
        {hasGuestProgress ? <Pressable accessibilityRole="button" onPress={() => {void mergeGuest().catch(() => setMergeError('Your discoveries could not be imported. Please try again.'));}} style={{minHeight:44,justifyContent:'center'}}><Text style={{...Typography.helper,color:theme.tint}}>Add discoveries explored before signing in</Text></Pressable> : null}
        {mergeError ? <Text accessibilityRole="alert" style={{...Typography.helper,color:theme.error}}>{mergeError}</Text> : null}
      </View>
    </View>
  );
}
