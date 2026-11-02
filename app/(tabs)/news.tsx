import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import ScreenState from '@/components/ScreenState';
import NewsStoryCard from '@/components/NewsStoryCard';
import NewsBriefingCard from '@/components/NewsBriefingCard';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';
import { useAuth } from '@/context/AuthContext';
import { fetchCategories, fetchDailyNewsSynopsis, fetchNewsArticles, fetchUserFollowedCategories } from '@/lib/api';
import type { NewsArticle, NewsBriefing } from '@/lib/newsFeed';

type Category = { id: number; name: string };
export default function NewsScreen() {
  const { user } = useAuth(), account = user?.id || null;
  const router = useRouter(), theme = Colors[useColorScheme() ?? 'light'];
  const params = useLocalSearchParams<{ briefing?: string; request?: string }>();
  const list = useRef<FlatList<NewsArticle>>(null);
  const activeAccount = useRef(account); activeAccount.current = account;
  const request = useRef(0), initialization = useRef(0), briefingRequest = useRef(0), appending = useRef(false);
  const [synopsis, setSynopsis] = useState<NewsBriefing | null>(null);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false), [topicSearch, setTopicSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]), [userCategoryIds, setUserCategoryIds] = useState<number[]>([]);
  const [articles, setArticles] = useState<NewsArticle[]>([]), [feedOwner, setFeedOwner] = useState(account);
  const [searchQuery, setSearchQuery] = useState(''), [submittedQuery, setSubmittedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loadingArticles, setLoadingArticles] = useState(true), [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true), [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false), [feedError, setFeedError] = useState(false);

  const loadBriefing = useCallback(async () => {
    const sequence = ++briefingRequest.current;
    const value = await fetchDailyNewsSynopsis();
    if (sequence === briefingRequest.current) setSynopsis(value);
  }, []);

  const fetchFeed = useCallback(async (filter: string, query: string, pageNum: number, userCats: number[], append = false) => {
    const sequence = ++request.current, owner = account;
    const q = query.trim();
    const options: Parameters<typeof fetchNewsArticles>[0] = { q, page: pageNum, limit: 10 };
    if (filter === 'my_feed') options.category_ids = userCats;
    else if (filter !== 'all') options.category_id = filter;
    appending.current = append;
    if (!append) setLoadingArticles(true); else setLoadingMore(true);
    setFeedError(false);
    try {
      const rows = await fetchNewsArticles(options);
      if (sequence !== request.current || activeAccount.current !== owner) return;
      if (!Array.isArray(rows)) throw new Error('Invalid news feed');
      setArticles(previous => append ? [...new Map([...previous, ...rows].map(item => [item.id, item])).values()] : rows);
      setFeedOwner(owner); setPage(pageNum);
      // Search returns one bounded result set; it does not accept pagination.
      setHasMore(!q && rows.length === 10);
    } catch {
      if (sequence === request.current && activeAccount.current === owner) { setFeedError(true); setHasMore(false); }
    } finally {
      if (sequence === request.current && activeAccount.current === owner) {
        setLoadingArticles(false); setLoadingMore(false); setRefreshing(false); appending.current = false;
      }
    }
  }, [account]);

  useEffect(() => {
    const sequence = ++initialization.current;
    request.current++; appending.current = false;
    setArticles([]); setFeedOwner(account); setLoadingArticles(true); setLoadingMore(false);
    setSearchQuery(''); setSubmittedQuery(''); setActiveFilter('all'); setUserCategoryIds([]);
    void loadBriefing();
    void (async () => {
      const [all, followed] = await Promise.all([fetchCategories(), account ? fetchUserFollowedCategories(account) : Promise.resolve([])]);
      if (sequence !== initialization.current) return;
      const ids = (followed || []).map(Number);
      setUserCategoryIds(ids);
      setCategories([...(all || []).filter((cat: Category) => ids.includes(cat.id)), ...(all || []).filter((cat: Category) => !ids.includes(cat.id))]);
      const filter = ids.length ? 'my_feed' : 'all';
      setActiveFilter(filter);
      await fetchFeed(filter, '', 1, ids);
    })();
    return () => { initialization.current++; request.current++; briefingRequest.current++; };
  }, [account, fetchFeed, loadBriefing]);

  useEffect(() => {
    if (params.briefing === 'open') { setBriefingOpen(true); list.current?.scrollToOffset({ offset: 0, animated: false }); }
  }, [params.briefing, params.request]);

  const changeFeed = (filter: string, query: string) => {
    setActiveFilter(filter); setSubmittedQuery(query.trim()); setArticles([]); setHasMore(true); setLoadingMore(false);
    void fetchFeed(filter, query, 1, userCategoryIds);
  };
  const handleSearch = () => changeFeed(searchQuery.trim() ? 'all' : activeFilter, searchQuery);
  const browseAll = () => { setSearchQuery(''); changeFeed('all', ''); };
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchFeed(activeFilter, submittedQuery, 1, userCategoryIds), loadBriefing()]);
  };
  const loadMore = () => {
    if (!hasMore || appending.current || loadingMore || loadingArticles || submittedQuery) return;
    void fetchFeed(activeFilter, submittedQuery, page + 1, userCategoryIds, true);
  };
  const filterLabel = activeFilter === 'my_feed' ? 'For you' : categories.find(cat => String(cat.id) === activeFilter)?.name || 'Latest stories';
  const visibleCategories = categories.slice(0, 5);
  const selectedCategory = categories.find(cat => String(cat.id) === activeFilter);
  if (selectedCategory && !visibleCategories.some(cat => cat.id === selectedCategory.id)) visibleCategories.push(selectedCategory);
  const filters = [...(userCategoryIds.length ? [{ id: 'my_feed', name: 'For you' }] : []), { id: 'all', name: 'All news' }, ...visibleCategories.map(cat => ({ id: String(cat.id), name: cat.name }))];

  const header = <View style={{ padding: Layout.gutter, paddingBottom: 8, gap: 16 }}>
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={{ fontFamily: Layout.serif, fontSize: 30, lineHeight: 38, color: theme.text }}>News, with perspective.</Text>
    </View>
    {synopsis?.synopsis ? <NewsBriefingCard briefing={synopsis} expanded={briefingOpen} onToggle={() => setBriefingOpen(open => !open)} /> : null}
    <View style={{ minHeight: 50, flexDirection: 'row', alignItems: 'center', paddingLeft: 14, borderRadius: Layout.controlRadius, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, gap: 10 }}>
      <Search size={19} color={theme.mutedForeground} accessible={false} />
      <TextInput accessibilityLabel="Search news" placeholder="Find a story or topic" placeholderTextColor={theme.mutedForeground} value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearch} returnKeyType="search" style={{ ...Typography.helper, color: theme.text, flex: 1, paddingVertical: 12 }} />
      {searchQuery ? <Pressable accessibilityRole="button" accessibilityLabel="Clear news search" onPress={() => { setSearchQuery(''); changeFeed(activeFilter, ''); }} style={{ minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><X size={18} color={theme.mutedForeground} /></Pressable> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Search articles" onPress={handleSearch} style={{ minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><ArrowRight size={20} color={theme.tint} /></Pressable>
    </View>
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
    <ScrollView style={{ flex: 1 }} horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8 }}>
      {filters.map(filter => <Pressable key={filter.id} accessibilityRole="button" accessibilityState={{ selected: activeFilter === filter.id }} onPress={() => { setSearchQuery(''); changeFeed(filter.id, ''); }} style={{ minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center', borderRadius: 24, borderWidth: 1, borderColor: activeFilter === filter.id ? theme.tint : theme.border, backgroundColor: activeFilter === filter.id ? theme.selection : theme.card }}><Text style={{ ...Typography.metadata, fontWeight: '600', color: activeFilter === filter.id ? theme.tint : theme.text }}>{filter.name}</Text></Pressable>)}
    </ScrollView>
    <Pressable accessibilityRole="button" accessibilityLabel="Explore all news topics" onPress={() => { setTopicSearch(''); setTopicsOpen(true); }} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: Layout.controlRadius, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }}><SlidersHorizontal size={20} color={theme.tint} accessible={false} /></Pressable>
    </View>
    {submittedQuery || activeFilter !== 'all' ? <Text accessibilityRole="header" style={{ ...Typography.formLabel, color: theme.text, marginTop: 4 }}>{submittedQuery ? 'Search results' : filterLabel}</Text> : null}
  </View>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['left', 'right']}>
    <FlatList ref={list} data={feedOwner === account ? articles : []} keyExtractor={item => String(item.id)} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: Layout.sectionGap }}
      renderItem={({ item, index }) => <View style={{ marginHorizontal: Layout.gutter, marginTop: 14 }}><NewsStoryCard article={item} featured={index === 0 && !submittedQuery} onPress={() => router.push({ pathname: '/news/[id]', params: { id: String(item.id) } })} /></View>}
      ListHeaderComponent={header} onEndReached={loadMore} onEndReachedThreshold={0.4}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void onRefresh(); }} tintColor={theme.tint} />}
      ListEmptyComponent={loadingArticles ? <ScreenState title="Finding your stories" loading /> : feedError ? <ScreenState title="News could not load" message="Connect and try again. Your topics are saved." onRetry={handleSearch} /> : <ScreenState title="No stories here yet" message={submittedQuery ? 'Try another search or explore all news.' : 'Explore the latest stories from all topics.'} actionLabel="Browse all news" onRetry={browseAll} />}
      ListFooterComponent={loadingMore ? <ActivityIndicator accessibilityLabel="Loading more stories" color={theme.tint} style={{ padding: 24 }} /> : feedError && articles.length ? <ScreenState title="More stories could not load" message="Your loaded stories are still here." onRetry={() => { void fetchFeed(activeFilter, submittedQuery, page + 1, userCategoryIds, true); }} /> : null}
    />
    <Modal visible={topicsOpen} animationType="none" presentationStyle="pageSheet" onRequestClose={() => setTopicsOpen(false)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ padding: Layout.gutter, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Text accessibilityRole="header" style={{ ...Typography.editorialTitle, fontFamily: Layout.serif, color: theme.text, flex: 1 }}>Explore topics</Text><Pressable accessibilityRole="button" accessibilityLabel="Close news topics" onPress={() => setTopicsOpen(false)} style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}><X size={23} color={theme.text} /></Pressable></View>
          <TextInput accessibilityLabel="Find a news topic" placeholder="Find a topic" placeholderTextColor={theme.mutedForeground} value={topicSearch} onChangeText={setTopicSearch} style={{ ...Typography.helper, color: theme.text, minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: Layout.controlRadius, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card }} />
        </View>
        <FlatList data={categories.filter(cat => cat.name.toLowerCase().includes(topicSearch.trim().toLowerCase()))} keyExtractor={cat => String(cat.id)} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: Layout.gutter, paddingTop: 0, gap: 8 }} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: String(item.id) === activeFilter }} onPress={() => { setTopicsOpen(false); setSearchQuery(''); changeFeed(String(item.id), ''); }} style={{ minHeight: 56, padding: 16, borderRadius: Layout.controlRadius, backgroundColor: String(item.id) === activeFilter ? theme.selection : theme.card, borderWidth: 1, borderColor: String(item.id) === activeFilter ? theme.tint : theme.border }}><Text style={{ ...Typography.formLabel, color: theme.text }}>{item.name}</Text></Pressable>} ListEmptyComponent={<Text style={{ ...Typography.helper, color: theme.mutedForeground }}>No topics match. Try another word.</Text>} />
      </SafeAreaView>
    </Modal>
  </SafeAreaView>;
}
