import { useAuth } from '@/context/AuthContext';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { fetchCommunityStats, fetchDailyNewsSynopsis, fetchGeneralDevotional } from '@/lib/api';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BookOpen, Heart, Newspaper, Sparkles, User } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const { isPro } = useRevenueCat();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [devotional, setDevotional] = useState<any>(null);
  const [prayer, setPrayer] = useState<any>(null);
  const [news, setNews] = useState<any>(null);
  const [communityStats, setCommunityStats] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Parallel fetch
      const [generalData, newsData, stats] = await Promise.all([
        fetchGeneralDevotional(),
        fetchDailyNewsSynopsis(),
        fetchCommunityStats()
      ]);

      if (generalData) {
        setDevotional(generalData.devotional);
        setPrayer(generalData.prayer);
      }
      setNews(newsData);
      setCommunityStats(stats);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <StatusBar style="auto" />
      <ScrollView 
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="py-6 flex-row justify-between items-center">
          <View>
            <Text className="text-xl font-bold text-slate-800 dark:text-white font-serif">Sanctuary</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            {!isPro && (
              <TouchableOpacity 
                onPress={() => router.push('/paywall')}
                className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full flex-row items-center gap-1"
              >
                <Sparkles size={12} color="#d97706" />
                <Text className="text-xs font-bold text-amber-700 dark:text-amber-500">Go Pro</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => router.push('/profile')}>
              {profile?.avatar_url ? (
                <Image 
                  source={{ uri: profile.avatar_url }} 
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" 
                />
              ) : (
                <View className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center">
                   <User size={16} color="#64748b" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {loading && !refreshing ? (
           <ActivityIndicator size="large" className="mt-10" />
        ) : (
            <View className="gap-6 pb-10">
                {/* Hero / Devotional Card */}
                {devotional && (
                    <TouchableOpacity 
                        className="bg-orange-50 dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm"
                        onPress={() => {
                            router.push(`/devotional/${devotional.devotional_id}` as any)
                        }}
                    >
                        <View className="flex-row items-center gap-2 mb-3">
                            <BookOpen size={16} color="#d97706" /> 
                            <Text className="text-xs uppercase font-bold text-amber-600 tracking-wider">Daily Devotional</Text>
                        </View>
                        <Text className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                            {devotional.title}
                        </Text>
                        <Text className="text-slate-600 dark:text-slate-300 leading-relaxed" numberOfLines={3}>
                            {devotional.content}
                        </Text>
                        <View className="mt-4 flex-row items-center gap-2">
                             <Text className="text-amber-600 font-medium">Read more</Text>
                        </View>
                    </TouchableOpacity>
                )}

                 {/* Prayer Card */}
                 {prayer && (
                    <TouchableOpacity 
                        className="bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm"
                        onPress={() => {
                             if (devotional?.devotional_id) {
                                router.push(`/devotional/${devotional.devotional_id}` as any);
                             }
                        }}
                    >
                        <View className="flex-row items-center gap-2 mb-3">
                            <Heart size={16} color="#2563eb" /> 
                            <Text className="text-xs uppercase font-bold text-blue-600 tracking-wider">Daily Prayer</Text>
                        </View>
                        <Text className="text-lg font-serif italic text-slate-800 dark:text-gray-200 leading-relaxed">
                            "{prayer.generated_prayer?.substring(0, 100)}..."
                        </Text>
                    </TouchableOpacity>
                )}

                {/* News Card */}
                {news && (
                    <TouchableOpacity 
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm"
                        onPress={() => {
                            router.push(`/news/${news.id}` as any);
                        }}
                    >
                         <View className="flex-row items-center gap-2 mb-3">
                            <Newspaper size={16} color="#475569" /> 
                            <Text className="text-xs uppercase font-bold text-slate-600 tracking-wider">News for {new Date().toLocaleDateString()}</Text>
                        </View>
                        
                       <Text className="text-slate-600 dark:text-slate-400 text-sm">
                            {news.synopsis?.substring(0, 100)}...
                       </Text>
                    </TouchableOpacity>
                )}
                
                {/* Advice Input Placeholder */}
                <View className="bg-purple-50 dark:bg-slate-900 border border-purple-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <View className="flex-row items-center gap-2 mb-3">
                        <Sparkles size={16} color="#9333ea" /> 
                        <Text className="text-xs uppercase font-bold text-purple-600 tracking-wider">Spiritual Guidance</Text>
                    </View>
                    <Text className="text-slate-600 dark:text-slate-300 mb-4">
                        What's weighing on your heart today?
                    </Text>
                    <TouchableOpacity 
                        className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700"
                        onPress={() => {
                            router.navigate('/advice');
                        }}
                    >
                        <Text className="text-slate-400">Type your situation here...</Text>
                    </TouchableOpacity>
                </View>

            </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
