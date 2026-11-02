import {useCallback,useEffect,useState} from 'react';
import {AccessibilityInfo,AppState} from 'react-native';
import * as Haptics from 'expo-haptics';

// Match the app's existing reduced-motion preference for optional haptics.
export default function useTriviaFeedback() {
  const [reducedMotion,setReducedMotion]=useState(true);
  useEffect(()=>{
    let live=true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(live)setReducedMotion(value);}).catch(()=>undefined);
    const listener=AccessibilityInfo.addEventListener('reduceMotionChanged',setReducedMotion);
    return()=>{live=false;listener.remove();};
  },[]);
  return useCallback((kind:'selection'|'correct')=>{
    if(reducedMotion || AppState.currentState!=='active')return;
    // Optional feedback must never delay or prevent saving an answer.
    void (kind==='correct' ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success):Haptics.selectionAsync()).catch(()=>undefined);
  },[reducedMotion]);
}
