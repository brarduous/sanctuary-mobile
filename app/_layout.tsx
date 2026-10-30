import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

export {
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

import { AuthProvider } from '@/context/AuthContext';
import { RevenueCatProvider } from '@/context/RevenueCatContext';
import { savePushTokenToProfile, usePushNotifications } from '@/lib/pushNotifications';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { updateNotificationTimeZone } from '@/lib/api';
import { DiscoveryProvider } from '@/context/DiscoveryContext';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RevenueCatProvider>
        <ActionSheetProvider>
          <DiscoveryProvider><RootLayoutNav /></DiscoveryProvider>
        </ActionSheetProvider>
      </RevenueCatProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, profile, profileLoadError, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const theme = Colors[colorScheme ?? 'light'];
  const { expoPushToken } = usePushNotifications();
  const userId = user?.id;

  useEffect(() => {
    if (user && expoPushToken) {
      savePushTokenToProfile(user.id, expoPushToken);
    }
  }, [user, expoPushToken]);

  useEffect(() => {
    if (!userId) return;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone) {
      void updateNotificationTimeZone(timeZone).catch(error => {
        console.warn('Notification timezone update failed:', (error as { response?: { status?: number } })?.response?.status ?? 'unavailable');
      });
    }
  }, [userId]);

  useEffect(() => {
    if (loading) return;

    const currentSegment = segments[0] as string | undefined;
    const inBible = currentSegment === '(tabs)' && segments[1] === 'bible';
    const inOnboarding = currentSegment === 'onboarding';
    const inJoin = currentSegment === 'join';
    const inLogin = currentSegment === 'login';
    const inDiscovery = currentSegment === 'discoveries';

    // 1. Guest Logic: If not logged in, they CAN stay in (tabs), but not onboarding
    if (!user) {
        if (inOnboarding) {
             // Guests cannot do onboarding because they have no DB profile to save to
             router.replace('/login');
        }
        // ALLOW access to index/tabs
        return;
    }

    if (profileLoadError) {
      return;
    }

    // 2. User Logic: If logged in but onboarding is incomplete -> Force Onboarding
    const hasCompletedOnboarding = profile?.user_preferences?.onboardingCompleted === true;
    
    if (user && inLogin && hasCompletedOnboarding) {
      router.replace('/(tabs)');
    } else if (user && !inOnboarding && !inJoin && !inDiscovery && !inBible && !hasCompletedOnboarding) {
      router.replace('/onboarding');
    } else if (user && inOnboarding && hasCompletedOnboarding) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, profile, profileLoadError]);

  const navigationTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme).colors,
      primary: theme.tint, background: theme.background, card: theme.card,
      text: theme.text, border: theme.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{
          statusBarStyle: colorScheme === 'dark' ? 'light' : 'dark',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: theme.background },
        }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="join" options={{ headerShown: false }} />
          
          {/* Detail Screens */}
          <Stack.Screen name="news/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="devotional/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="prayer/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="advice/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="church/journey/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="discoveries/[id]" options={{ title: 'Trivia', headerShown: true }} />
        </Stack>
      </View>
    </ThemeProvider>
  );
}
