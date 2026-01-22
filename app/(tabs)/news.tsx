import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchNewsList } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, Newspaper } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [newsList, setNewsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNews = async () => {
        try {
            const data = await fetchNewsList();
            setNewsList(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadNews();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadNews();
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
            <View className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-background">
                <Text className="text-3xl font-serif font-bold" style={{ color: theme.text }}>
                    Christian News
                </Text>
                <Text className="text-gray-500 mt-1">
                    Daily updates from a biblical perspective
                </Text>
            </View>

            <FlatList
                data={newsList}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ItemSeparatorComponent={() => <View className="h-4" />}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => router.push(`/news/${item.id}` as any)}
                        className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800"
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.9 : 1,
                            transform: [{ scale: pressed ? 0.98 : 1 }]
                        })}
                    >
                        <View className="flex-row items-center mb-2 gap-2">
                            <Calendar size={12} color={Colors.gray} />
                            <Text style={{ color: Colors.gray, fontSize: 12, fontWeight: 'bold' }}>
                                {new Date(item.created_at).toLocaleDateString(undefined, {
                                    weekday: 'short', month: 'long', day: 'numeric'
                                })}
                            </Text>
                        </View>
                        
                        <Text className="text-xl font-bold font-serif mb-2 leading-tight" style={{ color: theme.text }}>
                            {item.headline}
                        </Text>
                        
                        <Text numberOfLines={3} className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                            {item.summary}
                        </Text>

                        <View className="flex-row items-center">
                            <Text style={{ color: theme.tint, fontWeight: 'bold', fontSize: 14 }}>Read Full Story</Text>
                            <ChevronRight size={16} color={theme.tint} />
                        </View>
                    </Pressable>
                )}
                ListEmptyComponent={() => (
                    <View className="py-20 items-center">
                        <Newspaper size={48} color={Colors.gray} />
                        <Text className="text-gray-500 mt-4 text-center">No news articles found.</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}
