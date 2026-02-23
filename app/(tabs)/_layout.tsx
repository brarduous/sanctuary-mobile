import { Tabs, useRouter } from 'expo-router';
import { Book, Church, Home, MessageCircle, Newspaper, UserCircle } from 'lucide-react-native';
import React from 'react';
import { Image, Pressable } from 'react-native'; // <-- Add Image import
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { userCongregationId, user } = useAuth();
  const router = useRouter();

  // Extract avatar URL from Supabase auth metadata
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
        headerRight: () => (
          <Pressable 
            onPress={() => router.push('/profile' as any)} 
            className="mr-4 opacity-80 active:opacity-50"
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
           paddingBottom: 5 + insets.bottom,
           height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
           fontSize: 10,
           fontWeight: '600',
           marginBottom: 5,
        }
      }}>
      
      {/* ... (Keep all your existing Tabs.Screen configurations below) ... */}
      <Tabs.Screen name="index" options={{ title: 'Sanctuary', tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={2.5} /> }} />
      <Tabs.Screen name="bible" options={{ title: 'Scripture', tabBarLabel: 'Bible', tabBarIcon: ({ color }) => <Book size={24} color={color} strokeWidth={2.5} /> }} />
      <Tabs.Screen name="church" options={{ title: 'My Church', href: userCongregationId ? '/(tabs)/church' : null, tabBarIcon: ({ color }) => <Church size={24} color={color} strokeWidth={2.5} /> }} />
      <Tabs.Screen name="advice" options={{ title: 'Guidance', tabBarLabel: 'Advice', tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} strokeWidth={2.5} /> }} />
      <Tabs.Screen name="news" options={{ title: 'Daily Briefing', tabBarLabel: 'News', tabBarIcon: ({ color }) => <Newspaper size={24} color={color} strokeWidth={2.5} /> }} />
    </Tabs>
  );
}