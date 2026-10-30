import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import ScreenState from '@/components/ScreenState';
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
    publish_date?: string | null;
    article_thumbnail_url?: string;
    ai_outlook?: {
        synopsis?: string;
    };
};

function ArticleThumbnail({ uri }: { uri: string }) {
    const [failed, setFailed] = useState(false);
    if (failed) return null;
    return <Image source={{ uri }} onError={() => setFailed(true)} style={{ width: 80, height: 80, borderRadius: 12 }} contentFit="cover" transition={200} />;
}

export default function NewsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

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
    const [feedError, setFeedError] = useState(false);

    // Initial Load
    const initData = useCallback(async () => {


        // 1. Load Synopsis
        setLoadingSynopsis(true);
        const synData = await fetchDailyNewsSynopsis();
        setSynopsis(synData);
        setLoadingSynopsis(false);

        // 2. Load Categories
        const [allCats, userFollowed] = await Promise.all([
            fetchCategories(),
            user && fetchUserFollowedCategories(user.id)
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
        setFeedError(false);

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
        } catch {
            setFeedError(true);
            setHasMore(false);
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

    const browseAllNews = () => {
        setSearchQuery('');
        setActiveFilter('all');
        setPage(1);
        setHasMore(true);
        void fetchFeed('all', '', 1, userCategoryIds);
    };

    const loadMore = () => {
        if (!hasMore || loadingMore || loadingArticles) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchFeed(activeFilter, searchQuery, nextPage, userCategoryIds, true);
    };

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (Number.isNaN(date.getTime())) return '';
        if (diffInSeconds < 0) return date.toLocaleDateString();
        if (diffInSeconds < 60) return 'Just now';

        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

        return date.toLocaleDateString();
    };

    // Components
    const renderHeader = () => (
        <View className="px-5 pt-4 pb-2" style={{ backgroundColor: theme.background }}>
            {loadingSynopsis ? (
                <View className="rounded-[24px] p-6 h-40 items-center justify-center border " style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                    <ActivityIndicator color="#D4A373" />
                </View>
            ) : synopsis ? (
                <View className="rounded-[24px] border  p-6 mb-2" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                    <View className="flex-row justify-between items-start mb-4">
                        <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.mutedForeground }}>Daily Outlook</Text>
                        <Text className="text-xs" style={{ color: theme.mutedForeground }}>
                            {new Date(synopsis.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                    <Text className="text-xl font-serif mb-3 font-medium" style={{ color: theme.text }}>Today's Christian Outlook</Text>
                    <Text className="leading-relaxed font-serif text-base" style={{ color: theme.text }}>
                        {synopsis.synopsis}
                    </Text>
                    {synopsis.scripture && (
                        <View className="mt-4 pt-4 border-t  flex-row gap-2" style={{ borderColor: theme.border }}>
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
        <View style={{ backgroundColor: theme.background, borderColor: theme.border }} className="px-5 pt-2 pb-4 border-b">
            {/* Search */}
            <View className="border border-slate-200 rounded-xl flex-row items-center px-4 h-11 mb-3" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                <Search size={16} color="#94A3B8" />
                <TextInput
                    placeholder="Search articles..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    className="flex-1 ml-2 font-medium h-full"
                    style={{ color: theme.text }}
                />
            </View>

            {/* Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {userCategoryIds.length > 0 && (
                    <Pressable
                        onPress={() => handleFilterChange('my_feed')}
                        className={`px-4 py-1.5 rounded-full border ${activeFilter === 'my_feed'
                                ? 'bg-slate-900 border-slate-900'
                                : 'border-slate-200'
                            }`}
                        style={{ minHeight: 44, justifyContent: 'center', backgroundColor: activeFilter === 'my_feed' ? theme.tint : theme.card, borderColor: activeFilter === 'my_feed' ? theme.tint : theme.border }}
                    >
                        <Text className={`text-xs font-bold ${activeFilter === 'my_feed' ? 'text-white' : ''
                            }`} style={{ color: activeFilter === 'my_feed' ? theme.onTint : theme.text }}>My Feed</Text>
                    </Pressable>
                )}

                <Pressable
                    onPress={() => handleFilterChange('all')}
                    className={`px-4 py-1.5 rounded-full border ${activeFilter === 'all'
                            ? 'bg-slate-900 border-slate-900'
                            : 'border-slate-200'
                        }`}
                    style={{ minHeight: 44, justifyContent: 'center', backgroundColor: activeFilter === 'all' ? theme.tint : theme.card, borderColor: activeFilter === 'all' ? theme.tint : theme.border }}
                >
                    <Text className={`text-xs font-bold ${activeFilter === 'all' ? 'text-white' : ''
                        }`} style={{ color: activeFilter === 'all' ? theme.onTint : theme.text }}>All News</Text>
                </Pressable>

                {categories.map(cat => (
                    <Pressable
                        key={cat.id}
                        onPress={() => handleFilterChange(cat.id.toString())}
                        className={`px-4 py-1.5 rounded-full border ${activeFilter === cat.id.toString()
                                ? 'bg-slate-900 border-slate-900'
                                : 'border-slate-200'
                            } ${userCategoryIds.includes(cat.id) ? 'border-l-4 border-l-[#D4A373]' : ''}`}
                        style={{ minHeight: 44, justifyContent: 'center', backgroundColor: activeFilter === cat.id.toString() ? theme.tint : theme.card, borderColor: activeFilter === cat.id.toString() ? theme.tint : theme.border }}
                    >
                        <Text className={`text-xs font-bold ${activeFilter === cat.id.toString() ? 'text-white' : ''
                            }`} style={{ color: activeFilter === cat.id.toString() ? theme.onTint : theme.text }}>{cat.name}</Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );

    const renderArticle = ({ item }: { item: Article }) => (
        <Pressable
            onPress={() => router.push(`/news/${item.id}` as any)}
            className="rounded-2xl p-4 border  flex-row gap-4 mt-4 mx-5 active:scale-[0.99]"
            style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
            {item.article_thumbnail_url ? <ArticleThumbnail key={item.article_thumbnail_url} uri={item.article_thumbnail_url} /> : null}

            <View className="flex-1 justify-between py-1">
                <View>
                    <Text className="font-serif font-bold leading-snug text-base mb-2" numberOfLines={3} style={{ color: theme.text }}>
                        {item.article_title}
                    </Text>
                    <View className="flex-row items-center gap-1">
                        <Calendar size={13} color={theme.mutedForeground} />
                        <Text className="text-xs font-medium" style={{ color: theme.mutedForeground }}>
                            {getRelativeTime(item.publish_date || item.created_at)}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center mt-2">
                    <Text className="text-xs font-bold mr-1" style={{ color: theme.tint }}>Read Outlook</Text>
                    <ChevronRight size={12} color={theme.tint} />
                </View>
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['left', 'right']}>


            <FlatList
                style={{ paddingVertical: 2 }}
                data={articles}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderArticle}
                ListHeaderComponent={renderStickyHeader()}
                stickyHeaderIndices={[0]}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A373" />}
                ListEmptyComponent={
                    loadingArticles ? <ScreenState title="Loading articles" loading /> : feedError ?
                        <ScreenState title="News unavailable" message="We couldn’t load these articles. Please try again." onRetry={handleSearch} /> :
                        <ScreenState title="No articles found"
                            message={searchQuery.trim() ? 'Try another search or browse all news.' : activeFilter!=='all' ? 'There are no articles here yet. Explore the latest from all topics.' : 'Check back for new articles.'}
                            actionLabel={searchQuery.trim() || activeFilter!=='all' ? 'Browse all news':'Refresh news'}
                            onRetry={searchQuery.trim() || activeFilter!=='all' ? browseAllNews:handleSearch}/>
                }
                ListFooterComponent={
                    loadingMore ? <ActivityIndicator className="py-4" color={theme.tint} /> : feedError && articles.length > 0 ?
                        <ScreenState title="More articles unavailable" message="Your loaded articles are still available. Try loading the next page again." onRetry={() => { void fetchFeed(activeFilter, searchQuery, page, userCategoryIds, true); }} /> : (hasMore ? null : <View className="h-20" />)
                }
            />
        </SafeAreaView>
    );
}
