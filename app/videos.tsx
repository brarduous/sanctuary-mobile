import React, { useCallback, useRef, useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Play } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { fetchRecommendedVideos, type RecommendedVideo } from '@/lib/api';
import ScreenState from '@/components/ScreenState';
import { DiscoveryButton } from '@/components/DiscoveryUI';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';

export default function VideosScreen() {
  const { user, loading: authLoading } = useAuth();
  const account = user?.id || null;
  const theme = Colors[useColorScheme() ?? 'light'], router = useRouter();
  const [feed, setFeed] = useState<{ account: string; items: RecommendedVideo[] } | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(false);
  const request = useRef(0);
  const load = useCallback(async () => {
    const sequence = ++request.current;
    if (!account || authLoading) return;
    setLoading(true); setError(false);
    try {
      const items = await fetchRecommendedVideos({ throwOnError: true });
      if (sequence === request.current) setFeed({ account, items });
    } catch { if (sequence === request.current) setError(true); }
    finally { if (sequence === request.current) setLoading(false); }
  }, [account, authLoading]);
  useFocusEffect(useCallback(() => { void load(); return () => { request.current++; }; }, [load]));
  const videos = feed && feed.account === account ? feed.items : [];
  const open = async (url: string) => {
    try { await Linking.openURL(url); }
    catch { Alert.alert('Video unavailable', 'This video could not open. Please try again.'); }
  };
  return <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: theme.background }}>
    <Stack.Screen options={{ title: 'Videos' }} />
    {authLoading ? <ScreenState title="Loading videos" loading /> : !account ? <ScreenState title="Videos for your walk" message="Sign in to find faith videos based on your preferences." actionLabel="Sign in" onRetry={() => router.push('/login')} /> : loading && !videos.length ? <ScreenState title="Finding your videos" loading /> : error && !videos.length ? <ScreenState title="Videos could not load" message="Connect and try again. Your video preferences are saved." onRetry={() => { void load(); }} /> : <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { void load(); }} tintColor={theme.tint} />} contentContainerStyle={{ padding: Layout.gutter, gap: 20 }}>
      <View style={{ gap: 10 }}>
        <Text accessibilityRole="header" style={{ ...Typography.editorialTitle, fontFamily: Layout.serif, color: theme.text }}>Recommended for your walk</Text>
        <Text style={{ ...Typography.helper, color: theme.mutedForeground }}>Watch with your preferred video app. Choose creators and speakers in Profile.</Text>
        <DiscoveryButton label="Video preferences" onPress={() => router.push('/profile')} />
      </View>
      {error ? <View style={{ gap: 10 }}><Text accessibilityRole="alert" style={{ ...Typography.helper, color: theme.mutedForeground }}>Could not refresh. Showing the videos already loaded.</Text><DiscoveryButton label="Try again" onPress={() => { void load(); }} /></View> : null}
      {!videos.length ? <Text style={{ ...Typography.helper, color: theme.mutedForeground }}>No recommendations yet. Update your video preferences or check back soon.</Text> : videos.map(video => <Pressable key={video.id} accessibilityRole="button" accessibilityLabel={`Watch ${video.title}. Opens your video app.`} onPress={() => { void open(video.video_url); }} style={{ borderRadius: Layout.cardRadius, overflow: 'hidden', borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card }}>
        {video.thumbnail_url ? <Image source={{ uri: video.thumbnail_url }} style={{ width: '100%', aspectRatio: 16 / 9 }} contentFit="cover" /> : null}
        <View style={{ padding: Layout.cardPadding, gap: 10 }}>
          <Text style={{ ...Typography.sectionHeading, color: theme.text }}>{video.title}</Text>
          {video.focus_areas?.length ? <Text style={{ ...Typography.metadata, color: theme.mutedForeground }}>{video.focus_areas.join(' · ')}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Play size={18} color={theme.tint} accessible={false} /><Text style={{ ...Typography.action, color: theme.tint }}>Watch video</Text></View>
        </View>
      </Pressable>)}
    </ScrollView>}
  </SafeAreaView>;
}
