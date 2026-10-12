import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export default function ScreenState({ title, message, loading = false, onRetry, actionLabel }: {
  title: string;
  message?: string;
  loading?: boolean;
  onRetry?: () => void;
  actionLabel?: string;
}) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  return <View style={{ flex: 1, justifyContent: 'center', padding: 28, backgroundColor: theme.background }}>
    {loading ? <ActivityIndicator color={theme.tint} style={{ marginBottom: 20 }} /> : <BookOpen color={theme.tint} size={32} style={{ marginBottom: 20 }} />}
    <Text style={{ color: theme.text, fontSize: 24, fontWeight: '700', marginBottom: 10 }}>{title}</Text>
    {message ? <Text style={{ color: theme.mutedForeground, fontSize: 16, lineHeight: 25 }}>{message}</Text> : null}
    {!loading && <Pressable accessibilityRole="button" onPress={onRetry ?? (() => router.canGoBack() ? router.back() : router.replace('/'))} style={{ alignSelf: 'flex-start', backgroundColor: theme.action, paddingHorizontal: 22, paddingVertical: 14, minHeight: 48, borderRadius: 14, marginTop: 24 }}>
      <Text style={{ color: theme.onAction, fontWeight: '700', fontSize: 15 }}>{actionLabel ?? (onRetry ? 'Try again' : 'Back to Sanctuary')}</Text>
    </Pressable>}
  </View>;
}
