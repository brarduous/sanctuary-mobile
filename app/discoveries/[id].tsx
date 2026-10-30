import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Alert, Linking, ScrollView, Share, Text, useWindowDimensions, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, Check, ChevronDown, ChevronRight, ExternalLink, Clock3, Share2, WifiOff } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import DiscoveryScripture from '@/components/DiscoveryScripture';
import Colors from '@/constants/Colors';
import { DifficultyBadge, DiscoveryButton, DiscoveryPressable, discoveryStyles as styles } from '@/components/DiscoveryUI';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layout, Typography } from '@/constants/Layout';
import { useDiscoveries } from '@/context/DiscoveryContext';
import { eliminatedChoices, TRIVIA_DURATION_MS, triviaShareText, triviaStats, type TriviaTiming } from '@/lib/discoveryGame';
import useTriviaRound from '@/components/useTriviaRound';
import TriviaStats from '@/components/TriviaStats';
import type { Discovery } from '@/lib/discoveryCore';
import { discoveryMetric, fetchDiscovery } from '@/lib/discoveries';

export default function DiscoveryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {width,height,fontScale} = useWindowDimensions();
  const compactQuestion = width<390 && height<740;
  const stackResultActions = width<360 || fontScale>1;
  const [showSources,setShowSources] = useState(false);
  const {id,reveal} = useLocalSearchParams<{id:string;reveal?:string}>();
  const {bundle,today,progress,complete} = useDiscoveries();
  const theme = Colors[useColorScheme() ?? 'light'];
  const cached = [...(bundle?.items || []),...(bundle?.evergreen || [])].find(item => item.id===id && (!item.publicationDate || item.publicationDate<=today) && !bundle?.withdrawnIds.includes(item.id));
  const [item,setItem] = useState<Discovery | null>(cached || null);
  const [loading,setLoading] = useState(!cached);
  const [unavailable,setUnavailable] = useState(false);
  const [error,setError] = useState<string | null>(null);
  const [savedCopy,setSavedCopy] = useState(false);
  const [saving,setSaving] = useState(false);
  const [commitFailed,setCommitFailed] = useState(false);
  const [rowHeights,setRowHeights] = useState<Record<string,number>>({});
  const busy=useRef(false);
  const locked=useRef<{optionId?:string;timing?:TriviaTiming}|null>(null);
  const timeoutAttempt=useRef<string|null>(null);
  const [pendingChoice,setPendingChoice] = useState<string | null>(null);
  const [localReveal,setLocalReveal] = useState(false);
  const [evidence,setEvidence] = useState<string | null>(null);
  const currentId = useRef(id); currentId.current=id;
  const attemptedAutoReveal = useRef<string | null>(null);
  const completed = item ? progress.completions[item.id] : undefined;
  const revealed = localReveal || Boolean(completed);
  const game=useTriviaRound(item?.id,item?.revision,revealed || saving || commitFailed);
  const roundIdentity=useRef(game.identity);roundIdentity.current=game.identity;
  const stats=useMemo(()=>triviaStats(Object.values(progress.completions),today),[progress,today]);
  const removed=item ? eliminatedChoices(item,game.elapsed):[];

  const load = useCallback(async () => {
    const requested=id;
    setLoading(true);setError(null);
    try {
      const remote=await fetchDiscovery(requested);
      if (currentId.current!==requested) return;
      setItem(remote);setUnavailable(!remote);setSavedCopy(false);
    } catch {
      if (currentId.current===requested) {setSavedCopy(true);setError(null);}
    } finally {if (currentId.current===requested) setLoading(false);}
  },[id]);
  useEffect(() => {
    busy.current=false;locked.current=null;timeoutAttempt.current=null;setCommitFailed(false);setSaving(false);setRowHeights({});
    setItem(cached || null);setLocalReveal(false);setPendingChoice(null);setEvidence(null);setUnavailable(false);setShowSources(false);attemptedAutoReveal.current=null;
    void load();
  },[id,load,game.owner]);
  useEffect(() => {if (!item && cached && !unavailable) setItem(cached);},[cached,item,unavailable]);
  useEffect(() => {if (item && !revealed) discoveryMetric(item,'question_opened');},[item?.id]);

  const finish = useCallback(async (optionId?:string,timedOut=false) => {
    if (!item || busy.current || unavailable || revealed) return;
    const requested=item.id,identity=game.identity;
    if(!locked.current) {
      const elapsedMs=game.started ? game.readElapsed():undefined;
      if(elapsedMs!==undefined && elapsedMs>=TRIVIA_DURATION_MS){optionId=undefined;timedOut=true;}
      if(optionId && elapsedMs!==undefined && eliminatedChoices(item,elapsedMs).includes(optionId))return;
      locked.current={optionId,timing:elapsedMs!==undefined ? {elapsedMs,timedOut}:undefined};
    }
    const submission=locked.current;
    busy.current=true;setSaving(true);setCommitFailed(false);setPendingChoice(submission.optionId || null);setError(null);
    try {
      await complete(item,submission.optionId ? 'answered' : 'revealed',submission.optionId,submission.timing);
      if(currentId.current!==requested || roundIdentity.current!==identity)return;
      setLocalReveal(true);setPendingChoice(null);
      discoveryMetric(item,submission.optionId ? 'answer_committed' : 'direct_reveal');discoveryMetric(item,'explanation_viewed');
      AccessibilityInfo.announceForAccessibility(`${submission.timing?.timedOut ? 'Time’s up. ' : ''}The answer is ${item.choices.find(choice => choice.id===item.correctOptionId)?.text}. ${item.explanation}`);
    } catch(failure) {
      if(currentId.current===requested && roundIdentity.current===identity){setCommitFailed(true);setError(failure instanceof Error ? failure.message : 'Your result could not be saved.');}
    } finally {if(currentId.current===requested && roundIdentity.current===identity){busy.current=false;setSaving(false);}}
  },[item,unavailable,revealed,complete,game.identity,game.started,game.readElapsed]);
  useEffect(()=>{
    if(game.expired && item && !revealed && !commitFailed && timeoutAttempt.current!==game.identity){timeoutAttempt.current=game.identity;void finish(undefined,true);}
  },[game.expired,game.identity,item,revealed,commitFailed,finish]);
  useEffect(()=>{
    if(removed.length && !revealed)AccessibilityInfo.announceForAccessibility(`${removed.length===1 ? 'One wrong answer removed' : 'Two wrong answers removed'}. ${game.remaining} seconds remaining.`);
  },[removed.length,revealed]);
  useEffect(() => {
    if (reveal==='1' && item && !completed && attemptedAutoReveal.current!==item.id) {attemptedAutoReveal.current=item.id;void finish();}
  },[reveal,item,loading,completed,finish]);
  const share = async () => {
    if (!item || !completed) return;
    try {discoveryMetric(item,'share_initiated');await Share.share({message:triviaShareText({outcome:completed.outcome,streak:stats.current,playedToday:completed.puzzleDate===today && completed.localDate===today}),title:'Sanctuary Trivia'});}
    catch {Alert.alert('Sharing unavailable','Please try again.');}
  };
  const selected = completed?.revision===item?.revision && completed?.mode==='answered' ? completed.optionId : null;
  const done = () => router.canGoBack() ? router.back() : router.replace('/(tabs)');
  const outcomeLabel = completed?.outcome==='correct' ? 'Correct' : completed?.outcome==='timeout' ? 'Time’s up' : completed?.outcome==='incorrect' ? 'Not quite' : 'Answer revealed';
  return <View style={{flex:1,backgroundColor:theme.background}}>
    <Stack.Screen options={{title:'Daily Trivia',headerShown:true,headerShadowVisible:false,headerBackButtonDisplayMode:'minimal'}}/>
    {/* Native text can retain old measurements after a Dynamic Type change.
        Rebuild the content while keeping round/result state in this screen. */}
    <ScrollView key={`text-scale-${fontScale}`} style={{flex:1}} contentContainerStyle={{paddingHorizontal:20,paddingTop:10,paddingBottom:revealed ? 20:Math.max(insets.bottom,16),gap:12}}>
      {!item ? <View style={[styles.panel,{borderColor:theme.border,backgroundColor:theme.card}]}>
        {loading ? <ActivityIndicator color={theme.tint} accessibilityLabel="Loading question"/> : <>
          <Text accessibilityRole="header" style={[styles.sectionTitle,{color:theme.text}]}>{unavailable ? 'Question unavailable' : 'Connect to download'}</Text>
          <DiscoveryButton label="Try again" onPress={() => {void load();}}/>
        </>}
      </View> : <>
        <View style={{gap:10}}>
          <View style={{...styles.row,justifyContent:'space-between',flexWrap:'wrap'}}>
            <Text style={{...Typography.metadata,color:theme.mutedForeground}}>{item.kind==='biblical_text' ? 'Bible' : item.category}{item.traditionLabel ? ` · ${item.traditionLabel}` : ''}</Text>
            <DifficultyBadge item={item}/>
          </View>
          {revealed || game.started ? <Text accessibilityRole="header" style={[styles.question,{color:theme.text},revealed ? {fontSize:20,lineHeight:28} : compactQuestion ? {fontSize:22,lineHeight:30}:null]}>{item.prompt}</Text> : null}
        </View>
        {!revealed && !game.started ? <View style={{gap:16,paddingVertical:24}}>
          <Clock3 size={36} color={theme.tint} accessible={false}/>
          <Text accessibilityRole="header" style={[styles.question,{color:theme.text}]}>20 seconds</Text>
          <Text style={{...Typography.helper,color:theme.mutedForeground}}>Wrong choices disappear as you play.</Text>
          <DiscoveryButton variant="primary" label={game.starting ? 'Starting…' : 'Start question'} disabled={!game.ready || game.starting} onPress={()=>{void game.start();}}/>
          {game.error ? <><Text accessibilityRole="alert" style={{...Typography.helper,color:theme.error}}>{game.error}</Text>{!game.ready ? <DiscoveryButton label="Try again" onPress={game.retryRestore}/>:null}</>:null}
        </View>:null}
        {!revealed && game.started ? <View style={{gap:4}}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'}}>
            <View style={{...styles.row,minHeight:44}}><Clock3 size={16} color={theme.tint} accessible={false}/><Text style={{...Typography.formLabel,fontVariant:['tabular-nums'],color:theme.tint}}>{game.remaining}s</Text></View>
            {!commitFailed ? <DiscoveryButton variant="quiet" label={saving ? 'Saving…':'Reveal answer'} disabled={saving || game.expired} onPress={()=>{void finish();}}/>:null}
          </View>
          <View accessibilityRole="progressbar" accessibilityLabel="Time remaining" accessibilityValue={{min:0,max:20,now:game.remaining,text:`${game.remaining} seconds remaining`}} style={{height:5,borderRadius:3,backgroundColor:theme.muted,overflow:'hidden'}}><View style={{height:5,width:`${game.remaining/20*100}%`,backgroundColor:theme.action}}/></View>
        </View>:null}
        {revealed || game.started ? <View style={{gap:10}}>
          {item.choices.map((choice,index) => {
            const correct = revealed && choice.id===item.correctOptionId;
            const picked = (revealed ? selected : pendingChoice)===choice.id;
            if(revealed && !correct)return null;
            if(!revealed && removed.includes(choice.id))return <View key={choice.id} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{height:rowHeights[choice.id] || 52}}/>;
            return <DiscoveryPressable key={choice.id} accessibilityRole="button"
              accessibilityLabel={correct ? `${outcomeLabel}. Correct answer: ${choice.text}` : `${String.fromCharCode(65+index)}. ${choice.text}${picked ? '. Your answer' : ''}`}
              accessibilityState={{disabled:saving || revealed || commitFailed || game.expired,selected:picked}} disabled={saving || revealed || commitFailed || game.expired} onPress={() => {void finish(choice.id);}}
              onLayout={event=>{const height=event.nativeEvent.layout.height;setRowHeights(old=>old[choice.id]===height ? old:{...old,[choice.id]:height});}}
              pressedStyle={{borderColor:theme.tint,backgroundColor:theme.selection}}
              style={{minHeight:52,paddingHorizontal:12,paddingVertical:10,borderRadius:14,borderWidth:1,borderColor:correct ? theme.success : picked ? theme.tint : theme.border,backgroundColor:correct ? theme.successSurface : picked ? theme.selection : theme.card,flexDirection:'row',alignItems:'center',gap:12}}>
              <View style={{minWidth:28,minHeight:28,padding:3,borderRadius:20,borderWidth:1,borderColor:correct ? theme.success : theme.border,alignItems:'center',justifyContent:'center'}}>
                {correct ? <Check size={16} color={theme.success} accessible={false}/> : <Text style={{...Typography.metadata,color:theme.tint}}>{String.fromCharCode(65+index)}</Text>}
              </View>
              <View style={{flex:1,gap:3}}>{correct ? <Text style={{...Typography.metadata,fontWeight:'600',color:completed?.outcome==='correct' ? theme.success:theme.text}}>{outcomeLabel}</Text>:null}<Text style={{...Typography.formLabel,fontWeight:'500',color:theme.text}}>{choice.text}</Text></View>
              {picked && !correct ? <Text style={{...Typography.metadata,color:theme.mutedForeground}}>Your pick</Text> : null}
            </DiscoveryPressable>;
          })}
        </View>:null}
        {commitFailed ? <DiscoveryButton label="Save result" onPress={()=>{void finish();}}/>:null}
        {revealed ? <View style={{gap:12}} accessibilityLiveRegion="polite">
          {selected && selected!==item.correctOptionId ? <Text style={{...Typography.metadata,color:theme.mutedForeground}}>Your pick: {item.choices.find(choice=>choice.id===selected)?.text}</Text> : null}
          <Text style={{...Typography.helper,color:theme.text}}>{item.explanation}</Text>
          {item.correctionNotice ? <Text style={{...Typography.helper,color:theme.tint}}>Correction: {item.correctionNotice}</Text> : null}
          {completed && completed.revision!==item.revision ? <Text style={{...Typography.metadata,color:theme.mutedForeground}}>Updated answer and sources.</Text> : null}
          <TriviaStats elapsedMs={completed?.elapsedMs} streak={stats.current}/>
          {item.scriptureReference ? <DiscoveryScripture reference={item.scriptureReference}/> : item.sources[0] ? <Text style={{...Typography.metadata,color:theme.mutedForeground}}>{item.sources[0].locator}</Text> : null}
          <DiscoveryButton variant="quiet" label={showSources ? 'Hide sources' : 'View sources'} accessibilityState={{expanded:showSources}} onPress={() => setShowSources(value => !value)} icon={<BookOpen size={16} color={theme.tint} accessible={false}/>}/>
        </View> : null}
        {savedCopy ? <View style={{...styles.row,padding:12,borderRadius:14,backgroundColor:theme.muted}}><WifiOff size={16} color={theme.mutedForeground} accessible={false}/><Text style={{...Typography.metadata,color:theme.mutedForeground,flex:1}}>Saved for offline play</Text></View> : null}
        {error ? <Text accessibilityRole="alert" style={{...Typography.helper,color:theme.error}}>{error}</Text> : null}
        {revealed && showSources ? <View style={{gap:14}}>
          <Text style={{...Typography.helper,color:theme.mutedForeground}}>{item.scopeNote}</Text>
          {item.sources.map(source => <View key={source.id} style={{borderRadius:16,borderWidth:1,borderColor:theme.border,backgroundColor:theme.card,overflow:'hidden'}}>
            <DiscoveryPressable accessibilityRole="button" accessibilityLabel={`${evidence===source.id ? 'Hide' : 'Read'} saved evidence: ${source.locator}`} accessibilityState={{expanded:evidence===source.id}} onPress={() => setEvidence(value => value===source.id ? null : source.id)} pressedStyle={{backgroundColor:theme.muted}} style={{padding:16,flexDirection:'row',alignItems:'center',gap:10}}>
              <View style={{flex:1,gap:4}}><Text style={{...Typography.formLabel,color:theme.text}}>{source.locator}</Text><Text style={{...Typography.metadata,color:theme.mutedForeground}}>{source.title} · {source.publisher}</Text></View>
              {evidence===source.id ? <ChevronDown size={18} color={theme.mutedForeground} accessible={false}/> : <ChevronRight size={18} color={theme.mutedForeground} accessible={false}/>}
            </DiscoveryPressable>
            {evidence===source.id ? <View style={{paddingHorizontal:16,paddingBottom:16,gap:12}}><Text style={{...Typography.readingBody,fontFamily:Layout.serif,color:theme.text}}>{source.excerpt}</Text><Text style={{...Typography.metadata,color:theme.mutedForeground}}>{source.rights}</Text></View> : null}
            <DiscoveryPressable accessibilityRole="link" accessibilityHint="Opens the source website." onPress={() => {discoveryMetric(item,'source_opened');void Linking.openURL(source.url).catch(() => Alert.alert('Source unavailable','Try the saved excerpt.'));}} pressedStyle={{backgroundColor:theme.muted}} style={{minHeight:46,paddingHorizontal:16,paddingVertical:12,borderTopWidth:1,borderTopColor:theme.border,flexDirection:'row',alignItems:'center',gap:8}}>
              <ExternalLink size={15} color={theme.tint} accessible={false}/><Text style={{...Typography.helper,color:theme.tint}}>Open website</Text>
            </DiscoveryPressable>
          </View>)}
        </View> : null}
      </>}
    </ScrollView>
    {item && revealed ? <View style={{paddingHorizontal:20,paddingTop:12,paddingBottom:Math.max(insets.bottom,12),borderTopWidth:1,borderTopColor:theme.border,backgroundColor:theme.background,flexDirection:stackResultActions ? 'column':'row',gap:10}}>
      <View style={{flex:stackResultActions ? undefined:1}}><DiscoveryButton variant="primary" label="Done" onPress={done}/></View>
      <View style={{flex:stackResultActions ? undefined:1}}><DiscoveryButton label="Share result" onPress={()=>{void share();}} icon={<Share2 size={17} color={theme.tint} accessible={false}/>}/></View>
    </View>:null}
  </View>;
}
