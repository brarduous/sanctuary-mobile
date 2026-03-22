import ChristianAdviceCard from '@/components/ChristianAdviceCard';
import GeneratingState from '@/components/GeneratingState';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
    checkAdviceLimit,
    deleteDevotional,
    deletePrayer,
    fetchCommunityStats,
    fetchDailyDevotionals,
    fetchDailyNewsSynopsis,
    fetchDailyPrayers,
    fetchGeneralDevotional,
    fetchRandomPrayer, // <-- Using the new API function!
    fetchRecommendedVideos,
    fetchUserStreak,
    generateContent,
    logUserActivity, // <-- Using the generic activity logger!
} from '@/lib/api';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
    BookOpen,
    Check,
    ChevronRight,
    Flame,
    Heart,
    HeartHandshake,
    Lock,
    Sparkles,
    Users,
    X
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    LayoutAnimation,
    Linking,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    UIManager,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from "react-native-view-shot";

import VerseOfTheDayCard from '@/components/VerseOfTheDayCard';
const bg1 = require('@/assets/images/votd-image-1.jpg');
const bg2 = require('@/assets/images/votd-image-2.jpg');
const bg3 = require('@/assets/images/votd-image-3.jpg');
const bg4 = require('@/assets/images/votd-image-4.jpg');
const bg5 = require('@/assets/images/votd-image-5.jpg');

const backgrounds = [bg1, bg2, bg3, bg4, bg5];
const todayIndex = new Date().getDate() % backgrounds.length;
const verseBackground = backgrounds[todayIndex];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

async function scheduleStreakNotification(streak: number, userName: string) {
    if (Platform.OS === 'web') return;

    const Notifications = await import('expo-notifications');

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    let title = "Good Morning, " + (userName || "Friend");
    let body = "Start your day with Sanctuary.";

    if (streak > 0) {
        title = "Keep it going! 🔥";
        body = `You're on a ${streak}-day streak. Don't break the chain!`;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 8,
            minute: 0,
        },
    });
}

export default function HomeScreen() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const viewShotRef = useRef<ViewShot>(null);

    // --- STATE ---
    const [dailyNews, setDailyNews] = useState<any>(null);
    const [todaysDevotional, setTodaysDevotional] = useState<any>(null);
    const [todaysPrayer, setTodaysPrayer] = useState<any>(null);
    const [streak, setStreak] = useState(0);
    const [communityStats, setCommunityStats] = useState({ totalPrayedForYou: 0 });
    const [adviceLimitReached, setAdviceLimitReached] = useState(false);

    // Community Interaction State
    const [communityPrayer, setCommunityPrayer] = useState<any>(null);
    const [prayingState, setPrayingState] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [loadingCommunityPrayer, setLoadingCommunityPrayer] = useState(false);

    // UI State
    const [refreshing, setRefreshing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // bible version
    const userBibleVersion = profile?.preferred_translation || 'NIV';

    //polling ref state
    const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

    const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]);

    const handleShareVerse = async () => {
        try {
            if (viewShotRef.current && viewShotRef.current.capture) {
                const uri = await viewShotRef.current.capture();
                await Sharing.shareAsync(uri);
            }
        } catch (error) {
            console.error("Sharing failed", error);
        }
    };

    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    // --- DATA LOADING ---
    const loadData = useCallback(async (forceRefresh = false) => {
        if (!user) {
            const [news, videos, generalData] = await Promise.all([
                fetchDailyNewsSynopsis(),
                fetchRecommendedVideos(),
                fetchGeneralDevotional()
            ]);
            setDailyNews(news);
            //console.log("Recommended Videos:", videos);
            setRecommendedVideos(videos);
            if (generalData) {
                setTodaysDevotional(generalData.devotional);
                setTodaysPrayer(generalData.prayer);
            }
            setIsGenerating(false);
            return;
        }
        
        const [news, streakData, stats, adviceLimit, videos] = await Promise.all([
            fetchDailyNewsSynopsis(),
            fetchUserStreak(user.id, 'daily_devotional'),
            fetchCommunityStats(),
            checkAdviceLimit(user.id),
            fetchRecommendedVideos(),
        ]);
        
        const isPro = profile?.subscription_tier === 'pro';

        setDailyNews(news);
        setStreak(streakData?.current_streak || streakData?.streak || 0);
        if (user) {
            scheduleStreakNotification(streakData?.current_streak || streakData?.streak || 0, user.user_metadata?.given_name);
        }
        setCommunityStats(stats || { totalPrayedForYou: 0 });
        setAdviceLimitReached(!isPro && adviceLimit?.limitReached || false);
        setRecommendedVideos(videos);

        if (!isPro) {
            const generalData = await fetchGeneralDevotional();
            if (generalData) {
                setTodaysDevotional(generalData.devotional);
                setTodaysPrayer(generalData.prayer);
                setIsGenerating(false);
            } else {
                console.warn("No general content.");
            }
            return;
        }
        
        const now = new Date();
        const isToday = (dateString: string) => {
            if (!dateString) return false;
            const date = new Date(dateString);
            return date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth() &&
                date.getDate() === now.getDate();
        };

        const [allDevotionals, allPrayers] = await Promise.all([
            fetchDailyDevotionals(user.id),
            fetchDailyPrayers(user.id)
        ]);

        let todayDevo = allDevotionals.find((d: any) => isToday(d.created_at));
        let todayPrayer = allPrayers.find((p: any) => isToday(p.created_at));

        if (todayDevo?.status === 'failed') {
            await deleteDevotional(todayDevo.devotional_id || todayDevo.id);
            todayDevo = null;
        }
        if (todayPrayer?.status === 'failed') {
            await deletePrayer(todayPrayer.prayer_id || todayPrayer.id);
            todayPrayer = null;
        }

        if (todayDevo?.status === 'completed' && todayPrayer?.status === 'completed') {
            setTodaysDevotional(todayDevo);
            setTodaysPrayer(todayPrayer);
            setIsGenerating(false);

            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            return;
        }

        if (!todayDevo) {
            setIsGenerating(true);
            try {
                await generateContent('/generate-devotional', {
                    userId: user.id,
                    focusAreas: profile?.user_preferences?.focusAreas || [],
                    improvementAreas: profile?.user_preferences?.improvementAreas || [],
                    recentDevotionals: allDevotionals.slice(0, 10),
                });
            } catch (err) {
                console.error("Generation trigger failed", err);
            }
        } else {
            setIsGenerating(true);
        }

        if (!pollingRef.current) {
            pollingRef.current = setInterval(async () => {
                const updatedDevos = await fetchDailyDevotionals(user.id);
                const updatedPrayers = await fetchDailyPrayers(user.id);

                const newDevo = updatedDevos.find((d: any) => isToday(d.created_at));
                const newPrayer = updatedPrayers.find((p: any) => isToday(p.created_at));

                if (newDevo?.status === 'completed' && newPrayer?.status === 'completed') {
                    setTodaysDevotional(newDevo);
                    setTodaysPrayer(newPrayer);
                    setIsGenerating(false);
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current);
                        pollingRef.current = null;
                    }
                }
            }, 3000); 
        }

    }, [user, profile]);

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await loadData(true);
        setRefreshing(false);
    };

    // --- ACTIONS ---

    const handlePrayForOthers = async () => {
        setLoadingCommunityPrayer(true);
        try {
            const prayer = await fetchRandomPrayer(user?.congregation_id);
            if (prayer && !prayer.error) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setCommunityPrayer(prayer);
            } else {
                Alert.alert("Community Caught Up", "No new prayer requests right now. Check back later!");
            }
        } catch (error) {
            Alert.alert("Community Caught Up", "No new prayer requests right now. Check back later!");
        } finally {
            setLoadingCommunityPrayer(false);
        }
    };

    const handlePrayAction = async () => {
        if (!communityPrayer) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPrayingState('sending');

        setTimeout(async () => {
            // Log the activity to feed the Pastor's CRM dashboard
            if (user && communityPrayer) {
                await logUserActivity(
                    user.id,
                    'intercessory_prayer',
                    communityPrayer.id,
                    `Prayed for a ${communityPrayer.visibility} request.`
                );
            }
            
            setPrayingState('sent');

            setTimeout(() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setCommunityPrayer(null);
                setPrayingState('idle');
            }, 1500);
        }, 1000);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 5) return "Hi There";
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
            <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A373" />}
                showsVerticalScrollIndicator={false}
            >

                {/* --- HEADER --- */}
                <View className="flex-row justify-between items-start mb-8 mt-2">
                    <View>
                        <Text className="font-serif italic text-xs mb-1" style={{ color: theme.mutedForeground }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>
                        <Text className="text-3xl font-serif leading-tight" style={{ color: theme.text }}>
                            {getGreeting()},{'\n'}
                            <Text className="font-bold">
                                {user?.user_metadata?.given_name || 'Friend'}.
                            </Text>
                        </Text>
                    </View>

                    {user && streak > 1 && (
                        <View className="flex-row items-center bg-slate-100 rounded-full px-3 py-1">
                            <Flame size={14} color="#F97316" fill="#F97316" />
                            <Text className="ml-1 text-xs font-bold text-slate-600">
                                {streak} Day Streak
                            </Text>
                        </View>
                    )}
                    {/* Show Sign In for Guest */}
                    {!user && (
                        <Pressable onPress={() => router.push('/login')} className="bg-slate-100 px-4 py-2 rounded-full">
                            <Text className="font-bold text-slate-700">Sign In</Text>
                        </Pressable>
                    )}
                </View>

                {todaysDevotional && (
                    <VerseOfTheDayCard
                        reference={todaysDevotional.scripture}
                        version={userBibleVersion}
                        backgroundImage={verseBackground}
                    />
                )}
                {/* --- 1. DAILY DEVOTIONAL --- */}
                <View className="mb-4 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                        <BookOpen size={16} color="#94A3B8" />
                        <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Daily Devotional</Text>
                    </View>
                    {todaysDevotional && (
                        <View className={`px-2 py-0.5 rounded-full flex-row items-center gap-1 ${todaysDevotional.type === 'general' ? 'bg-slate-100' : 'bg-[#D4A373]/10'}`}>
                            {todaysDevotional.type === 'general' ? <BookOpen size={10} color="#64748B" /> : <Sparkles size={10} color="#D4A373" />}
                            <Text className={`text-[10px] font-bold ${todaysDevotional.type === 'general' ? 'text-slate-500' : 'text-[#D4A373]'}`}>
                                {todaysDevotional.type === 'general' ? 'General Edition' : 'For You'}
                            </Text>
                        </View>
                    )}
                </View>

                {isGenerating ? (
                    <GeneratingState />
                ) : todaysDevotional ? (
                    <Link href={`/devotional/${todaysDevotional.devotional_id}`} asChild>
                        <Pressable className="rounded-2xl border border-slate-100 dark:border-slate-800 mb-10 overflow-hidden active:scale-[0.99] transition-transform" style={{ backgroundColor: theme.card }}>
                            <View className="p-6">
                                <Text className="text-xl font-serif mb-3 leading-tight font-medium" numberOfLines={2} style={{ color: theme.text }}>
                                    {todaysDevotional.title}
                                </Text>

                                <Text className="leading-relaxed text-sm mb-4" numberOfLines={3} style={{ color: theme.mutedForeground }}>
                                    {todaysDevotional.content?.replace(/<[^>]*>?/gm, '').replace(/[#*`]/g, '').replace(/\\n/g, ' ').trim()}
                                </Text>

                                <View className="flex-row items-center">
                                    <Text className="font-bold text-sm mr-1" style={{ color: theme.text }}>Read today's word</Text>
                                    <ChevronRight size={16} color={theme.text} />
                                </View>

                                {/* UPSELL FOR GENERAL */}
                                {todaysDevotional.type === 'general' && (
                                    <Pressable
                                        onPress={(e) => { e.stopPropagation(); router.push('/profile'); }}
                                        className="mt-4 pt-4 border-t border-dashed border-slate-200 flex-row items-center justify-between"
                                    >
                                        <Text className="text-xs text-slate-400">Want devotionals written for <Text className="font-bold text-slate-500">your</Text> Journey?</Text>
                                        <View className="flex-row items-center gap-1">
                                            <Lock size={10} color="#64748B" />
                                            <Text className="text-[10px] font-bold text-slate-500">Unlock Pro</Text>
                                        </View>
                                    </Pressable>
                                )}
                            </View>
                        </Pressable>
                    </Link>
                ) : (
                    <View className="p-6 rounded-2xl mb-10 border border-slate-100 dark:border-slate-800 items-center" style={{ backgroundColor: theme.card }}>
                        <Text className="text-slate-400 mb-2">Unable to load content.</Text>
                        <Pressable onPress={() => loadData(true)} className="bg-slate-100 px-4 py-2 rounded-full">
                            <Text className="text-slate-700 font-bold">Retry</Text>
                        </Pressable>
                    </View>
                )}

                {/* --- 2. GUIDED PRAYER (New) --- */}
                {!isGenerating && todaysPrayer && (
                    <View className="mb-10">
                        <View className="mb-3 flex-row items-center gap-2">
                            <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Guided Prayer</Text>
                        </View>
                        <Pressable
                            onPress={() => router.push(`/prayer/${todaysPrayer.prayer_id || todaysPrayer.id}`)}
                            className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 active:scale-[0.99]"
                            style={{ backgroundColor: theme.card }}
                        >
                            <Text className="text-lg font-serif mb-1" style={{ color: theme.text }}>Daily Prayer</Text>
                            <Text className="text-sm" style={{ color: theme.mutedForeground }}>Take a moment to connect.</Text>
                        </Pressable>
                    </View>
                )}
                {recommendedVideos.length > 0 && (
                    <View className="mt-10 px-4">
                        <Text className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: theme.mutedForeground }}>
                            Recommended For Your Walk
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {recommendedVideos.map((video) => (
                                <Pressable
                                    key={video.id}
                                    onPress={() => Linking.openURL(video.video_url)}
                                    className="w-72 mr-4 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm"
                                    style={{ backgroundColor: theme.card }}
                                >
                                    <Image source={{ uri: video.thumbnail_url }} style={{ width: '100%', height: 140 }} />
                                    <View className="p-4">
                                        <Text className="font-bold mb-2" numberOfLines={2} style={{ color: theme.text }}>{video.title}</Text>
                                        <View className="flex-row flex-wrap gap-1">
                                            {video.focus_areas.map((tag: any) => (
                                                <View key={tag} className="bg-orange-50 dark:bg-orange-500/15 px-2 py-1 rounded-md">
                                                    <Text className="text-[10px] text-orange-700 dark:text-orange-300 font-bold">{tag}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                )}
                {/* --- 3. COMMUNITY STATS --- */}
                {user && communityStats.totalPrayedForYou > 0 && (
                    <View className="bg-[#D4A373]/5 dark:bg-[#D4A373]/10 border border-[#D4A373]/20 dark:border-[#D4A373]/30 rounded-xl p-4 flex-row items-center gap-3 mb-10 mt-10">
                        <View className="bg-[#D4A373]/10 dark:bg-[#D4A373]/20 p-2 rounded-full">
                            <Users size={18} color="#D4A373" />
                        </View>
                        <Text className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                            <Text className="font-bold">{communityStats.totalPrayedForYou} people</Text> in your community have prayed for you this week.
                        </Text>
                    </View>
                )}

                {/* --- 4. COMMUNITY --- */}
                <View className="mb-5 flex-row items-center justify-between mt-6">
                    <View className="flex-row items-center gap-2">
                        <Heart size={16} color="#94A3B8" />
                        <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Community</Text>
                    </View>
                </View>
                {user ? (
                    <View className="mb-10">
                        {communityPrayer ? (
                            <View className="bg-[#1E293B] dark:bg-[#0F172A] rounded-2xl shadow-lg overflow-hidden relative">
                                <View className="absolute top-4 right-4 z-10">
                                    <Pressable onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setCommunityPrayer(null); }} className="p-2 bg-white/10 rounded-full">
                                        <X size={16} color="white" />
                                    </Pressable>
                                </View>

                                <LinearGradient
                                    colors={['#1E293B', '#0F172A']}
                                    className="p-6 min-h-[220px] justify-center"
                                >
                                    {prayingState === 'sent' ? (
                                        <View className="items-center justify-center py-6">
                                            <View className="w-14 h-14 bg-green-500 rounded-full items-center justify-center mb-4 shadow-lg shadow-green-900/50">
                                                <Check size={28} color="white" strokeWidth={3} />
                                            </View>
                                            <Text className="text-white font-bold text-xl mb-1">Prayer Sent</Text>
                                            <Text className="text-slate-400 text-center">You've lifted someone up today.</Text>
                                        </View>
                                    ) : (
                                        <>
                                            <View className="flex-row justify-between items-center mb-6">
                                                <View className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                                                    <Text className="text-white/90 text-[10px] font-bold uppercase">
                                                        {communityPrayer.visibility === 'congregation' ? 'Church Family' : 'Global Community'}
                                                    </Text>
                                                </View>
                                            </View>

                                            <Text className="text-white text-lg font-serif mb-4 leading-relaxed italic opacity-90">
                                                "{communityPrayer.request_text}"
                                            </Text>
                                            
                                            <Text className="text-slate-400 font-bold uppercase tracking-wider text-sm mb-8">
                                                — {communityPrayer.author_name}
                                            </Text>

                                            <Pressable
                                                onPress={handlePrayAction}
                                                disabled={prayingState !== 'idle'}
                                                className={`w-full py-4 rounded-xl flex-row items-center justify-center ${prayingState === 'sending' ? 'bg-white/90' : 'bg-white'} active:scale-[0.98] transition-all shadow-lg`}
                                            >
                                                {prayingState === 'sending' ? (
                                                    <ActivityIndicator color="#0F172A" />
                                                ) : (
                                                    <>
                                                        <HeartHandshake size={18} color="#0F172A" className="mr-2" />
                                                        <Text className="text-slate-900 font-bold text-base ml-2">I Prayed for this</Text>
                                                    </>
                                                )}
                                            </Pressable>
                                        </>
                                    )}
                                </LinearGradient>
                            </View>
                        ) : (
                            <View className="flex-row gap-3">
                                <Pressable
                                    onPress={handlePrayForOthers}
                                    disabled={loadingCommunityPrayer}
                                    className="flex-1 p-4 rounded-2xl border active:scale-[0.98]"
                                    style={{ backgroundColor: theme.card }}
                                >
                                    <View className="bg-blue-50 w-8 h-8 rounded-full items-center justify-center mb-3">
                                        {loadingCommunityPrayer ? <ActivityIndicator size="small" color="#2563EB" /> : <HeartHandshake size={16} color="#2563EB" />}
                                    </View>
                                    <Text className="text-sm font-bold mb-0.5" style={{ color: theme.text }}>Pray for Others</Text>
                                    <Text className="text-xs" style={{ color: theme.mutedForeground }}>Lift up the community</Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => router.push('/prayer/new')}
                                    className="flex-1 p-4 rounded-2xl border active:scale-[0.98]"
                                    style={{ backgroundColor: theme.card }}
                                >
                                    <View className="bg-orange-50 w-8 h-8 rounded-full items-center justify-center mb-3">
                                        <Users size={16} color="#EA580C" />
                                    </View>
                                    <Text className="text-sm font-bold mb-0.5" style={{ color: theme.text }}>Ask for Prayer</Text>
                                    <Text className="text-xs" style={{ color: theme.mutedForeground }}>Share a burden</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                ) : (
                    <View className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 mb-10 items-center">
                        <HeartHandshake size={32} color={Colors.gray} />
                        <Text className="font-bold text-lg mt-2 text-slate-900 dark:text-white">Join the Community</Text>
                        <Text className="text-center text-slate-500 mb-4">Sign in to share prayer requests and pray for others.</Text>
                        <Pressable onPress={() => router.push('/login')} className="bg-slate-900 dark:bg-white px-6 py-3 rounded-xl">
                            <Text className="text-white dark:text-black font-bold">Sign In / Create Account</Text>
                        </Pressable>
                    </View>
                )}

                {/* --- 5. CHRISTIAN ADVICE --- */}
                {user && !adviceLimitReached && (
                    <>
                        <View className="mb-10">
                            <View className="flex-row items-end justify-between mb-3 px-1">
                                <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Scriptural Advice</Text>
                                <Pressable onPress={() => router.push('/advice')}>
                                    <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.text }}>View All</Text>
                                </Pressable>
                            </View>

                            <ChristianAdviceCard />
                        </View>
                    </>
                )}

                {/* --- 6. NEWS CARD --- */}
                {dailyNews && (
                    <View className="mb-10">
                        <View className="flex-row items-end justify-between mb-3 px-1">
                            <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Today's News Recap</Text>
                            <Pressable onPress={() => router.push('/news')}>
                                <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.text }}>View All</Text>
                            </Pressable>
                        </View>

                        <Pressable onPress={() => router.push('/news')} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 active:scale-[0.99]" style={{ backgroundColor: theme.card }}>

                            <Text className="text-sm leading-relaxed" style={{ color: theme.mutedForeground }}>
                                {dailyNews.synopsis || "Read today's Christian perspective on world events."}
                            </Text>
                        </Pressable>
                    </View>
                )}

            </ScrollView>

            <View style={{ position: 'absolute', left: -9999, top: 0 }}>
                <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
                    <View style={{ width: 1080, height: 1920, backgroundColor: '#1E293B', padding: 60, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Serif', color: '#D4A373', fontSize: 40, textAlign: 'center', marginBottom: 40 }}>
                            VERSE OF THE DAY
                        </Text>
                        <Text style={{ fontFamily: 'Serif', color: 'white', fontSize: 60, textAlign: 'center', lineHeight: 90, marginBottom: 60 }}>
                            "{todaysDevotional?.scripture || "Loading..."}"
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 30 }}>
                            SANCTUARY
                        </Text>
                    </View>
                </ViewShot>
            </View>
        </SafeAreaView>
    );
}