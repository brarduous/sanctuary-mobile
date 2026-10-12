import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';
import { ActivityIndicator, Text, View } from 'react-native';

export default function GeneratingState({ className = '' }: { className?: string }) {
  const theme = Colors[useColorScheme() ?? 'light'];
  return <View className={className} style={{ backgroundColor: theme.card, padding: Layout.cardPadding, borderRadius: Layout.cardRadius, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border, minHeight: 240 }}>
    <ActivityIndicator size="large" color={theme.tint} style={{ marginBottom: 24 }} />
    <Text accessibilityRole="header" style={{ ...Typography.sectionHeading, fontFamily: Layout.serif, color: theme.text, textAlign: 'center', marginBottom: 8 }}>Creating your devotional</Text>
    <Text style={{ ...Typography.helper, color: theme.mutedForeground, textAlign: 'center' }}>Reflecting on Scripture and preparing a word for you…</Text>
  </View>;
}
