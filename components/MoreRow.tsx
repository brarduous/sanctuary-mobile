import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';
import { useColorScheme } from './useColorScheme';

export default function MoreRow({ title, description, icon: Icon, onPress }: {
  title: string; description: string; icon: LucideIcon; onPress: () => void;
}) {
  const theme = Colors[useColorScheme() ?? 'light'];
  return <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: Layout.rowHeight, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 18, paddingHorizontal: 16, borderRadius: Layout.controlRadius, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }}>
    <Icon size={23} color={theme.tint} accessible={false} />
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={{ ...Typography.formLabel, color: theme.text }}>{title}</Text>
      <Text style={{ ...Typography.helper, color: theme.mutedForeground }}>{description}</Text>
    </View>
    <ChevronRight size={19} color={theme.mutedForeground} accessible={false} />
  </Pressable>;
}
