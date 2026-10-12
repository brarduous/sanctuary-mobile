import Colors from '@/constants/Colors';
import { Sparkles } from 'lucide-react-native';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
export default function ImprovementCheckInOverlay({ visible, saving, error, theme, onLater, onUpdate }: {
  visible: boolean; saving: boolean; error?: string | null; theme: typeof Colors.light;
  onLater: () => void; onUpdate: () => void;
}) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
    <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.48)', justifyContent: 'center', padding: 24 }}>
      <View accessibilityViewIsModal style={{ padding: 24, borderRadius: 24, backgroundColor: theme.card }}>
        <Sparkles size={28} color={theme.tint} style={{ marginBottom: 16 }} />
        <Text accessibilityRole="header" style={{ fontFamily: 'Georgia', fontSize: 26, color: theme.text, marginBottom: 12 }}>Still the right focus?</Text>
        <Text style={{ fontSize: 16, lineHeight: 25, color: theme.mutedForeground, marginBottom: 24 }}>Your life changes, and your reflections can too. Update the areas you're working through for more relevant devotionals.</Text>
        {error ? <Text accessibilityRole="alert" style={{ color: theme.text, fontSize: 14, marginBottom: 12 }}>{error}</Text> : null}
        <Pressable accessibilityRole="button" onPress={onUpdate} disabled={saving} style={{ minHeight: 52, borderRadius: 14, backgroundColor: theme.action, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: theme.onAction, fontSize: 16, fontWeight: '700' }}>Update my preferences</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onLater} disabled={saving} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>{saving ? <ActivityIndicator color={theme.tint} /> : <Text style={{ color: theme.mutedForeground, fontSize: 16 }}>Later</Text>}</Pressable>
        <Text style={{ color: theme.mutedForeground, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8 }}>Choose Later to be reminded in 30 days.</Text>
      </View>
    </View>
  </Modal>;
}
