import Colors from '@/constants/Colors';
import { Play, Square } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

export default function ReadingControls({ speaking, onPress, label, theme }: {
  speaking: boolean;
  onPress: () => void;
  label: string;
  theme: typeof Colors.light;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={speaking ? 'Stop reading aloud' : label}
      accessibilityState={{ selected: speaking }}
      onPress={onPress}
      style={{ minHeight: 48, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: theme.action }}
    >
      {speaking ? <Square size={18} color={theme.onAction} fill={theme.onAction} /> : <Play size={18} color={theme.onAction} fill={theme.onAction} />}
      <Text style={{ color: theme.onAction, fontSize: 15, fontWeight: '700', flexShrink: 1 }}>{speaking ? 'Stop reading' : label}</Text>
    </Pressable>
  );
}
