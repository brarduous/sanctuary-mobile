import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Layout';
import { formatTriviaTime } from '@/lib/discoveryGame';
import { useColorScheme } from './useColorScheme';

export default function TriviaStats({elapsedMs,streak}:{elapsedMs?:number;streak:number}) {
  const theme=Colors[useColorScheme() ?? 'light'];
  const {width,fontScale}=useWindowDimensions();
  const stack=fontScale>=1.5 || width<340;
  return <View style={{gap:12,padding:16,borderRadius:18,borderWidth:1,borderColor:theme.border,backgroundColor:theme.card}}>
    <View style={{flexDirection:stack ? 'column':'row',gap:24}}>
      <View style={{flex:stack ? undefined:1,gap:3}}><Text style={{...Typography.metadata,color:theme.mutedForeground}}>Response time</Text><Text style={{fontSize:24,fontWeight:'600',color:theme.text}}>{formatTriviaTime(elapsedMs)}</Text></View>
      <View style={{flex:stack ? undefined:1,gap:3}}><Text style={{...Typography.metadata,color:theme.mutedForeground}}>Win streak</Text><Text style={{fontSize:24,fontWeight:'600',color:theme.text}}>{streak} {streak===1 ? 'day':'days'}</Text></View>
    </View>
  </View>;
}
