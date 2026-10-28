import ImprovementCheckInOverlay from '@/components/ImprovementCheckInOverlay';
import { improvementReminderKey, isImprovementCheckInDue, nextImprovementCheckInAt } from '@/lib/improvementCheckIn';
import GeneratingState from '@/components/GeneratingState';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import useReducedMotion from '@/components/useReducedMotion';
import { Layout, Typography } from '@/constants/Layout';
import { useAuth } from '@/context/AuthContext';
import { useRevenueCat } from '@/context/RevenueCatContext';
import {
    deleteDevotional,
    deletePrayer,
    fetchCommunityStats,
    fetchDailyDevotionals,
    fetchDailyNewsSynopsis,
    fetchDailyPrayers,
    fetchGeneralDevotional,
    fetchRandomPrayer,
    fetchRecommendedVideos,
    fetchUserStreak,
    generateContent,
    logUserActivity,
    updateUserProfile,
} from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
    AlertCircle,
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
    ImageBackground,
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
import DailyDiscoveryCard from '@/components/DailyDiscoveryCard';
import { useDiscoveries } from '@/context/DiscoveryContext';
const bg1 = require('@/assets/images/votd-image-1.jpg');
const bg2 = require('@/assets/images/votd-image-2.jpg');
const bg3 = require('@/assets/images/votd-image-3.jpg');
const bg4 = require('@/assets/images/votd-image-4.jpg');
const bg5 = require('@/assets/images/votd-image-5.jpg');
const devotionalHero = require('@/assets/images/daily-devotional-hero.jpg');

const backgrounds = [bg1, bg2, bg3, bg4, bg5];
const todayIndex = new Date().getDate() % backgrounds.length;
const verseBackground = backgrounds[todayIndex];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
    const { refresh: refreshDiscoveries } = useDiscoveries();
    const reducedMotion = useReducedMotion();
    const animateLayout = () => { if (!reducedMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); };
    const { user, profile, refreshProfile, loading: authLoading } = useAuth();
    const { isPro, isLoaded: isRevenueLoaded } = useRevenueCat();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const viewShotRef = useRef<ViewShot>(null);

    // --- STATE ---
    const [dailyScripture, setDailyScripture] = useState<string | null>(null); // NEW: Extracted Scripture
    const [dailyNews, setDailyNews] = useState<any>(null);
    const [todaysDevotional, setTodaysDevotional] = useState<any>(null);
    const [todaysPrayer, setTodaysPrayer] = useState<any>(null);
    const [streak, setStreak] = useState(0);
    const [communityStats, setCommunityStats] = useState({ totalPrayedForYou: 0 });
    const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]);

    // Community Interaction State
    const [communityPrayer, setCommunityPrayer] = useState<any>(null);
    const [prayingState, setPrayingState] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [loadingCommunityPrayer, setLoadingCommunityPrayer] = useState(false);

    // UI & Sync State
    const [refreshing, setRefreshing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [devotionalFailed, setDevotionalFailed] = useState(false);
    
    // REFS FOR RACE CONDITIONS
    const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
    const generationTriggeredRef = useRef(false);

    const userBibleVersion = profile?.preferred_translation || 'NIV';

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

    const [checkInVisible, setCheckInVisible] = useState(false);
    const [checkInSaving, setCheckInSaving] = useState(false);
    const [checkInError, setCheckInError] = useState<string | null>(null);
    const userId = user?.id;
    const checkInAt = profile?.user_preferences?.improvementAreasCheckInAt;

    useEffect(() => {
        let cancelled = false;
        setCheckInVisible(false);
        if (!userId || authLoading) return;
        void AsyncStorage.getItem(improvementReminderKey(userId)).then(localDate => {
            if (!cancelled && isImprovementCheckInDue(checkInAt, localDate)) setCheckInVisible(true);
        }).catch(error => console.warn('Could not read preference reminder:', error));
        return () => { cancelled = true; };
    }, [authLoading, checkInAt, userId]);

    const deferImprovementCheckIn = async () => {
        if (!userId || checkInSaving) return;
        setCheckInSaving(true);
        setCheckInError(null);
        const nextDate = nextImprovementCheckInAt();
        try {
            // Persist locally before closing, so another login cannot re-show it.
            await AsyncStorage.setItem(improvementReminderKey(userId), nextDate);
            setCheckInVisible(false);
            // Mirror the schedule to the profile for reminders on other devices.
            void updateUserProfile(userId, { user_preferences: { ...profile?.user_preferences, improvementAreasCheckInAt: nextDate } }, true)
                .then(() => refreshProfile())
                .catch(error => console.warn('Preference reminder sync deferred:', error));
        } catch {
            setCheckInError('Could not save your reminder. Please try Later again.');
        } finally {
            setCheckInSaving(false);
        }
    };

    const isToday = (dateString: string) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const now = new Date();
        return date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate();
    };

    // --- DATA LOADING ---
    const loadData = useCallback(async (forceRefresh = false) => {
        if (authLoading || (user && !isRevenueLoaded)) {
            return;
        }

        if (!user) {
            const [news, videos, generalData] = await Promise.all([
                fetchDailyNewsSynopsis(),
                Promise.resolve([]),
                fetchGeneralDevotional()
            ]);
            setDailyNews(news);
            setRecommendedVideos(videos);
            if (generalData) {
                // Instantly set scripture for Verse Card
                setDailyScripture(generalData.devotional.scripture);
                setTodaysDevotional(generalData.devotional);
                setTodaysPrayer(generalData.prayer);
            }
            setIsGenerating(false);
            return;
        }
        
        // Fetch ALL core data concurrently, including the general devotional curriculum
        const [news, streakData, stats, videos, generalData] = await Promise.all([
            fetchDailyNewsSynopsis(),
            fetchUserStreak(user.id, 'daily_devotional'),
            fetchCommunityStats(),
            user ? fetchRecommendedVideos() : Promise.resolve([]),
            fetchGeneralDevotional() // <-- We fetch this immediately for everyone now
        ]);
        
        // 1. Immediately set the global Daily Scripture so the top card renders instantly
        if (generalData) {
            setDailyScripture(generalData.devotional.scripture);
        }

        setDailyNews(news);
        setStreak(streakData?.current_streak || streakData?.streak || 0);
        setCommunityStats(stats || { totalPrayedForYou: 0 });
        setRecommendedVideos(videos);

        // 2. Handle Non-Pro Users (Use general devotional)
        if (!isPro) {
            if (generalData) {
                setTodaysDevotional(generalData.devotional);
                setTodaysPrayer(generalData.prayer);
                setIsGenerating(false);
            }
            return;
        }
        
        // 3. Handle Pro Users (Personalized Devotional)
        const [allDevotionals, allPrayers] = await Promise.all([
            fetchDailyDevotionals(user.id),
            fetchDailyPrayers(user.id)
        ]);

        let todayDevo = allDevotionals.find((d: any) => isToday(d.created_at));
        let todayPrayer = allPrayers.find((p: any) => isToday(p.created_at));

        // FAILED STATE: Show General Fallback & allow manual retry.
        if (todayDevo?.status === 'failed' || todayPrayer?.status === 'failed') {
            setDevotionalFailed(true);
            setIsGenerating(false);
            
            if (generalData) {
                setTodaysDevotional(generalData.devotional);
                setTodaysPrayer(generalData.prayer);
            }
            
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            return;
        }

        // SUCCESS STATE
        if (todayDevo?.status === 'completed' && todayPrayer?.status === 'completed') {
            setTodaysDevotional(todayDevo);
            setTodaysPrayer(todayPrayer);
            setIsGenerating(false);
            setDevotionalFailed(false);

            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            return;
        }

        // GENERATION TRIGGER
        if (!todayDevo && !generationTriggeredRef.current) {
            generationTriggeredRef.current = true; 
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
                generationTriggeredRef.current = false; 
            }
        } else if (todayDevo?.status === 'pending' || generationTriggeredRef.current) {
            setIsGenerating(true);
        }

        // POLLING FOR GENERATION
        if (!pollingRef.current && (todayDevo?.status === 'pending' || generationTriggeredRef.current)) {
            pollingRef.current = setInterval(async () => {
                const updatedDevos = await fetchDailyDevotionals(user.id);
                const updatedPrayers = await fetchDailyPrayers(user.id);

                const newDevo = updatedDevos.find((d: any) => isToday(d.created_at));
                const newPrayer = updatedPrayers.find((p: any) => isToday(p.created_at));

                if (newDevo?.status === 'failed' || newPrayer?.status === 'failed') {
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    loadData(); // Re-trigger to fetch fallback
                } else if (newDevo?.status === 'completed' && newPrayer?.status === 'completed') {
                    setTodaysDevotional(newDevo);
                    setTodaysPrayer(newPrayer);
                    setIsGenerating(false);
                    setDevotionalFailed(false);
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
            }, 3000); 
        }

    }, [authLoading, isPro, isRevenueLoaded, profile, user]);

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = async () => {
        void refreshDiscoveries();
        setRefreshing(true);
        if (!reducedMotion) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        await loadData(true);
        setRefreshing(false);
    };

    // --- RETRY PERSONALIZATION ---
    const handleRetryPersonalization = async () => {
        if (!reducedMotion) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        setDevotionalFailed(false);
        setIsGenerating(true);
        generationTriggeredRef.current = true; 
        
        try {
            const allDevotionals = await fetchDailyDevotionals(user?.id);
            const allPrayers = await fetchDailyPrayers(user?.id);
            
            const failedDevo = allDevotionals.find((d: any) => isToday(d.created_at) && d.status === 'failed');
            const failedPrayer = allPrayers.find((p: any) => isToday(p.created_at) && p.status === 'failed');
            
            if (failedDevo) await deleteDevotional(failedDevo.devotional_id || failedDevo.id);
            if (failedPrayer) await deletePrayer(failedPrayer.prayer_id || failedPrayer.id);

            await generateContent('/generate-devotional', {
                userId: user?.id,
                focusAreas: profile?.user_preferences?.focusAreas || [],
                improvementAreas: profile?.user_preferences?.improvementAreas || [],
                recentDevotionals: allDevotionals.slice(0, 10),
            });
            
            loadData();
        } catch (error) {
            console.error("Retry failed", error);
            setDevotionalFailed(true);
            setIsGenerating(false);
            generationTriggeredRef.current = false;
        }
    };

    const handlePrayForOthers = async () => {
        setLoadingCommunityPrayer(true);
        try {
            const prayer = await fetchRandomPrayer(user?.congregation_id);
            if (prayer && !prayer.error) {
                animateLayout();
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

        if (!reducedMotion) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setPrayingState('sending');

        setTimeout(async () => {
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
                animateLayout();
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

    if (authLoading || (user && !isRevenueLoaded)) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['left', 'right']}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={theme.tint} />
                    <Text className="mt-3 text-sm" style={{ color: theme.mutedForeground }}>
                        Loading your Sanctuary...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={{ padding: Layout.gutter, paddingBottom: Layout.bottomPadding }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
                showsVerticalScrollIndicator={false}
            >

                {/* --- HEADER --- */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12, marginBottom: 20, marginTop: 4 }}>
                    <View style={{ flex: 1, minWidth: 210 }}>
                        <Text style={{ ...Typography.metadata, fontFamily: Layout.serif, fontStyle: 'italic', color: theme.mutedForeground, marginBottom: 4 }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>
                        <Text accessibilityRole="header" style={{ ...Typography.editorialTitle, fontFamily: Layout.serif, color: theme.text }}>
                            {`${getGreeting()}, `}
                            <Text className="font-bold">
                                {profile?.first_name?.trim() || user?.user_metadata?.given_name || 'Friend'}.
                            </Text>
                        </Text>
                    </View>

                    {user && streak > 1 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.selection }}>
                            <Flame size={14} color="#F97316" fill="#F97316" />
                            <Text style={{ ...Typography.metadata, fontWeight: '600', color: theme.tint, marginLeft: 4, flexShrink: 1 }}>
                                {streak} Day Streak
                            </Text>
                        </View>
                    )}
                    {/* Show Sign In for Guest */}
                    {!user && (
                        <Pressable onPress={() => router.push('/login')} accessibilityRole="button" style={{ minHeight: Layout.touchTarget, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, backgroundColor: theme.muted }}>
                            <Text style={{ ...Typography.action, color: theme.text }}>Sign in</Text>
                        </Pressable>
                    )}
                </View>

                {/* --- SCRIPTURE OF THE DAY (Renders Instantly) --- */}
                {dailyScripture && (
                    <VerseOfTheDayCard
                        reference={dailyScripture}
                        version={userBibleVersion}
                        backgroundImage={verseBackground}
                    />
                )}

                {/* --- 1. DAILY DEVOTIONAL --- */}
                <View style={{ marginBottom: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <View className="flex-row items-center gap-2">
                        <BookOpen size={16} color={theme.mutedForeground} />
                        <Text accessibilityRole="header" style={{ ...Typography.formLabel, color: theme.text }}>Daily reflection</Text>
                    </View>
                    {todaysDevotional && !isGenerating && (
                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.selection }}>
                            {todaysDevotional.type === 'general' ? <BookOpen size={12} color={theme.tint} /> : <Sparkles size={12} color={theme.tint} />}
                            <Text style={{ ...Typography.metadata, fontWeight: '600', color: theme.tint }}>
                                {todaysDevotional.type === 'general' ? 'General Edition' : 'For You'}
                            </Text>
                        </View>
                    )}
                </View>

                {isGenerating ? (
                    <GeneratingState />
                ) : todaysDevotional ? (
                    <View style={{ borderRadius: Layout.cardRadius, borderWidth: 1, borderColor: theme.border, marginBottom: Layout.sectionGap, overflow: 'hidden', backgroundColor: theme.card }}>
                        <ImageBackground source={devotionalHero} className="h-28 justify-end" resizeMode="cover">
                            <LinearGradient colors={['transparent', 'rgba(10, 14, 12, 0.82)']} className="absolute inset-0" />
                            <View className="p-5 flex-row items-center justify-between">
                                <View className="rounded-full bg-black/35 border border-white/20 px-3 py-1.5">
                                    <Text className="text-xs font-bold uppercase tracking-widest text-white">Today's focus</Text>
                                </View>
                                <Text style={{ ...Typography.metadata, color: 'white', flexShrink: 1 }}>Daily reflection</Text>
                            </View>
                        </ImageBackground>

                        <View style={{ padding: Layout.cardPadding }}>
                            <Text accessibilityRole="header" style={{ ...Typography.editorialTitle, fontFamily: Layout.serif, marginBottom: 8, color: theme.text }}>
                                {todaysDevotional.title}
                            </Text>

                            <Text numberOfLines={3} style={{ ...Typography.helper, marginBottom: 20, color: theme.mutedForeground }}>
                                {todaysDevotional.content?.replace(/<[^>]*>?/gm, '').replace(/[#*`]/g, '').replace(/\\n/g, ' ').trim()}
                            </Text>

                            <Pressable
                                onPress={() => router.push(`/devotional/${todaysDevotional.devotional_id || todaysDevotional.id}`)}
                                style={{ minHeight: Layout.actionHeight, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Layout.controlRadius, backgroundColor: theme.action, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                accessibilityRole="button"
                                accessibilityLabel={`Read today's devotional: ${todaysDevotional.title}`}
                            >
                                <Text style={{ ...Typography.action, color: theme.onAction, textAlign: 'center', flexShrink: 1 }}>Read today’s reflection</Text>
                                <ChevronRight size={18} color={theme.onAction} strokeWidth={2.5} />
                            </Pressable>

                                {/* UPSELL FOR GENERAL */}
                                {todaysDevotional.type === 'general' && !devotionalFailed && (
                                    <Pressable
                                        onPress={() => router.push('/paywall')}
                                        accessibilityRole="button" style={{ marginTop: 16, paddingTop: 16, minHeight: Layout.touchTarget, borderTopWidth: 1, borderColor: theme.border, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                                    >
                                        <Text style={{ ...Typography.metadata, color: theme.mutedForeground, flexShrink: 1 }}>Personalize your daily reflection</Text>
                                        <View className="flex-row items-center gap-1">
                                            <Lock size={12} color={theme.tint} />
                                            <Text style={{ ...Typography.metadata, fontWeight: '700', color: theme.tint }}>Explore Pro</Text>
                                        </View>
                                    </Pressable>
                                )}

                                {/* RETRY PERSONALIZATION OPTION */}
                                {devotionalFailed && (
                                    <Pressable
                                        onPress={handleRetryPersonalization}
                                        className="mt-4 pt-4 border-t border-dashed border-red-200 dark:border-red-900/30 flex-row items-center justify-between"
                                    >
                                        <View className="flex-row items-center gap-2">
                                            <AlertCircle size={14} color="#EF4444" />
                                            <Text className="text-xs text-slate-500 dark:text-slate-400">Personalization failed.</Text>
                                        </View>
                                        <View className="flex-row items-center gap-1 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full">
                                            <Text className="text-xs font-bold text-red-600 dark:text-red-400">Retry Personalization</Text>
                                        </View>
                                    </Pressable>
                                )}
                        </View>
                    </View>
                ) : (
                    <View style={{ padding: Layout.cardPadding, borderRadius: Layout.cardRadius, marginBottom: Layout.sectionGap, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card }}>
                        <Text accessibilityRole="header" style={{ ...Typography.sectionHeading, color: theme.text, marginBottom: 8 }}>Today’s reflection is unavailable</Text>
                        <Text style={{ ...Typography.helper, color: theme.mutedForeground, marginBottom: 16 }}>You can still read today’s Scripture. Try loading the reflection again.</Text>
                        <Pressable onPress={() => loadData(true)} accessibilityRole="button" style={{ minHeight: Layout.actionHeight, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Layout.controlRadius, backgroundColor: theme.muted, alignSelf: 'flex-start', justifyContent: 'center' }}>
                            <Text style={{ ...Typography.action, color: theme.text }}>Try again</Text>
                        </Pressable>
                    </View>
                )}

                {/* --- 2. GUIDED PRAYER --- */}
                {!isGenerating && todaysPrayer && (
                    <View style={{ marginBottom: Layout.sectionGap }}>
                        <View className="mb-3 flex-row items-center gap-2">
                            <Heart size={16} color={theme.mutedForeground} />
                            <Text accessibilityRole="header" style={{ ...Typography.formLabel, color: theme.text }}>Guided prayer</Text>
                        </View>
                        <Pressable
                            onPress={() => router.push(`/prayer/${todaysPrayer.prayer_id || todaysPrayer.id}`)}
                            accessibilityRole="button" accessibilityLabel="Open today’s prayer"
                            style={{ padding: 16, borderRadius: Layout.cardRadius, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}
                        >
                            <View style={{ height: 48, width: 48, borderRadius: 12, backgroundColor: theme.selection, alignItems: 'center', justifyContent: 'center' }}>
                                <HeartHandshake size={23} color={theme.tint} />
                            </View>
                            <View style={{ flex: 1, minWidth: 140 }}>
                                <Text style={{ ...Typography.formLabel, fontFamily: Layout.serif, color: theme.text }}>Daily prayer</Text>
                                <Text style={{ ...Typography.helper, color: theme.mutedForeground }}>Pause and pray with intention.</Text>
                            </View>
                            <View style={{ paddingVertical: 8 }}>
                                <ChevronRight size={20} color={theme.tint} />
                            </View>
                        </Pressable>
                    </View>
                )}

                {/* Personal guidance stays directly below today's prayer. */}
                {user && (
                    <View style={{ marginBottom: Layout.sectionGap }}>
                        <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Sparkles size={16} color={theme.mutedForeground} accessible={false} />
                            <Text accessibilityRole="header" style={{ ...Typography.formLabel, color: theme.text, flex: 1 }}>Personal guidance</Text>
                        </View>
                        <View style={{ padding: Layout.cardPadding, borderRadius: Layout.cardRadius, backgroundColor: theme.readingSurface, borderWidth: 1, borderColor: theme.tint, gap: 12 }}>
                            <Text accessibilityRole="header" style={{ ...Typography.editorialTitle, fontFamily: Layout.serif, color: theme.text }}>What’s on your heart?</Text>
                            <Text style={{ ...Typography.helper, color: theme.text }}>Find practical next steps, Scripture, and a prayer for what you’re facing.</Text>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Start personal guidance"
                                accessibilityHint="Opens Guidance with the question field ready to type."
                                onPress={() => router.navigate({ pathname: '/(tabs)/advice', params: { compose: String(Date.now()) } })}
                                className="active:opacity-85"
                                style={{ minHeight: Layout.actionHeight, borderRadius: Layout.controlRadius, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.action, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                            >
                                <Text style={{ ...Typography.action, color: theme.onAction, flexShrink: 1, textAlign: 'center' }}>Start personal guidance</Text>
                                <ChevronRight size={20} color={theme.onAction} accessible={false} />
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* --- RECOMMENDED VIDEOS --- */}
                <DailyDiscoveryCard />
                {recommendedVideos.length > 0 && (
                    <View style={{ marginBottom: Layout.sectionGap }}>
                        <Text accessibilityRole="header" style={{ ...Typography.formLabel, color: theme.text, marginBottom: 12 }}>
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
                                                    <Text className="text-xs text-orange-700 dark:text-orange-300 font-bold">{tag}</Text>
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
                            <Text className="font-bold">
                                {communityStats.totalPrayedForYou} {communityStats.totalPrayedForYou === 1 ? 'person' : 'people'}
                            </Text> in your community have prayed for you this week.
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
                                    <Pressable onPress={() => { animateLayout(); setCommunityPrayer(null); }} className="p-2 bg-white/10 rounded-full">
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
                                                    <Text className="text-white/90 text-xs font-bold uppercase">
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
                                    style={{ backgroundColor: theme.card, borderColor: theme.border }}
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
                                    style={{ backgroundColor: theme.card, borderColor: theme.border }}
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
                    <Pressable onPress={() => router.push('/login')} accessibilityRole="button" style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, marginBottom: 28, borderRadius: 16, backgroundColor: theme.muted }}>
                        <HeartHandshake size={24} color={theme.tint} />
                        <View style={{ flex: 1 }}><Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>Pray together</Text><Text style={{ fontSize: 14, lineHeight: 21, color: theme.mutedForeground }}>Sign in to join the community.</Text></View>
                        <ChevronRight size={20} color={theme.tint} />
                    </Pressable>
                )}

                {/* --- 6. NEWS CARD --- */}
                {dailyNews && (
                    <View className="mb-10">
                        <View className="flex-row items-end justify-between mb-3 px-1">
                            <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Today's News Recap</Text>
                            <Pressable onPress={() => router.push('/news')}>
                                <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.text }}>View All</Text>
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

            <ImprovementCheckInOverlay visible={checkInVisible} saving={checkInSaving} error={checkInError} theme={theme}
                onLater={() => { void deferImprovementCheckIn(); }}
                onUpdate={() => { setCheckInVisible(false); router.push('/profile'); }} />

            {/* ViewShot for sharing verse - hidden from layout */}
            <View style={{ position: 'absolute', left: -9999, top: 0 }}>
                <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
                    <View style={{ width: 1080, height: 1920, backgroundColor: '#1E293B', padding: 60, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Serif', color: '#D4A373', fontSize: 40, textAlign: 'center', marginBottom: 40 }}>
                            VERSE OF THE DAY
                        </Text>
                        <Text style={{ fontFamily: 'Serif', color: 'white', fontSize: 60, textAlign: 'center', lineHeight: 90, marginBottom: 60 }}>
                            "{dailyScripture || "Loading..."}"
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
