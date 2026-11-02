import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight, Newspaper } from 'lucide-react-native';
import { fetchNewsArticles } from '@/lib/api';
import { newsPreview, type NewsArticle, type NewsBriefing } from '@/lib/newsFeed';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';
import { useColorScheme } from './useColorScheme';
import NewsStoryCard from './NewsStoryCard';

export default function HomeNewsSection({ briefing, refreshing = false }: { briefing: NewsBriefing | null; refreshing?: boolean }) {
  const theme = Colors[useColorScheme() ?? 'light'], router = useRouter();
  const [lead, setLead] = useState<NewsArticle | null>(null);
  useEffect(() => {
    if (refreshing) return;
    let active = true;
    // Optional news imagery must not delay Scripture/reflection loading.
    void fetchNewsArticles({ limit: 1, page: 1 }).then(items => { if (active) setLead(items?.[0] || null); }).catch(() => undefined);
    return () => { active = false; };
  }, [refreshing]);
  const openFeed = () => router.navigate('/(tabs)/news');
  return <View style={{ marginBottom: Layout.sectionGap, gap: 12 }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      <Newspaper size={16} color={theme.mutedForeground} accessible={false} />
      <Text accessibilityRole="header" style={{ ...Typography.formLabel, color: theme.text, flex: 1 }}>News & perspective</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="See all news" onPress={openFeed} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}><Text style={{ ...Typography.metadata, fontWeight: '700', color: theme.tint }}>See all</Text></Pressable>
    </View>
    {lead ? <NewsStoryCard article={lead} featured onPress={() => router.push({ pathname: '/news/[id]', params: { id: String(lead.id) } })} /> : <Pressable accessibilityRole="button" onPress={openFeed} style={{ padding: Layout.cardPadding, borderRadius: Layout.cardRadius, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, gap: 10 }}>
      <Text style={{ ...Typography.editorialTitle, fontFamily: Layout.serif, color: theme.text }}>{briefing?.stories?.[0]?.headline || 'News, with perspective.'}</Text>
      <Text style={{ ...Typography.helper, color: theme.mutedForeground }}>{newsPreview(briefing?.stories?.[0]?.summary || briefing?.synopsis, 150) || 'Explore the headlines, with Scripture and space to reflect.'}</Text>
    </Pressable>}
    <Pressable accessibilityRole="button" accessibilityLabel="Open the daily news briefing" onPress={() => router.navigate({ pathname: '/(tabs)/news', params: { briefing: 'open', request: String(Date.now()) } })} style={{ padding: 16, minHeight: 68, borderRadius: Layout.controlRadius, backgroundColor: theme.readingSurface, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <BookOpen size={21} color={theme.tint} accessible={false} />
      <View style={{ flex: 1, gap: 3 }}><Text style={{ ...Typography.formLabel, color: theme.text }}>Your daily briefing</Text><Text style={{ ...Typography.metadata, color: theme.mutedForeground }}>Headlines, Scripture, and a moment to reflect</Text></View>
      <ChevronRight size={19} color={theme.tint} accessible={false} />
    </Pressable>
  </View>;
}
