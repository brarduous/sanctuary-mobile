import ScreenState from '@/components/ScreenState';
import { Stack, useRouter } from 'expo-router';
export default function NotFoundScreen() {
  const router = useRouter();
  return <><Stack.Screen options={{ title: 'Unavailable' }} /><ScreenState title="This page is unavailable" message="The link may have changed. Return home to continue your day." onRetry={() => router.replace('/')} actionLabel="Back to Sanctuary" /></>;
}
