import React, { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { BookOpen, ChevronRight, Newspaper } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';
import { articlePreview, newsRelativeTime, type NewsArticle } from '@/lib/newsFeed';
import { useColorScheme } from './useColorScheme';

export default function NewsStoryCard({ article, featured = false, onPress }: { article: NewsArticle; featured?: boolean; onPress: () => void }) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const { width, fontScale } = useWindowDimensions();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const stacked = featured || width < 360 || fontScale > 1.3;
  const category = article.categories?.find(item => item.name)?.name;
  const summary = articlePreview(article, featured ? 170 : 110);
  const time = newsRelativeTime(article.publish_date || article.created_at);
  const image = <View style={{ width: stacked ? '100%' : 80, aspectRatio: stacked ? 16 / 8 : 1, backgroundColor: theme.readingSurface, alignItems: 'center', justifyContent: 'center', borderRadius: stacked ? 0 : 12, overflow: 'hidden' }}>
    {article.article_thumbnail_url && failedImage !== article.article_thumbnail_url ? <Image source={{ uri: article.article_thumbnail_url }} onError={() => setFailedImage(article.article_thumbnail_url!)} style={{ width: '100%', height: '100%' }} contentFit="cover" accessible={false} /> : <Newspaper size={stacked ? 36 : 24} color={theme.tint} accessible={false} />}
  </View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Read and reflect: ${article.article_title}`} onPress={onPress} style={{ borderWidth: 1, borderColor: theme.border, borderRadius: Layout.cardRadius, overflow: 'hidden', backgroundColor: theme.card }}>
    {stacked ? image : null}
    <View style={{ padding: featured ? 20 : 16, flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
      <View style={{ flex: 1, gap: featured ? 12 : 9 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {category ? <Text style={{ ...Typography.metadata, fontWeight: '700', color: theme.tint }}>{category}</Text> : null}
          {time ? <Text style={{ ...Typography.metadata, color: theme.mutedForeground }}>{time}</Text> : null}
        </View>
        <Text accessibilityRole="header" style={{ fontFamily: Layout.serif, fontSize: featured ? 25 : 20, lineHeight: featured ? 33 : 28, fontWeight: '600', color: theme.text }}>{article.article_title}</Text>
        {summary ? <Text style={{ ...Typography.helper, color: theme.mutedForeground }}>{summary}</Text> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 2 }}><BookOpen size={15} color={theme.tint} accessible={false} /><Text style={{ ...Typography.metadata, fontWeight: '700', color: theme.tint }}>Read & reflect</Text><ChevronRight size={15} color={theme.tint} accessible={false} /></View>
      </View>
      {!stacked ? image : null}
    </View>
  </Pressable>;
}
