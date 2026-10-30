import { Tabs, useRouter } from 'expo-router';
import { Book, Church, Home, MessageCircle, Newspaper, UserCircle } from 'lucide-react-native';
import React from 'react';
import { Image, Pressable } from 'react-native'; // <-- Add Image import
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { userCongregationId, user } = useAuth();
  const router = useRouter();
  const theme = Colors[colorScheme ?? 'light'];

  // Extract avatar URL from Supabase auth metadata
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShown: true,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 17, fontWeight: '600' },
        headerRight: () => (
          <Pressable 
            onPress={() => router.push('/profile' as any)} 
            accessibilityRole="button" accessibilityLabel="Open your profile" style={{ minWidth: 44, minHeight: 44, marginRight: 12, alignItems: 'center', justifyContent: 'center' }}
          >
            {avatarUrl ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: Colors[colorScheme ?? 'light'].border }} 
              />
            ) : (
              <UserCircle size={30} color={Colors[colorScheme ?? 'light'].text} strokeWidth={1.5} />
            )}
          </Pressable>
        ),
        tabBarStyle: {
           paddingBottom: Math.max(insets.bottom, 8),
           paddingTop: 6,
           height: 54 + Math.max(insets.bottom, 8),
           backgroundColor: theme.background,
           borderTopColor: theme.border,
        },
        tabBarLabelStyle: {
           fontSize: 11,
           fontWeight: '600',
           marginBottom: 0,
        }
      }}>
      
      {/* ... (Keep all your existing Tabs.Screen configurations below) ... */}
      <Tabs.Screen name="index" options={{ title: 'Sanctuary', tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={2} /> }} />
      <Tabs.Screen name="bible" options={{ title: 'Scripture', headerShown: false, tabBarLabel: 'Bible', tabBarIcon: ({ color }) => <Book size={24} color={color} strokeWidth={2} /> }} />
      <Tabs.Screen name="church" options={{ title: 'My Church', href: userCongregationId ? '/(tabs)/church' : null, tabBarIcon: ({ color }) => <Church size={24} color={color} strokeWidth={2} /> }} />
      <Tabs.Screen name="advice" options={{ title: 'Guidance', tabBarLabel: 'Guidance', tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} strokeWidth={2} /> }} />
      <Tabs.Screen name="news" options={{ title: 'Daily Briefing', tabBarLabel: 'News', tabBarIcon: ({ color }) => <Newspaper size={24} color={color} strokeWidth={2} /> }} />
    </Tabs>
  );
}
