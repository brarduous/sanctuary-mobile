import { Tabs } from 'expo-router';
import { Book, Home, MessageCircle, Newspaper, User } from 'lucide-react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="bible"
        options={{
          title: 'Bible',
          headerShown: false,
          tabBarIcon: ({ color }) => <Book size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="advice"
        options={{
          title: 'Advice',
          headerShown: false,
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          headerShown: false,
          tabBarIcon: ({ color }) => <Newspaper size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2.5} />,
        }}
      />
    </Tabs>
  );
}
