import ScriptureLinkifier from '@/components/ScriptureLinkifier';
import { Layout } from '@/constants/Layout';
import ScreenState from '@/components/ScreenState';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { ChurchJourney, ChurchJourneyItem, fetchChurchJourney, updateChurchJourneyProgress } from '@/lib/api';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, Check, ChevronLeft, Heart, Share2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const typeLabel: Record<string, string> = { sermon_summary: 'Sermon summary', key_ideas: 'Key ideas', daily_devotional: 'Daily devotional', guided_prayer: 'Guided prayer', small_group_guide: 'Group discussion', family_prompts: 'Family discussion', member_reflection: 'Reflection', congregational_response: 'Next step', email_draft: 'Pastoral letter', social_caption: 'Share', shareable_quote: 'Quote' };

export default function ChurchJourneyScreen() {
  const { id, step } = useLocalSearchParams<{ id: string; step?: string }>();
  const router = useRouter(); const scheme = useColorScheme() ?? 'light'; const theme = Colors[scheme];
  const [journey, setJourney] = useState<ChurchJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(typeof step === 'string' ? step : null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    setJourney(null);
    fetchChurchJourney(id).then(data => {
      if (!active) return;
      setJourney(data);
      setActiveId(current => current && data.items.some(item => item.id === current) ? current : data.items[0]?.id || null);
    }).catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, attempt]);
  const active = useMemo(() => journey?.items.find((item) => item.id === activeId) || null, [journey, activeId]);
  useEffect(() => { if (active && journey && !active.progress?.opened_at) void updateChurchJourneyProgress(journey.id, active.id, { opened: true }).catch(() => undefined); }, [active?.id, journey?.id]);
  const update = async (item: ChurchJourneyItem, payload: { completed?: boolean; saved?: boolean }) => {
    if (!journey || saving) return;
    const journeyId = journey.id;
    setSaving(true);
    try {
      const progress = await updateChurchJourneyProgress(journeyId, item.id, payload);
      setJourney(current => current?.id === journeyId ? { ...current, items: current.items.map(entry => entry.id === item.id ? { ...entry, progress } : entry) } : current);
    } catch { Alert.alert('Could not save', 'Please check your connection and try again.'); }
    finally { setSaving(false); }
  };
  if (loading) return <ScreenState title="Opening your journey" message="Preparing this week’s resources." loading />;
  if (loadError) return <ScreenState title="Journey unavailable" message="We couldn’t load this journey. Please try again." onRetry={() => setAttempt(value => value + 1)} />;
  if (!journey || !active) return <ScreenState title="Journey unavailable" message="Your church has no content available for this journey yet." actionLabel="Back to My Church" onRetry={() => router.dismissTo('/(tabs)/church')} />;
  const currentIndex = journey.items.findIndex(item => item.id === active.id);
  const completedCount = journey.items.filter(item => item.progress?.completed_at).length;
  const sermon = journey.sermon_content_packs?.sermons;
  const image = sermon?.illustration_image_url || sermon?.thumbnail_url;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to My Church" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/church')} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginBottom: 24 }}>
          <ChevronLeft color={theme.text} />
        </Pressable>
        <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 1, color: theme.tint }}>WEEKLY JOURNEY</Text>
        <Text accessibilityRole="header" style={{ marginTop: 8, fontFamily: Layout.serif, fontSize: 28, lineHeight: 36, fontWeight: '700', color: theme.text }}>{journey.title}</Text>
        {sermon?.scripture ? <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}><BookOpen size={18} color={theme.tint} /><View style={{ flex: 1 }}><ScriptureLinkifier text={sermon.scripture} textStyle={{ fontSize: 16, lineHeight: 24 }} /></View></View> : null}
        {image ? <Image source={{ uri: image }} style={{ width: '100%', height: 160, borderRadius: 20, marginTop: 24 }} contentFit="cover" /> : null}
        <Text style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 21, marginTop: 24 }}>Step {currentIndex + 1} of {journey.items.length} · {completedCount} completed</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 20, gap: 8 }}>
          {journey.items.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: active.id === item.id }} onPress={() => setActiveId(item.id)} style={{ minHeight: 44, justifyContent: 'center', borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, borderColor: active.id === item.id ? theme.tint : theme.border, backgroundColor: active.id === item.id ? theme.tint : theme.card }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: active.id === item.id ? theme.onTint : theme.text }}>{typeLabel[item.item_type] || item.item_type}{item.sequence > 1 ? ` ${item.sequence}` : ''}</Text>
          </Pressable>)}
        </View>
        <View style={{ borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, padding: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.tint }}>{typeLabel[active.item_type] || active.item_type}</Text>
          <Text accessibilityRole="header" style={{ marginTop: 8, fontFamily: Layout.serif, fontSize: 24, lineHeight: 32, fontWeight: '700', color: theme.text }}>{active.title}</Text>
          {active.scripture_references?.length ? <View style={{ marginTop: 16 }}><ScriptureLinkifier text={active.scripture_references.join('; ')} textStyle={{ fontSize: 16, lineHeight: 24 }} /></View> : null}
          <Text style={{ marginTop: 20, fontFamily: Layout.serif, ...Layout.body, color: theme.text }}>{String(active.content?.body || '')}</Text>
          <View style={{ marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving, selected: !!active.progress?.completed_at }} disabled={saving} onPress={() => update(active, { completed: !active.progress?.completed_at })} style={{ minHeight: 48, flexGrow: 1, flexBasis: 150, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, padding: 12, backgroundColor: active.progress?.completed_at ? theme.accentSoft : theme.action, opacity: saving ? 0.6 : 1 }}>
              <Check size={18} color={active.progress?.completed_at ? theme.tint : theme.onAction} />
              <Text style={{ flexShrink: 1, fontSize: 15, fontWeight: '700', color: active.progress?.completed_at ? theme.tint : theme.onAction }}>{active.progress?.completed_at ? 'Completed' : 'Mark complete'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={active.progress?.saved_at ? 'Unsave resource' : 'Save resource'} accessibilityState={{ selected: !!active.progress?.saved_at, disabled: saving }} disabled={saving} onPress={() => update(active, { saved: !active.progress?.saved_at })} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: theme.border, opacity: saving ? 0.6 : 1 }}><Heart size={20} color={active.progress?.saved_at ? theme.tint : theme.text} fill={active.progress?.saved_at ? theme.tint : 'transparent'} /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Share resource" onPress={() => Share.share({ title: active.title, message: `${active.title}\n\n${String(active.content?.body || '')}` })} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: theme.border }}><Share2 size={20} color={theme.text} /></Pressable>
          </View>
          {currentIndex < journey.items.length - 1 ? <Pressable accessibilityRole="button" onPress={() => setActiveId(journey.items[currentIndex + 1].id)} style={{ paddingVertical: 18, marginTop: 16, minHeight: 48 }}><Text style={{ color: theme.tint, fontWeight: '600', fontSize: 16, lineHeight: 24 }}>Next: {journey.items[currentIndex + 1].title}</Text></Pressable> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
