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
  return <View style={{paddingVertical:10}}>
    <View style={{flexDirection:stack ? 'column':'row',gap:24}}>
      <View style={{flex:stack ? undefined:1,gap:3}}><Text style={{...Typography.metadata,color:theme.mutedForeground}}>Response time</Text><Text style={{fontSize:22,fontWeight:'600',fontVariant:['tabular-nums'],color:theme.text}}>{formatTriviaTime(elapsedMs)}</Text></View>
      <View style={{flex:stack ? undefined:1,gap:3}}><Text style={{...Typography.metadata,color:theme.mutedForeground}}>Win streak</Text><Text style={{fontSize:22,fontWeight:'600',fontVariant:['tabular-nums'],color:theme.text}}>{streak} {streak===1 ? 'day':'days'}</Text></View>
    </View>
  </View>;
}
