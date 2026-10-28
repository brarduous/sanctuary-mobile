import { useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveBibleReaderPreferences } from '@/lib/bibleReaderPreferences';

// Same persisted settings as the Bible tab. Reload on focus so returning from
// the reader immediately reflects a translation or reading-size change.
export default function useBibleReaderPreferences() {
  const [preferences,setPreferences]=useState<ReturnType<typeof resolveBibleReaderPreferences> | null>(null);
  useFocusEffect(useCallback(()=>{
    let active=true;
    let revision=0;
    const load=async()=>{
      const request=++revision;
      try {
        const [version,size]=await Promise.all([AsyncStorage.getItem('bible_version'),AsyncStorage.getItem('bible_font_size')]);
        if(active && request===revision)setPreferences(resolveBibleReaderPreferences(version,size));
      } catch {if(active && request===revision)setPreferences(resolveBibleReaderPreferences(null,null));}
    };
    void load();
    const listener=AppState.addEventListener('change',state=>{if(state==='active')void load();});
    return ()=>{active=false;listener.remove();};
  },[]));
  return preferences;
}
