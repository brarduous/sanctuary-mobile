import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
    fetchCategories,
    fetchDailyNewsSynopsis,
    fetchNewsArticles,
    fetchUserFollowedCategories
} from '@/lib/api';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { BookOpen, Calendar, ChevronRight, Search } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    LayoutAnimation,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    UIManager,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Types
type Category = {
    id: number;
    name: string;
    recent_count?: number;
};
type Article = {
    id: number;
    article_title: string;
    created_at: string;
    article_thumbnail_url?: string;
    ai_outlook?: {
        synopsis?: string;
    };
};

export default function NewsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    // --- STATE ---
    const [synopsis, setSynopsis] = useState<any>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [userCategoryIds, setUserCategoryIds] = useState<number[]>([]);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'my_feed' | string>('all');

    // Loading States
    const [loadingSynopsis, setLoadingSynopsis] = useState(true);
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);

    // Initial Load
    const initData = useCallback(async () => {
        if (!user) return;
        
        // 1. Load Synopsis
        setLoadingSynopsis(true);
        const synData = await fetchDailyNewsSynopsis();
        setSynopsis(synData);
        setLoadingSynopsis(false);

        // 2. Load Categories
        const [allCats, userFollowed] = await Promise.all([
            fetchCategories(),
            fetchUserFollowedCategories(user.id)
        ]);

        const followedIds = (userFollowed || []).map((id: any) => Number(id));
        setUserCategoryIds(followedIds);

        // Sort Categories
        const followedCats = (allCats || []).filter((c: any) => followedIds.includes(c.id));
        const otherCats = (allCats || []).filter((c: any) => !followedIds.includes(c.id));
        // Sort logic if specific counts used, otherwise kept simple
        setCategories([...followedCats, ...otherCats]);

        // 3. Initial Feed
        let initialFilter = followedIds.length > 0 ? 'my_feed' : 'all';
        setActiveFilter(initialFilter);

        await fetchFeed(initialFilter, '', 1, followedIds);
    }, [user]);

    const fetchFeed = async (filter: string, query: string, pageNum: number, userCats: number[], append = false) => {
        let params: any = { q: query, page: pageNum, limit: 10 };

        if (filter === 'my_feed') {
            params.category_ids = userCats;
        } else if (filter !== 'all') {
            params.category_id = filter;
        }

        if (!append) setLoadingArticles(true);
        else setLoadingMore(true);

        try {
            const data = await fetchNewsArticles(params);
            const newArticles = data || [];
            
            if (newArticles.length < 10) setHasMore(false);
            else setHasMore(true);

            if (append) {
                setArticles(prev => [...prev, ...newArticles]);
            } else {
                setArticles(newArticles);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingArticles(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        initData();
    }, [initData]);

    const onRefresh = async () => {
        setRefreshing(true);
        setPage(1);
        await initData();
    };

    // Handlers
    const handleFilterChange = (filter: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveFilter(filter);
        setPage(1);
        setHasMore(true);
        setArticles([]); // Clear to show loading
        fetchFeed(filter, searchQuery, 1, userCategoryIds);
    };

    const handleSearch = () => {
        setPage(1);
        setHasMore(true);
        fetchFeed(activeFilter, searchQuery, 1, userCategoryIds);
    };

    const loadMore = () => {
        if (!hasMore || loadingMore || loadingArticles) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchFeed(activeFilter, searchQuery, nextPage, userCategoryIds, true);
    };

    // Components
    const renderHeader = () => (
        <View className="px-5 pt-4 pb-2 bg-[#FDFBF7]">
            {loadingSynopsis ? (
                <View className="bg-white rounded-[24px] p-6 h-40 items-center justify-center border border-slate-100">
                    <ActivityIndicator color="#D4A373" />
                </View>
            ) : synopsis ? (
                <View className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 mb-2">
                     <View className="flex-row justify-between items-start mb-4">
                        <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Daily Outlook</Text>
                        <Text className="text-[10px] text-slate-400">
                            {new Date(synopsis.created_at).toLocaleDateString()}
                        </Text>
                     </View>
                     <Text className="text-xl font-serif text-slate-900 mb-3 font-medium">Today's Christian Outlook</Text>
                     <Text className="text-slate-700 leading-relaxed font-serif text-base">
                         {synopsis.synopsis}
                     </Text>
                     {synopsis.scripture && (
                        <View className="mt-4 pt-4 border-t border-slate-100 flex-row gap-2">
                             <BookOpen size={16} color="#64748B" className="mt-0.5" />
                             <Text className="text-xs italic text-slate-500 font-medium flex-1">
                                 {synopsis.scripture}
                             </Text>
                        </View>
                     )}
                </View>
            ) : null}
        </View>
    );

    const renderStickyHeader = () => (
        <View className="bg-[#FDFBF7]/95 px-5 pt-2 pb-4 border-b border-slate-100 backdrop-blur-md">
            {/* Search */}
            <View className="bg-white border border-slate-200 rounded-xl flex-row items-center px-4 h-11 mb-3 shadow-sm">
                <Search size={16} color="#94A3B8" />
                <TextInput 
                    placeholder="Search articles..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    className="flex-1 ml-2 text-slate-900 font-medium h-full"
                />
            </View>

            {/* Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {userCategoryIds.length > 0 && (
                    <Pressable
                        onPress={() => handleFilterChange('my_feed')}
                        className={`px-4 py-1.5 rounded-full border ${
                            activeFilter === 'my_feed' 
                            ? 'bg-slate-900 border-slate-900' 
                            : 'bg-white border-slate-200'
                        }`}
                    >
                        <Text className={`text-xs font-bold ${
                            activeFilter === 'my_feed' ? 'text-white' : 'text-slate-600'
                        }`}>My Feed</Text>
                    </Pressable>
                )}
                
                <Pressable
                    onPress={() => handleFilterChange('all')}
                    className={`px-4 py-1.5 rounded-full border ${
                        activeFilter === 'all' 
                        ? 'bg-slate-900 border-slate-900' 
                        : 'bg-white border-slate-200'
                    }`}
                >
                    <Text className={`text-xs font-bold ${
                        activeFilter === 'all' ? 'text-white' : 'text-slate-600'
                    }`}>All News</Text>
                </Pressable>

                {categories.map(cat => (
                     <Pressable
                        key={cat.id}
                        onPress={() => handleFilterChange(cat.id.toString())}
                        className={`px-4 py-1.5 rounded-full border ${
                            activeFilter === cat.id.toString() 
                            ? 'bg-slate-900 border-slate-900' 
                            : 'bg-white border-slate-200'
                        } ${userCategoryIds.includes(cat.id) ? 'border-l-4 border-l-[#D4A373]' : ''}`}
                    >
                        <Text className={`text-xs font-bold ${
                            activeFilter === cat.id.toString() ? 'text-white' : 'text-slate-600'
                        }`}>{cat.name}</Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );

    const renderArticle = ({ item }: { item: Article }) => (
        <Pressable
            onPress={() => router.push(`/news/${item.id}` as any)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex-row gap-4 mb-4 mx-5 active:scale-[0.99]"
        >
            {item.article_thumbnail_url ? (
                <Image 
                    source={{ uri: item.article_thumbnail_url }} 
                    style={{ width: 90, height: 90, borderRadius: 12, backgroundColor: '#E2E8F0' }}
                    contentFit="cover"
                    transition={300}
                />
            ) : (
                <View className="w-[90px] h-[90px] rounded-xl bg-slate-100 items-center justify-center">
                    <BookOpen size={24} color="#CBD5E1" />
                </View>
            )}

            <View className="flex-1 justify-between py-1">
                <View>
                    <Text className="font-serif font-bold text-slate-900 leading-snug text-[15px] mb-2" numberOfLines={3}>
                        {item.article_title}
                    </Text>
                    <View className="flex-row items-center gap-1">
                         <Calendar size={10} color="#94A3B8" />
                         <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {new Date(item.created_at).toLocaleDateString()}
                         </Text>
                    </View>
                </View>
                
                <View className="flex-row items-center mt-2">
                    <Text className="text-[#D4A373] text-xs font-bold mr-1">Read Outlook</Text>
                    <ChevronRight size={12} color="#D4A373" />
                </View>
            </View>
        </Pressable>
    );

    const listData = [{ id: 'sticky-header' } as any, ...articles];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FDFBF7' }} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            
            <FlatList
                data={listData}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => {
                    if (index === 0) return renderStickyHeader();
                    return renderArticle({ item });
                }}
                // ListHeaderComponent={renderHeader}
                stickyHeaderIndices={[0]}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A373" />}
                ListEmptyComponent={
                   loadingArticles ? (
                       <View className="mt-8">
                           <ActivityIndicator color="#D4A373" />
                           <Text className="text-center text-slate-400 text-xs mt-2">Loading Articles...</Text>
                       </View>
                   ) : (
                       <View className="py-20 items-center">
                           <Text className="text-slate-400">No articles found.</Text>
                       </View>
                   )
                }
                ListFooterComponent={
                    loadingMore ? <ActivityIndicator className="py-4" color="#D4A373" /> : (hasMore ? null : <View className="h-20" />)
                }
            />
        </SafeAreaView>
    );
}
