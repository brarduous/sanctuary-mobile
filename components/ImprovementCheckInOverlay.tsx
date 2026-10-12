import Colors from '@/constants/Colors';
import useReducedMotion from '@/components/useReducedMotion';
import { Layout, Typography } from '@/constants/Layout';
import { Sparkles } from 'lucide-react-native';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
export default function ImprovementCheckInOverlay({ visible, saving, error, theme, onLater, onUpdate }: {
  visible: boolean; saving: boolean; error?: string | null; theme: typeof Colors.light;
  onLater: () => void; onUpdate: () => void;
}) {
  const reducedMotion = useReducedMotion();
  return <Modal visible={visible} transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={onLater}>
    <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.48)', justifyContent: 'center', padding: 24 }}>
      <View accessibilityViewIsModal style={{ maxHeight: '100%', borderRadius: 24, overflow: 'hidden', backgroundColor: theme.card }}>
      <ScrollView contentContainerStyle={{ padding: 24 }} bounces={false}>
        <Sparkles size={28} color={theme.tint} style={{ marginBottom: 16 }} />
        <Text accessibilityRole="header" style={{ ...Typography.screenTitle, fontFamily: Layout.serif, color: theme.text, marginBottom: 12 }}>Still the right focus?</Text>
        <Text style={{ fontSize: 16, lineHeight: 25, color: theme.mutedForeground, marginBottom: 24 }}>Your life changes, and your reflections can too. Update the areas you're working through for more relevant devotionals.</Text>
        {error ? <Text accessibilityRole="alert" style={{ ...Typography.helper, color: theme.error, marginBottom: 12 }}>{error}</Text> : null}
        <Pressable accessibilityRole="button" onPress={onUpdate} disabled={saving} accessibilityState={{ disabled: saving, busy: saving }} style={{ minHeight: 52, borderRadius: 14, backgroundColor: theme.action, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 }}><Text style={{ ...Typography.action, color: theme.onAction, textAlign: 'center' }}>Update my preferences</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onLater} disabled={saving} accessibilityState={{ disabled: saving, busy: saving }} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>{saving ? <ActivityIndicator color={theme.tint} /> : <Text style={{ color: theme.mutedForeground, fontSize: 16 }}>Later</Text>}</Pressable>
        <Text style={{ color: theme.mutedForeground, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8 }}>Choose Later to be reminded in 30 days.</Text>
      </ScrollView>
      </View>
    </View>
  </Modal>;
}
