import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';
import type { NewsBriefing } from '@/lib/newsFeed';
import ScriptureLinkifier from './ScriptureLinkifier';
import { useColorScheme } from './useColorScheme';

export default function NewsBriefingCard({ briefing, expanded, onToggle }: { briefing: NewsBriefing; expanded: boolean; onToggle: () => void }) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const date = briefing.created_at && Number.isFinite(Date.parse(briefing.created_at)) ? new Date(briefing.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
  const Chevron = expanded ? ChevronUp : ChevronDown;
  return <View style={{ borderRadius: Layout.cardRadius, backgroundColor: theme.readingSurface, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${expanded ? 'Close' : 'Read'} the daily news briefing${date ? ` for ${date}` : ''}`} accessibilityState={{ expanded }} onPress={onToggle} style={{ padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 56 }}>
      <BookOpen size={23} color={theme.tint} accessible={false} />
      <View style={{ flex: 1, gap: 3 }}><Text style={{ ...Typography.formLabel, color: theme.text }}>The daily briefing{date ? ` · ${date}` : ''}</Text></View>
      <Chevron size={19} color={theme.tint} accessible={false} />
    </Pressable>
    {expanded ? <View style={{ padding: 18, paddingTop: 0, gap: 18 }}>
      {briefing.synopsis ? <Text style={{ ...Typography.readingBody, color: theme.text, fontFamily: Layout.serif }}>{briefing.synopsis}</Text> : null}
      {briefing.scripture ? <View style={{ paddingTop: 16, borderTopWidth: 1, borderColor: theme.border, gap: 8 }}><Text style={{ ...Typography.formLabel, color: theme.tint }}>Scripture to carry with you</Text><ScriptureLinkifier text={briefing.scripture} textStyle={{ ...Typography.readingBody, fontFamily: Layout.serif }} /></View> : null}
      {briefing.prayer ? <View style={{ gap: 8 }}><Text style={{ ...Typography.formLabel, color: theme.text }}>A moment of prayer</Text><Text style={{ ...Typography.readingBody, color: theme.text, fontFamily: Layout.serif }}>{briefing.prayer}</Text></View> : null}
      <Pressable accessibilityRole="button" onPress={onToggle} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ ...Typography.action, color: theme.tint }}>Close briefing</Text></Pressable>
    </View> : null}
  </View>;
}
