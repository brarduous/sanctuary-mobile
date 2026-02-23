import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { fetchChurchContent } from '@/lib/api';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight, Users, VideoIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChurchTab() {
  const { userCongregationId } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();

  const [church, setChurch] = useState<any>(null);
  const [studies, setStudies] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userCongregationId) return;

    async function loadChurchData() {
      try {
        const data = await fetchChurchContent(userCongregationId as number);
        setChurch(data.church);
        setStudies(data.studies);
        setMessages(data.messages);
        //console.log("Fetched church data:", data);
      } catch (error) {
        console.error("Failed to load church data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadChurchData();
  }, [userCongregationId]);

  if (loading) return <View className="flex-1 items-center justify-center bg-background"><ActivityIndicator size="large" color={theme.tint} /></View>;

  if (!church) return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text className="text-xl font-bold dark:text-white mb-2">Church Not Found</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* Header */}
        <View className="mb-8 mt-2">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-lg"><Users size={20} color={theme.tint} /></View>
            <Text className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-xs">Digital Congregation</Text>
          </View>
          <Text className="text-4xl font-serif font-bold dark:text-white leading-tight">{church.name}</Text>
        </View>

        {/* Video Messages Row */}
        {messages.length > 0 && (
          <View className="mb-8">
            <Text className="text-xl font-bold dark:text-white mb-4">Pastoral Updates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
              {messages.map((msg) => {
                // Format the date to "Oct 24"
                const dateLabel = new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                console.log(`https://image.mux.com/${msg.video_playback_id}/animated.webp?width=400` );
                return (
                  <Pressable
                    key={msg.message_id}
                    onPress={() => router.push(`/church/video/${msg.message_id}` as any)}
                    className="mr-4 w-56 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm"
                  >
                    {/* Mux Animated Preview! */}
                    <View className="relative">
                      <Image
                        source={{ uri: `https://image.mux.com/${msg.video_playback_id}/animated.webp?width=400` }}
                        className="w-full h-32"
                        contentFit='cover'
                        style={{ width: '100%', height: 128 }}  
                      />
                      <View className="absolute inset-0 items-center justify-center bg-black/20">
                        <View className="bg-black/50 backdrop-blur-md rounded-full p-3">
                          <VideoIcon size={20} color="white" fill="white" />
                        </View>
                      </View>
                    </View>

                    <View className="p-4">
                      <View className="flex-row justify-between items-center mb-1.5">
                        <Text className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                          {msg.message_type?.replace('_', ' ')}
                        </Text>
                        <Text className="text-[10px] text-slate-500 font-medium">
                          {dateLabel}
                        </Text>
                      </View>
                      <Text className="font-bold text-gray-900 dark:text-white text-sm" numberOfLines={2}>
                        {msg.title}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Bible Studies List */}
        <View>
          <Text className="text-xl font-bold dark:text-white mb-4">Church Curriculums</Text>
          {studies.length === 0 ? (
            <View className="bg-slate-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 items-center">
              <BookOpen size={32} color={Colors.gray} opacity={0.5} className="mb-3" />
              <Text className="text-slate-500 text-center font-medium">Your pastor hasn't published any studies yet.</Text>
            </View>
          ) : (
            <View className="space-y-3 gap-y-3">
              {studies.map((study) => (
                <Pressable
                  key={study.study_id}
                  onPress={() => router.push(`/church/study/${study.study_id}` as any)}
                  className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 flex-row items-center gap-4 shadow-sm"
                >
                  <View className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl"><BookOpen size={24} color={theme.tint} /></View>
                  <View className="flex-1">
                    <Text className="font-bold text-lg dark:text-white mb-1">{study.title}</Text>
                    {study.subtitle && <Text className="text-slate-500 text-sm" numberOfLines={1}>{study.subtitle}</Text>}
                  </View>
                  <ChevronRight size={20} color={Colors.gray} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}