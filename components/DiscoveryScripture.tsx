import React, { useMemo } from 'react';
import { ActivityIndicator, Text, useWindowDimensions, View } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';
import { getPassageHtml } from '@/lib/bibleUtils';
import { formatReadingHtml } from '@/lib/readingHtml';
import { useColorScheme } from './useColorScheme';
import useBibleReaderPreferences from './useBibleReaderPreferences';
import { DiscoveryPressable } from './DiscoveryUI';

export default function DiscoveryScripture({reference}:{reference:string}) {
  const theme=Colors[useColorScheme() ?? 'light'];
  const preferences=useBibleReaderPreferences();
  const router=useRouter();
  const {width}=useWindowDimensions();
  const version=preferences?.version;
  const passage=useMemo(()=>version ? getPassageHtml(reference,version) : null,[reference,version]);
  const fontSize=preferences?.textSize==='extra' ? 24 : preferences?.textSize==='large' ? 20 : 18;
  return <View style={{borderRadius:18,borderWidth:1,borderColor:theme.border,backgroundColor:theme.card,padding:16,gap:12}}>
    <DiscoveryPressable accessibilityRole="link" accessibilityLabel={`Read ${reference}${preferences ? ` in ${preferences.version}` : ''} in the Bible reader`}
      disabled={!preferences} onPress={()=>{if(preferences)router.push({pathname:'/(tabs)/bible',params:{reference,version:preferences.version}});}}
      pressedStyle={{opacity:0.65}} style={{minHeight:44,flexDirection:'row',alignItems:'center',gap:8}}>
      <Text style={{...Typography.formLabel,color:theme.tint,flex:1}}>{reference}</Text>
      {preferences ? <Text style={{...Typography.metadata,color:theme.mutedForeground}}>{preferences.version}</Text>:null}
      <ChevronRight size={17} color={theme.tint} accessible={false}/>
    </DiscoveryPressable>
    {!preferences ? <ActivityIndicator color={theme.tint} accessibilityLabel="Loading your Bible translation"/> : passage ?
      <RenderHtml contentWidth={Math.max(100,width-82)} source={{html:formatReadingHtml(passage.html)}}
        baseStyle={{fontFamily:Layout.serif,fontSize,lineHeight:Math.round(fontSize*1.6),color:theme.text}}
        systemFonts={[Layout.serif!]} defaultTextProps={{allowFontScaling:true}}
        tagsStyles={{sup:{fontSize:12,color:theme.mutedForeground},p:{marginTop:0,marginBottom:10}}}/>
      : <Text style={{...Typography.helper,color:theme.mutedForeground}}>Passage unavailable in {preferences.version}. Open the Bible reader above.</Text>}
  </View>;
}
