import ScreenState from '@/components/ScreenState';
import { Stack, useRouter } from 'expo-router';
export default function ModalScreen() {
  const router = useRouter();
  return <><Stack.Screen options={{ title: 'Sanctuary' }} /><ScreenState title="Welcome to Sanctuary" message="Return to your daily scripture, reflection, and community." actionLabel="Back to Sanctuary" onRetry={() => router.dismissTo('/')} /></>;
}
