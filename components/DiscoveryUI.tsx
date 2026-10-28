import React, { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';
import { useColorScheme } from './useColorScheme';
import { discoveryDifficultyLabel, type Discovery } from '@/lib/discoveryCore';

export function DifficultyBadge({ item }: { item: Discovery }) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const label = discoveryDifficultyLabel(item);
  if (!label) return null;
  return <View style={[styles.badge, { backgroundColor: theme.selection }]}>
    <BarChart3 size={13} color={theme.tint} accessible={false}/>
    <Text style={{ ...Typography.metadata, fontWeight: '600', color: theme.tint }}>{label}</Text>
  </View>;
}

type ButtonProps = Omit<ComponentProps<typeof Pressable>, 'style' | 'children'> & {
  label: string; variant?: 'primary' | 'secondary' | 'quiet'; icon?: React.ReactNode;
};
// Pass a resolved style to NativeWind's Pressable interop. A style callback can
// be dropped by interop on native, including its layout and touch-target size.
export function DiscoveryPressable({style, pressedStyle, onPressIn, onPressOut, ...props}: Omit<ComponentProps<typeof Pressable>, 'style'> & {style?: StyleProp<ViewStyle>; pressedStyle?: StyleProp<ViewStyle>}) {
  const [pressed, setPressed] = useState(false);
  return <Pressable {...props} style={[style, pressed && pressedStyle]}
    onPressIn={event => {setPressed(true);onPressIn?.(event);}}
    onPressOut={event => {setPressed(false);onPressOut?.(event);}}/>;
}
export function DiscoveryButton({ label, variant = 'secondary', icon, disabled, ...props }: ButtonProps) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const primary = variant === 'primary';
  const color = disabled ? theme.onDisabled : primary ? theme.onAction : theme.tint;
  return <DiscoveryPressable {...props} accessibilityRole="button" disabled={disabled}
    accessibilityState={{ ...props.accessibilityState, disabled: Boolean(disabled) }}
    pressedStyle={{opacity:0.72}} style={[styles.button, {
      backgroundColor: disabled ? theme.disabled : primary ? theme.action : variant === 'secondary' ? theme.card : 'transparent',
      borderColor: variant === 'secondary' ? theme.border : 'transparent',
    }]}>
    {icon}<Text style={{ ...Typography.action, color, flexShrink: 1, textAlign: 'center' }}>{label}</Text>
  </DiscoveryPressable>;
}

export const discoveryStyles = StyleSheet.create({
  panel: { padding: 20, borderRadius: 22, borderWidth: 1, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eyebrow: { ...Typography.metadata, fontWeight: '600', letterSpacing: 0.7 },
  question: { fontFamily: Layout.serif, fontSize: 26, lineHeight: 34 },
  sectionTitle: { fontFamily: Layout.serif, fontSize: 23, lineHeight: 31 },
});
const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  button: { minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
});
