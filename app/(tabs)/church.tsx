import ScreenState from '@/components/ScreenState';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { ChurchJourneySummary, fetchChurchContent, fetchChurchJourneys } from '@/lib/api';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { BookOpen, CalendarDays, ChevronRight, Heart, Sparkles, Users, VideoIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function PastoralPreview({ playbackId, theme }: { playbackId?: string; theme: typeof Colors.light }) {
  const [failed, setFailed] = useState(false);
  if (!playbackId || failed) return (
    <View style={{ height: 64, backgroundColor: theme.accentSoft, justifyContent: 'center', paddingHorizontal: 16 }}>
      <VideoIcon size={24} color={theme.tint} />
    </View>
  );
  return <View style={{ height: 96, backgroundColor: theme.accentSoft }}>
    <Image source={{ uri: `https://image.mux.com/${playbackId}/thumbnail.jpg?width=400` }} onError={() => setFailed(true)} contentFit="cover" style={{ width: '100%', height: 96 }} />
    <View pointerEvents="none" style={{ position: 'absolute', right: 12, bottom: 12, backgroundColor: 'rgba(15,23,42,0.65)', borderRadius: 24, padding: 8 }}>
      <VideoIcon size={20} color="white" />
    </View>
  </View>;
}

export default function ChurchTab() {
  const { userCongregationId } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();

  const [church, setChurch] = useState<any>(null);
  const [studies, setStudies] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<ChurchJourneySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    if (!userCongregationId) {
      setChurch(null);
      setStudies([]);
      setMessages([]);
      setJourneys([]);
      setLoading(false);
      return;
    }

    async function loadChurchData() {
      setLoading(true);
      setChurch(null);
      try {
        const [data, journeyData] = await Promise.all([fetchChurchContent(userCongregationId as number), fetchChurchJourneys(userCongregationId as number)]);
        if (!active) return;
        setChurch(data.church);
        setStudies(data.studies);
        setMessages(data.messages);
        setJourneys(journeyData);
      } catch (error) {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadChurchData();
    return () => { active = false; };
  }, [userCongregationId, attempt]);

  if (loading) return <ScreenState title="Opening My Church" message="Loading your church’s resources." loading />;
  if (loadError) return <ScreenState title="Church resources unavailable" message="We couldn’t load your church’s content. Please try again." onRetry={() => setAttempt(value => value + 1)} />;
  if (!church) return <ScreenState title="Connect with your church" message="Scan your church’s invitation to find its updates, studies, and weekly journey." actionLabel="Scan church invitation" onRetry={() => router.push('/scan')} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* Header */}
        <View className="mb-8 mt-2">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="bg-brand-100 dark:bg-brand-900/40 p-2 rounded-lg"><Users size={20} color={theme.tint} /></View>
            <Text className="text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider text-xs">Digital Congregation</Text>
          </View>
          <Text className="text-3xl font-serif font-bold dark:text-white leading-tight">{church.name}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Give to your church" onPress={() => router.push('/give')} style={{ flex: 1, minHeight: 88, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, gap: 10 }}>
            <Heart size={22} color={theme.tint} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ flex: 1, fontSize: 16, lineHeight: 22, fontWeight: '600', color: theme.text }}>Give</Text>
              <ChevronRight size={18} color={theme.mutedForeground} />
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Open volunteer hub" onPress={() => router.push('/volunteer')} style={{ flex: 1, minHeight: 88, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, gap: 10 }}>
            <Users size={22} color={theme.tint} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ flex: 1, fontSize: 16, lineHeight: 22, fontWeight: '600', color: theme.text }}>Volunteer</Text>
              <ChevronRight size={18} color={theme.mutedForeground} />
            </View>
          </Pressable>
        </View>

        {/* Video Messages Row */}
        {journeys.length > 0 && (
          <View className="mb-8">
            <View className="mb-4 flex-row items-center justify-between"><Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>Weekly journeys</Text><Sparkles size={18} color={theme.tint}/></View>
            <View className="gap-3">{journeys.slice(0, 1).map((journey, index) => (
              <Pressable key={journey.id} onPress={() => router.push(`/church/journey/${journey.id}` as any)} accessibilityRole="button" style={{ borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.accentSoft, padding: 20 }}>
                <View className="mb-2 flex-row items-center gap-2"><CalendarDays size={15} color={theme.tint}/><Text style={{ fontSize: 13, fontWeight: '700', color: theme.tint }}>{index === 0 ? 'Current journey' : 'Recent journey'}</Text></View>
                <Text style={{ fontFamily: 'Georgia', fontSize: 20, lineHeight: 28, fontWeight: '700', color: theme.text }}>{journey.title}</Text>
                {journey.description ? <Text style={{ marginTop: 8, fontSize: 15, lineHeight: 24, color: theme.mutedForeground }} numberOfLines={2}>{journey.description}</Text> : null}
                <View className="mt-4 flex-row items-center"><Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: theme.tint }}>Continue journey</Text><ChevronRight size={18} color={theme.tint}/></View>
              </Pressable>
            ))}</View>
            {journeys.slice(1).map(journey => (
              <Pressable key={journey.id} accessibilityRole="button" onPress={() => router.push(`/church/journey/${journey.id}` as any)} style={{ minHeight: 56, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ flex: 1, color: theme.text, fontSize: 16 }}>{journey.title}</Text>
                <ChevronRight size={18} color={theme.mutedForeground}/>
              </Pressable>
            ))}
          </View>
        )}

        {/* Video Messages Row */}
        {messages.length > 0 && (
          <View className="mb-8">
            <Text className="text-xl font-bold dark:text-white mb-4">Pastoral Updates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'flex-start', paddingRight: 20 }} className="-mx-5 px-5">
              {messages.map((msg) => {
                // Format the date to "Oct 24"
                const dateLabel = new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                //console.log(`https://image.mux.com/${msg.video_playback_id}/animated.webp?width=400` );
                return (
                  <Pressable
                    key={msg.message_id}
                    onPress={() => router.push(`/church/video/${msg.message_id}` as any)}
                    className="mr-4 w-56 rounded-2xl overflow-hidden border shadow-sm"
                    style={{ backgroundColor: theme.card, borderColor: theme.border }}
                  >
                    <PastoralPreview key={msg.video_playback_id || msg.message_id} playbackId={msg.video_playback_id} theme={theme} />

                    <View className="p-4">
                      <View className="mb-2 gap-1">
                        <Text className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
                          {msg.message_type?.replace(/_/g, ' ')}
                        </Text>
                        <Text className="text-xs font-medium" style={{ color: theme.mutedForeground }}>
                          {dateLabel}
                        </Text>
                      </View>
                      <Text className="font-bold text-gray-900 dark:text-white text-sm" numberOfLines={2}>
                        {msg.title}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Bible Studies List */}
        <View>
          <Text className="text-xl font-bold dark:text-white mb-4">Church Curriculums</Text>
          {studies.length === 0 ? (
            <View className="bg-slate-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 items-center">
              <BookOpen size={32} color={theme.mutedForeground} opacity={0.5} className="mb-3" />
              <Text className="text-slate-500 text-center font-medium">Your pastor hasn't published any studies yet.</Text>
            </View>
          ) : (
            <View className="space-y-3 gap-y-3">
              {studies.map((study) => (
                <Pressable
                  key={study.study_id}
                  onPress={() => router.push(`/church/study/${study.study_id}` as any)}
                  className="p-5 rounded-2xl border flex-row items-center gap-4 shadow-sm"
                  style={{ backgroundColor: theme.card, borderColor: theme.border }}
                >
                  <View className="bg-brand-50 dark:bg-brand-900/30 p-3 rounded-xl"><BookOpen size={24} color={theme.tint} /></View>
                  <View className="flex-1">
                    <Text className="font-bold text-lg dark:text-white mb-1">{study.title}</Text>
                    {study.subtitle && <Text className="text-sm" style={{ color: theme.mutedForeground }} numberOfLines={1}>{study.subtitle}</Text>}
                  </View>
                  <ChevronRight size={20} color={theme.mutedForeground} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
