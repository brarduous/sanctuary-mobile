import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';
import { useAuth } from '@/context/AuthContext';
import { useDiscoveries } from '@/context/DiscoveryContext';
import { discoveryMetric } from '@/lib/discoveries';
import { dailySetForDate, dailySetResults, dailySetStreak } from '@/lib/discoveryDailySet';
import { DiscoveryButton } from './DiscoveryUI';
import DailySetScore from './DailySetScore';

// In-memory session/day deduplication survives tab unmounts. Account IDs stay
// on-device and are never included in the aggregate metric payload.
const impressions = new Set<string>();
export default function DailyDiscoveryCard({ visible = false, onLayout, source = 'home' }: {
  visible?: boolean; onLayout?: (event: LayoutChangeEvent) => void; source?: 'home' | 'games';
}) {
  const { bundle, today, progress, hasGuestProgress, mergeGuest, error, refreshing, refresh } = useDiscoveries();
  const { user } = useAuth();
  const theme = Colors[useColorScheme() ?? 'light'], router = useRouter();
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const items = dailySetForDate(bundle, today), item = items[0];
  const results = dailySetResults(items, progress.completions), played = results.filter(Boolean).length;
  const completed = played === 3;
  const streak = dailySetStreak(Object.values(progress.completions),today);
  const account = user?.id || 'guest';
  const activeAccount = useRef(account); activeAccount.current = account;
  useEffect(() => { setMerging(false); setMergeError(null); }, [account]);
  useEffect(() => {
    if (!visible || !item) return;
    const key = `${account}:${today}:${source}`;
    if (impressions.has(key)) return;
    if (impressions.size >= 200) impressions.delete(impressions.values().next().value!);
    impressions.add(key);
    discoveryMetric(item, 'card_viewed', {source});
  }, [visible, item, account, today, source]);
  const importGuest = async () => {
    if (merging) return;
    const owner = account;
    setMerging(true); setMergeError(null);
    try { await mergeGuest(); }
    catch { if (activeAccount.current === owner) setMergeError('Your discoveries could not be imported. Please try again.'); }
    finally { if (activeAccount.current === owner) setMerging(false); }
  };
  return <View onLayout={onLayout} style={{ marginBottom: Layout.sectionGap, padding: 18, borderRadius: Layout.cardRadius, borderWidth: 1, borderColor: completed ? theme.border : theme.tint, backgroundColor: completed ? theme.card : theme.readingSurface, gap: 10 }}>
    <Text accessibilityRole="header" style={{ ...Typography.sectionHeading, fontFamily: Layout.serif, color: theme.text }}>
      {completed ? 'Today’s Trivia complete' : played ? 'Keep going' : 'Today’s Bible Trivia'}
    </Text>
    <Text style={{ ...Typography.helper, color: theme.mutedForeground }}>
      {!item ? (refreshing ? 'Loading today’s three questions…' : 'Today’s three could not load. Connect and try again.') : completed ? `${results.filter(result => result === 'correct').length}/3 correct` : played ? `${played}/3 played · progress saved` : 'Three questions: easy, medium, hard.'}
    </Text>
    {streak > 0 ? <Text style={{ ...Typography.metadata, color: theme.tint }}>{streak}-day play streak</Text> : null}
    {completed ? <DailySetScore results={results} compact /> : null}
    {item ? <>
      {error ? <Text style={{ ...Typography.metadata, color: theme.mutedForeground }}>Saved on this device · connect to refresh</Text> : null}
      <DiscoveryButton variant={completed ? 'quiet' : 'primary'} label={completed ? 'View and share results' : played ? 'Continue' : 'Play today’s three'} onPress={() => router.push({ pathname: '/discoveries', params: { source } })} icon={<ChevronRight size={18} color={completed ? theme.tint : theme.onAction} accessible={false} />} />
    </> : refreshing ? <ActivityIndicator accessibilityLabel="Loading today’s Trivia" color={theme.tint} /> : <DiscoveryButton label="Try again" onPress={() => { void refresh(true); }} />}
    {hasGuestProgress ? <Pressable accessibilityRole="button" disabled={merging} accessibilityState={{ disabled: merging }} onPress={() => { void importGuest(); }} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ ...Typography.helper, color: theme.tint }}>{merging ? 'Importing…' : 'Add discoveries explored before signing in'}</Text></Pressable> : null}
    {mergeError ? <Text accessibilityRole="alert" style={{ ...Typography.helper, color: theme.error }}>{mergeError}</Text> : null}
  </View>;
}
