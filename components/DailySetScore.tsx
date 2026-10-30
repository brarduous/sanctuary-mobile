import React from 'react';
import {Text,View} from 'react-native';
import {Check,Minus,X} from 'lucide-react-native';
import {DAILY_LABELS,dailyResultLabel,type DailyResult} from '@/lib/discoveryDailySet';
import Colors from '@/constants/Colors';
import {Typography} from '@/constants/Layout';
import {useColorScheme} from './useColorScheme';
export default function DailySetScore({results}:{results:DailyResult[]}) {
 const theme=Colors[useColorScheme() ?? 'light'];
 return <View style={{flexDirection:'row',gap:12}}>{DAILY_LABELS.map((label,index)=>{
  const result=results[index],color=result==='correct' ? theme.success:result ? theme.error:theme.mutedForeground;
  const Icon=result==='correct' ? Check:result ? X:Minus;
  return <View key={label} accessible accessibilityLabel={`${label}: ${dailyResultLabel(result)}`} style={{flex:1,alignItems:'center',gap:8}}>
   <View style={{width:'100%',minHeight:58,borderRadius:14,backgroundColor:result==='correct' ? theme.successSurface:theme.muted,borderWidth:result ? 2:1,borderColor:result ? color:theme.border,alignItems:'center',justifyContent:'center'}}><Icon size={25} color={color} strokeWidth={2.5} accessible={false}/></View>
   <Text style={{...Typography.metadata,color:theme.mutedForeground}}>{label}</Text>
  </View>;
 })}</View>;
}
