import React, {useEffect} from 'react';
import {ActivityIndicator,Text,View} from 'react-native';
import {Stack,useRouter} from 'expo-router';
import {useDiscoveries} from '@/context/DiscoveryContext';
import Colors from '@/constants/Colors';
import {useColorScheme} from '@/components/useColorScheme';
import {DiscoveryButton} from '@/components/DiscoveryUI';
import {Typography} from '@/constants/Layout';
export default function DailyTriviaEntry(){
  const {selection,bundle,error,refresh}=useDiscoveries();const router=useRouter();const theme=Colors[useColorScheme() ?? 'light'];
  const id=selection?.item.id;
  useEffect(()=>{if(id)router.replace({pathname:'/discoveries/[id]',params:{id}});},[id,router]);
  return <><Stack.Screen options={{title:'Daily Trivia',headerShown:true}}/><View style={{flex:1,padding:24,gap:18,justifyContent:'center',backgroundColor:theme.background}}>{!bundle && !error || id ? <ActivityIndicator color={theme.tint} accessibilityLabel="Loading today’s trivia"/>:<><Text style={{...Typography.editorialTitle,color:theme.text}}>A new question is on the way.</Text><DiscoveryButton label="Try again" onPress={()=>{void refresh();}}/></>}</View></>;
}
