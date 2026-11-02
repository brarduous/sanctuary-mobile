import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Church, Gamepad2, Newspaper, UserCircle, Video } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MoreRow from '@/components/MoreRow';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';

export default function MoreScreen() {
  const { userCongregationId } = useAuth();
  const theme = Colors[useColorScheme() ?? 'light'], router = useRouter();
  return <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: theme.background }}>
    <ScrollView contentContainerStyle={{ padding: Layout.gutter, paddingBottom: Layout.sectionGap, gap: 24 }}>
      <View style={{ gap: 8 }}>
        <Text accessibilityRole="header" style={{ ...Typography.editorialTitle, fontFamily: Layout.serif, color: theme.text }}>Explore Sanctuary</Text>
        <Text style={{ ...Typography.helper, color: theme.mutedForeground }}>A little learning. A fresh perspective. A place to connect.</Text>
      </View>
      <View style={{ gap: 12 }}>
        <MoreRow title="Games" description="Today’s Bible Trivia, results, and past games" icon={Gamepad2} onPress={() => router.push({ pathname: '/discoveries', params: { source: 'games' } })} />
        <MoreRow title="Videos" description="Faith videos recommended for your walk" icon={Video} onPress={() => router.push('/videos')} />
        <MoreRow title="News" description="Your Daily Briefing and stories through Scripture" icon={Newspaper} onPress={() => router.navigate('/(tabs)/news')} />
      </View>
      <View style={{ gap: 12 }}>
        <Text accessibilityRole="header" style={{ ...Typography.formLabel, color: theme.text }}>Your Sanctuary</Text>
        <MoreRow title="Profile & settings" description="Your preferences, saved content, and account" icon={UserCircle} onPress={() => router.push('/profile')} />
        <MoreRow title="Notifications" description="Choose your daily faith notifications" icon={Bell} onPress={() => router.push({ pathname: '/profile', params: { section: 'notifications' } })} />
        <MoreRow title={userCongregationId ? 'My Church' : 'Join a church'} description={userCongregationId ? 'Church messages, studies, giving, and community' : 'Connect using your church’s invitation'} icon={Church} onPress={() => userCongregationId ? router.navigate('/(tabs)/church') : router.push('/join')} />
      </View>
    </ScrollView>
  </SafeAreaView>;
}
