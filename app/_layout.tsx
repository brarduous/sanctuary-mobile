import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
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
          <RootLayoutNav />
        </ActionSheetProvider>
      </RevenueCatProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const theme = Colors[colorScheme ?? 'light'];
  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    if (user && expoPushToken) {
      savePushTokenToProfile(user.id, expoPushToken);
    }
  }, [user, expoPushToken]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';

    // 1. Guest Logic: If not logged in, they CAN stay in (tabs), but not onboarding
    if (!user) {
        if (inOnboarding) {
             // Guests cannot do onboarding because they have no DB profile to save to
             router.replace('/login');
        }
        // ALLOW access to index/tabs
        return;
    }

    // 2. User Logic: If logged in but NO preferences -> Force Onboarding
    const hasPreferences = profile?.user_preferences && Object.keys(profile.user_preferences).length > 0;
    
    if (user && !inOnboarding && !hasPreferences) {
      router.replace('/onboarding');
    } else if (user && inOnboarding && hasPreferences) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, profile]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={
            colorScheme === 'dark'
              ? ['#2c3e50', '#0f172a'] // Dark mode: primary to background
              : ['#64748B', '#FDFBF7'] // Light mode: slate-500 to background
          }
          locations={[0, 0.3]} // Gradient in first 30% of screen
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
        />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
          
          {/* Detail Screens */}
          <Stack.Screen name="news/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="devotional/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="prayer/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="advice/[id]" options={{ headerShown: false }} />
        </Stack>
      </View>
    </ThemeProvider>
  );
}