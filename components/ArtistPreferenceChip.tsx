import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';
import { X } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

export default function ArtistPreferenceChip({ name, onRemove, theme }: { name: string; onRemove: () => void; theme: typeof Colors.light }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${name}`} onPress={onRemove} style={{ minHeight: Layout.touchTarget, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 22, borderWidth: 1, borderColor: theme.tint, backgroundColor: theme.selection, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <Text style={{ ...Typography.metadata, fontSize: 14, fontWeight: '600', color: theme.text, flexShrink: 1 }}>{name}</Text>
    <X size={14} color={theme.tint} accessible={false} />
  </Pressable>;
}
