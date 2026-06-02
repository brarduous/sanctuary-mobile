import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
    fetchAppOptions,
    fetchCategories,
    fetchFavorites,
    fetchUserFollowedCategories,
    fetchUserProfile,
    fetchVideoPreferences,
    fetchYoutubeChannels,
    leaveCongregation,
    searchSpotifyArtists,
    SpotifyArtist,
    updateUserFollowedCategories,
    updateUserProfile
} from '@/lib/api';
import { Stack, useRouter } from 'expo-router';
import {
    AlertTriangle,
    Ban,
    Check,
    ChevronRight,
    Church,
    Crown,
    Heart,
    LogIn,
    LogOut,
    Moon,
    Newspaper,
    QrCode,
    Save,
    Search,
    Star,
    Sun,
    Target,
    Trash2,
    TrendingUp,
    User,
    Video
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    LayoutAnimation,
    TextInput,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

function SettingsSection({ children, separated = true }: { children: React.ReactNode; separated?: boolean }) {
    return (
        <View className={separated ? 'pt-8 border-t border-slate-200 dark:border-slate-800' : ''}>
            {children}
        </View>
    );
}

export default function ProfileScreen() {
    const { user, profile: authProfile, signOut, refreshProfile, userCongregationId, setUserCongregationId } = useAuth();
    const [isLeavingChurch, setIsLeavingChurch] = useState(false);
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    // --- STATE ---
    const [activeSection, setActiveSection] = useState<'library' | 'settings'>('settings');
    const [favorites, setFavorites] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(authProfile || null);

    // Options
    const [focusOptions, setFocusOptions] = useState<string[]>([]);
    const [improveOptions, setImproveOptions] = useState<any[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
    const [youtubeChannels, setYoutubeChannels] = useState<any[]>([]);

    // User Selections
    const [focusAreas, setFocusAreas] = useState<string[]>([]);
    const [improvementAreas, setImprovementAreas] = useState<string[]>([]);
    const [otherImprovement, setOtherImprovement] = useState('');
    const [followedCategoryIds, setFollowedCategoryIds] = useState<number[]>([]);
    const [preferredChannelIds, setPreferredChannelIds] = useState<string[]>([]);
    const [blockedChannelIds, setBlockedChannelIds] = useState<string[]>([]);
    const [blockedSpeakers, setBlockedSpeakers] = useState<string[]>([]);
    const [preferredSpeakers, setPreferredSpeakers] = useState<string[]>([]);
    const [channelSearch, setChannelSearch] = useState('');
    const [channelFilter, setChannelFilter] = useState<'discover' | 'preferred' | 'blocked'>('discover');
    const [newsInterestSearch, setNewsInterestSearch] = useState('');
    const [favoriteArtists, setFavoriteArtists] = useState<SpotifyArtist[]>([]);
    const [artistSearch, setArtistSearch] = useState('');
    const [artistResults, setArtistResults] = useState<SpotifyArtist[]>([]);
    const [artistSearching, setArtistSearching] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);


    const handleLeaveChurch = () => {
        Alert.alert(
            "Leave Congregation",
            "Are you sure you want to disconnect from this church? You will no longer receive their updates or see their community prayer requests.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Leave Church",
                    style: "destructive",
                    onPress: async () => {
                        setIsLeavingChurch(true);
                        try {
                            await leaveCongregation();
                            // Instantly update local state so the app UI changes immediately
                            setUserCongregationId(null);
                            Alert.alert("Success", "You have left the congregation.");
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to leave the church.");
                        } finally {
                            setIsLeavingChurch(false);
                        }
                    }
                }
            ]
        );
    };

    // Initial Load
    useEffect(() => {
        async function init() {
            if (!user?.id) {
                setLoading(false);
                return;
            }
            try {
                const [userProfile, appOptions, cats, userCats, videoPrefs, channels] = await Promise.all([
                    fetchUserProfile(user.id).catch(e => { console.error('Profile fetch error:', e); return null; }),
                    fetchAppOptions().catch(e => { console.error('App options error:', e); return null; }),
                    fetchCategories().catch(e => { console.error('Categories error:', e); return []; }),
                    fetchUserFollowedCategories(user.id).catch(e => { console.error('User cats error:', e); return []; }),
                    fetchVideoPreferences().catch(e => { console.error('Video preferences error:', e); return null; }),
                    fetchYoutubeChannels({ limit: 200 }).catch(e => { console.error('YouTube channels error:', e); return []; })
                ]);

                let loadedImproveOptions: any[] = [];

                if (appOptions && Array.isArray(appOptions)) {
                    const focusOpt = appOptions.find((o: any) => o.name === 'focus_areas');
                    const improveOpt = appOptions.find((o: any) => o.name === 'improvement_areas');

                    if (focusOpt?.options && Array.isArray(focusOpt.options)) {
                        setFocusOptions(focusOpt.options.map((x: any) => x.title).filter(Boolean));
                    }
                    if (improveOpt?.options && Array.isArray(improveOpt.options)) {
                        loadedImproveOptions = improveOpt.options.filter((x: any) => x?.title);
                        setImproveOptions(loadedImproveOptions);
                    }
                }

                if (cats && Array.isArray(cats)) {
                    setCategoryOptions(cats);
                }

                if (userCats && Array.isArray(userCats)) {
                    setFollowedCategoryIds(userCats.map((uc: any) => Number(uc.id || uc)).filter(id => !isNaN(id)));
                }

                if (videoPrefs) {
                    setPreferredChannelIds(Array.isArray(videoPrefs.preferredChannelIds) ? videoPrefs.preferredChannelIds : []);
                    setBlockedChannelIds(Array.isArray(videoPrefs.blockedChannelIds) ? videoPrefs.blockedChannelIds : []);
                    setBlockedSpeakers(Array.isArray(videoPrefs.blockedSpeakers) ? videoPrefs.blockedSpeakers : []);
                    setPreferredSpeakers(Array.isArray(videoPrefs.preferredSpeakers) ? videoPrefs.preferredSpeakers : []);
                }

                if (channels && Array.isArray(channels)) {
                    setYoutubeChannels(channels);
                }

                if (userProfile) {
                    setProfile(userProfile);
                    if (userProfile.user_preferences) {
                        setFocusAreas(Array.isArray(userProfile.user_preferences.focusAreas) ? userProfile.user_preferences.focusAreas : []);
                        const savedImprovementAreas = Array.isArray(userProfile.user_preferences.improvementAreas) ? userProfile.user_preferences.improvementAreas : [];
                        setImprovementAreas(normalizeSavedImprovementAreas(savedImprovementAreas, loadedImproveOptions));
                        const savedOther = savedImprovementAreas.find((item: string) => item.startsWith('Other: '));
                        setOtherImprovement(savedOther ? savedOther.replace(/^Other:\s*/, '') : '');
                        setFavoriteArtists(Array.isArray(userProfile.user_preferences.musicPreferences?.favoriteGospelArtists)
                            ? userProfile.user_preferences.musicPreferences.favoriteGospelArtists
                            : []);
                    }
                }
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [user]);

    // Fetch Favorites
    useEffect(() => {
        if (activeSection === 'library' && user?.id) {
            fetchFavorites(user.id).then(setFavorites).catch(err => {
                console.error('Error fetching favorites:', err);
                setFavorites([]);
            });
        }
    }, [activeSection, user]);

    useEffect(() => {
        const handle = setTimeout(async () => {
            if (!artistSearch.trim()) {
                setArtistResults([]);
                return;
            }

            setArtistSearching(true);
            const results = await searchSpotifyArtists(`${artistSearch} gospel christian`);
            setArtistResults(results);
            setArtistSearching(false);
        }, 350);

        return () => clearTimeout(handle);
    }, [artistSearch]);

    // Handlers
    const toggleString = (list: string[], item: string, setFn: any) => {
        if (!Array.isArray(list) || !item) return;
        setFn(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const getImprovementValue = (category: string, subIssue?: string) => (
        subIssue ? `${category}: ${subIssue}` : category
    );

    const normalizeSavedImprovementAreas = (savedAreas: string[], options: any[]) => {
        const validValues = new Set<string>();
        const legacyMap = new Map<string, string>();

        options.forEach((option) => {
            const subIssues = Array.isArray(option.subIssues) ? option.subIssues : [];
            if (option.title === 'Other') return;

            if (subIssues.length === 0) {
                validValues.add(option.title);
                legacyMap.set(option.title, option.title);
                return;
            }

            subIssues.forEach((subIssue: string) => {
                const value = getImprovementValue(option.title, subIssue);
                validValues.add(value);
                legacyMap.set(subIssue, value);
            });
        });

        const legacyFallbacks: Record<string, string> = {
            Anxiety: 'Mental Health: Anxiety',
            Depression: 'Mental Health: Emotional exhaustion',
            Stress: 'Mental Health: Emotional exhaustion',
            Loneliness: 'Mental Health: Loneliness',
            Anger: 'Habitual Sin & Guilt: Anger and self-control',
            Temptation: 'Habitual Sin & Guilt: Repeated sin patterns',
            'Guilt & Shame': 'Habitual Sin & Guilt: Receiving grace after failure',
            'Self-Control': 'Habitual Sin & Guilt: Anger and self-control',
            Laziness: 'Daily Discipline: Building consistent habits',
            Doubt: 'Apologetics & Doubt: Is it a sin to doubt?',
            Forgiveness: 'Church & Culture: Forgiveness and trust',
        };

        return Array.from(new Set(
            savedAreas.flatMap((area) => {
                if (!area || area.startsWith('Other: ')) return [];
                if (validValues.has(area)) return [area];
                const mapped = legacyMap.get(area) || legacyFallbacks[area];
                return mapped && validValues.has(mapped) ? [mapped] : [];
            })
        ));
    };

    const getNextImprovementCheckInAt = () => {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 30);
        return nextDate.toISOString();
    };

    const toggleId = (list: number[], item: number, setFn: any) => {
        if (!Array.isArray(list) || typeof item !== 'number' || isNaN(item)) return;
        setFn(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const setChannelPreference = (channelId: string, preference: 'preferred' | 'blocked' | 'neutral') => {
        if (!channelId) return;

        setPreferredChannelIds((current) => {
            const withoutChannel = current.filter(id => id !== channelId);
            return preference === 'preferred' ? [...withoutChannel, channelId] : withoutChannel;
        });

        setBlockedChannelIds((current) => {
            const withoutChannel = current.filter(id => id !== channelId);
            return preference === 'blocked' ? [...withoutChannel, channelId] : withoutChannel;
        });
    };

    const toggleFavoriteArtist = (artist: SpotifyArtist) => {
        setFavoriteArtists((current) => {
            if (current.some((item) => item.id === artist.id || item.name === artist.name)) {
                return current.filter((item) => item.id !== artist.id && item.name !== artist.name);
            }
            return [...current, artist].slice(0, 5);
        });
    };

    const filteredYoutubeChannels = youtubeChannels.filter((channel) => {
        const channelId = String(channel.channel_id || '');
        const name = String(channel.channel_name || '');
        const handle = String(channel.handle || '');
        const matchesSearch = !channelSearch.trim()
            || name.toLowerCase().includes(channelSearch.trim().toLowerCase())
            || handle.toLowerCase().includes(channelSearch.trim().toLowerCase());

        if (!matchesSearch) return false;
        if (channelFilter === 'preferred') return preferredChannelIds.includes(channelId);
        if (channelFilter === 'blocked') return blockedChannelIds.includes(channelId);
        return true;
    });

    const visibleNewsInterests = useMemo(() => {
        const selectedIds = new Set(followedCategoryIds.map((id) => Number(id)));
        const selected = categoryOptions.filter((cat) => selectedIds.has(Number(cat.id)));
        const unselected = categoryOptions.filter((cat) => !selectedIds.has(Number(cat.id)));
        const query = newsInterestSearch.trim().toLowerCase();

        if (query) {
            const matches = unselected
                .filter((cat) => String(cat.name || '').toLowerCase().includes(query))
                .slice(0, 12);
            return [...selected, ...matches];
        }

        return [...selected, ...unselected.slice(0, 6)];
    }, [categoryOptions, followedCategoryIds, newsInterestSearch]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const userPreferences = {
                ...(profile?.user_preferences || {}),
                focusAreas,
                improvementAreas: [
                    ...improvementAreas,
                    ...(otherImprovement.trim() ? [`Other: ${otherImprovement.trim()}`] : [])
                ],
                improvementAreasUpdatedAt: new Date().toISOString(),
                improvementAreasCheckInAt: getNextImprovementCheckInAt(),
                onboardingCompleted: true,
                videoPreferences: {
                    preferredChannelIds,
                    blockedChannelIds,
                    blockedSpeakers,
                    preferredSpeakers
                },
                musicPreferences: {
                    favoriteGospelArtists: favoriteArtists
                }
            };

            await Promise.all([
                updateUserProfile(user.id, {
                    user_preferences: userPreferences
                }),
                updateUserFollowedCategories(user.id, followedCategoryIds)
            ]);
            setProfile((current: any) => current ? { ...current, user_preferences: userPreferences } : current);
            await refreshProfile?.();
            Alert.alert("Success", "Preferences updated successfully.");
        } catch (error) {
            Alert.alert("Error", "Failed to save preferences.");
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert("Sign Out", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign Out", style: "destructive", onPress: () => {
                    try {
                        signOut();
                    } catch (error) {
                        console.error('Sign out error:', error);
                    }
                }
            }
        ]);
    };

    const handleItemPress = (item: any) => {
        try {
            let path = '';
            if (item.item_type === 'devotional') path = `/devotional/${item.item_id}`;
            else if (item.item_type === 'prayer') path = `/prayer/${item.item_id}`;
            else if (item.item_type === 'advice') path = `/advice/${item.item_id}`;
            else if (item.item_type === 'news') path = `/news/${item.item_id}`;

            if (path) {
                router.push(path as any);
            }
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
                <ActivityIndicator color="#D4A373" />
            </View>
        );
    }

    // --- GUEST VIEW (If not logged in) ---
    if (!user) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
                <Stack.Screen options={{ title: 'Profile' }} />
                <View className="px-5 pt-4 border-b border-transparent">
                    <Text className="text-2xl font-serif font-bold mb-6" style={{ color: theme.text }}>Profile</Text>
                </View>

                <View className="flex-1 items-center justify-center p-6">
                    <View className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl items-center w-full max-w-sm border border-slate-200 dark:border-slate-800">
                        <View className="w-20 h-20 bg-[#D4A373]/20 rounded-full items-center justify-center mb-6">
                            <User size={40} color="#D4A373" />
                        </View>
                        <Text className="text-xl font-bold mb-2 text-center" style={{ color: theme.text }}>
                            Create Your Profile
                        </Text>
                        <Text className="text-center text-slate-500 mb-8 leading-6">
                            Sign in to save your spiritual preferences, track your favorite devotionals, and customize your daily walk.
                        </Text>

                        <Pressable
                            onPress={() => router.push('/login')}
                            className="w-full bg-[#D4A373] py-4 rounded-xl flex-row items-center justify-center mb-4 active:opacity-90 shadow-sm"
                        >
                            <LogIn size={20} color="white" className="mr-2" />
                            <Text className="text-white font-bold text-lg">Sign In / Sign Up</Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // --- LOGGED IN VIEW ---
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
            {/* Header */}
            <Stack.Screen options={{ title: 'My Sanctuary' }} />
            <View className="px-5 pt-0 pb-2 z-10 border-b " style={{ backgroundColor: 'transparent' }}>
                <View className="flex-row justify-end items-center mb-8">
                    <Pressable onPress={handleSignOut}>
                        <Text className="text-xs font-bold text-red-400 uppercase tracking-widest">Sign Out</Text>
                    </Pressable>
                </View>

                {/* Tab Switcher */}
                <View className="flex-row p-1 bg-slate-100/80 rounded-xl mb-6 mx-4">
                    <Pressable
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setActiveSection('library');
                        }}
                        className={`flex-1 py-2 items-center rounded-lg ${activeSection === 'library' ? 'bg-white' : ''}`}
                        style={activeSection === 'library' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 } : undefined}
                    >
                        <Text className={`text-sm font-bold ${activeSection === 'library' ? '' : 'text-slate-500'}`} style={activeSection === 'library' ? { color: '#2C3E50' } : undefined}>
                            My Library
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setActiveSection('settings');
                        }}
                        className={`flex-1 py-2 items-center rounded-lg ${activeSection === 'settings' ? 'bg-white' : ''}`}
                        style={activeSection === 'settings' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 } : undefined}
                    >
                        <Text className={`text-sm font-bold ${activeSection === 'settings' ? '' : 'text-slate-500'}`} style={activeSection === 'settings' ? { color: '#2C3E50' } : undefined}>
                            Settings
                        </Text>
                    </Pressable>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

                {/* --- LIBRARY TAB --- */}
                {activeSection === 'library' && (
                    <View className="gap-4">
                        {favorites.length === 0 ? (
                            <View className="py-20 items-center opacity-50">
                                <Heart size={48} color="#94A3B8" className="mb-4" />
                                <Text className="font-serif text-slate-500 text-lg">No saved items yet.</Text>
                                <Text className="text-xs text-slate-400 mt-2 text-center px-10">
                                    Tap the heart icon on any devotional or prayer to save it here.
                                </Text>
                            </View>
                        ) : (
                            favorites.map(fav => (
                                <Pressable
                                    key={fav.id}
                                    onPress={() => handleItemPress(fav)}
                                    className="p-4 rounded-xl border  flex-row justify-between items-center"
                                    style={{ backgroundColor: theme.card }}
                                >
                                    <View className="flex-1 pr-4">
                                        <Text className="text-[10px] font-bold uppercase tracking-widest text-[#D4A373] mb-1">
                                            {fav.item_type}
                                        </Text>
                                        <Text className="font-serif font-bold text-base mb-1" numberOfLines={1} style={{ color: theme.text }}>
                                            {fav.title || 'Untitled Item'}
                                        </Text>
                                        <Text className="text-xs" numberOfLines={2} style={{ color: theme.mutedForeground }}>
                                            {fav.preview}
                                        </Text>
                                    </View>
                                    <ChevronRight size={16} color="#CBD5E1" />
                                </Pressable>
                            ))
                        )}
                    </View>
                )}

                {/* --- SETTINGS TAB --- */}
                {activeSection === 'settings' && (
                    <View className="gap-8">
                        {/* User Info */}
                        <SettingsSection separated={false}>
                        <View className="flex-row items-center gap-4 p-4 rounded-2xl border " style={{ backgroundColor: theme.card }}>
                            <View className="w-12 h-12 bg-[#D4A373]/10 rounded-full items-center justify-center">
                                <User size={24} color="#D4A373" />
                            </View>
                            <View>
                                <Text className="font-serif font-bold text-lg" style={{ color: theme.text }}>
                                    {profile?.first_name || 'User'} {profile?.last_name || ''}
                                </Text>
                                <Text className="text-xs" style={{ color: theme.mutedForeground }}>{user?.email || ''}</Text>
                            </View>
                        </View>
                        </SettingsSection>

                        {/* Subscription */}
                        <SettingsSection>
                        <View className="bg-gradient-to-br from-[#D4A373]/20 to-slate-100 border border-[#D4A373]/30 rounded-xl p-5">
                            <View className="flex-row items-center gap-3 mb-2">
                                <View className="p-2 bg-[#D4A373]/20 rounded-full">
                                    <Crown size={20} color="#D4A373" />
                                </View>
                                <View>
                                    <Text className="font-serif font-bold text-lg" style={{ color: theme.text }}>
                                        {profile?.subscription_tier === 'pro' ? 'Sanctuary Pro' : 'Free Plan'}
                                    </Text>
                                    <Text className="text-xs" style={{ color: theme.mutedForeground }}>
                                        {profile?.subscription_tier === 'pro' ? 'Thank you for your support.' : 'Unlock unlimited advice & insights.'}
                                    </Text>
                                </View>
                            </View>
                            {profile?.subscription_tier !== 'pro' && (
                                <View>
                                    <Pressable
                                        onPress={() => {
                                            if (router && router.push) {
                                                router.push('/paywall');
                                            } else {
                                                console.error("Router not available");
                                                Alert.alert("Error", "Navigation not available");
                                            }
                                        }}
                                        className="mt-4 w-full py-3 bg-[#D4A373] rounded-lg items-center active:opacity-90"
                                    >
                                        <Text className="text-white font-bold">Upgrade for $4.99/mo</Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                        </SettingsSection>

                        <SettingsSection>
                        {!userCongregationId ? (
                            <Pressable
                                onPress={() => router.push('/scan')}
                                className="flex-row items-center p-4 bg-white dark:bg-gray-900 rounded-2xl mb-3 border border-indigo-200 dark:border-indigo-900 shadow-sm"
                            >
                                <View className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg mr-4">
                                    <QrCode size={20} color="#4f46e5" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-base dark:text-white">Join a Congregation</Text>
                                    <Text className="text-xs text-slate-500">Scan a QR invite or open your church invite link</Text>
                                </View>
                                <ChevronRight size={20} color="#9ca3af" />
                            </Pressable>
                        ) : (
                            <View className="flex-row items-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl mb-3 border border-emerald-100 dark:border-emerald-900/50">
                                <View className="bg-emerald-100 dark:bg-emerald-800 p-2 rounded-lg mr-4">
                                    <Church size={20} color="#059669" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-emerald-900 dark:text-emerald-100">Connected to Church</Text>
                                    <Text className="text-xs text-emerald-700 dark:text-emerald-300">Check the 'My Church' tab for content.</Text>
                                </View>
                            </View>
                        )}
                        </SettingsSection>

                        {/* App Settings */}
                        <SettingsSection>
                        <View>
                            <Text className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3 ml-1">App Settings</Text>
                            <View className="border  rounded-xl p-4 flex-row justify-between items-center" style={{ backgroundColor: theme.card }}>
                                <View className="flex-row items-center gap-3">
                                    <View className="p-2 bg-slate-100 rounded-full">
                                        {colorScheme === 'dark' ? <Moon size={20} color="#64748B" /> : <Sun size={20} color="#64748B" />}
                                    </View>
                                    <View>
                                        <Text className="font-bold text-sm" style={{ color: theme.text }}>Appearance</Text>
                                        <Text className="text-xs" style={{ color: theme.mutedForeground }}>Uses system setting</Text>
                                    </View>
                                </View>
                                <View className="bg-slate-100 px-3 py-1 rounded-md">
                                    <Text className="text-xs font-bold text-slate-500 capitalize">{colorScheme}</Text>
                                </View>
                            </View>
                        </View>
                        </SettingsSection>

                        {/* Focus Areas */}
                        <SettingsSection>
                        <View>
                            <View className="flex-row items-center gap-2 mb-3 ml-1">
                                <Target size={16} color="#D4A373" />
                                <Text className="text-sm font-bold uppercase tracking-widest text-slate-400">Spiritual Focus</Text>
                            </View>
                            <View className="flex-row flex-wrap gap-2">
                                {(focusOptions || []).map(opt => (
                                    <Pressable
                                        key={opt}
                                        onPress={() => toggleString(focusAreas, opt, setFocusAreas)}
                                        className={`px-4 py-2 rounded-full border ${focusAreas.includes(opt) ? 'bg-slate-900 border-slate-900' : 'border-slate-200'}`}
                                        style={!focusAreas.includes(opt) ? { backgroundColor: theme.card } : undefined}
                                    >
                                        <Text className={`text-xs font-bold ${focusAreas.includes(opt) ? 'text-white' : ''}`} style={!focusAreas.includes(opt) ? { color: theme.text } : undefined}>
                                            {opt}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                        </SettingsSection>

                        {/* Improvement Areas */}
                        <SettingsSection>
                        <View>
                            <View className="flex-row items-center gap-2 mb-3 ml-1">
                                <TrendingUp size={16} color="#D4A373" />
                                <Text className="text-sm font-bold uppercase tracking-widest text-slate-400">Areas for Growth</Text>
                            </View>
                            <View className="gap-3">
                                {(improveOptions || []).map((opt: any) => {
                                    const subIssues = Array.isArray(opt.subIssues) ? opt.subIssues : [];
                                    const isOther = opt.title === 'Other';

                                    if (isOther) {
                                        return (
                                            <View key={opt.title} className="p-4 rounded-xl border border-slate-200" style={{ backgroundColor: theme.card }}>
                                                <Text className="font-bold text-sm mb-1" style={{ color: theme.text }}>{opt.title}</Text>
                                                <Text className="text-xs mb-3" style={{ color: theme.mutedForeground }}>{opt.description}</Text>
                                                <TextInput
                                                    value={otherImprovement}
                                                    onChangeText={setOtherImprovement}
                                                    placeholder="Write a few words"
                                                    placeholderTextColor="#94A3B8"
                                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                                                    style={{ color: theme.text, backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#ffffff' }}
                                                />
                                            </View>
                                        );
                                    }

                                    return (
                                        <View key={opt.title} className="p-4 rounded-xl border border-slate-200" style={{ backgroundColor: theme.card }}>
                                            <Text className="font-bold text-sm mb-1" style={{ color: theme.text }}>{opt.title}</Text>
                                            <Text className="text-xs mb-3" style={{ color: theme.mutedForeground }}>{opt.description}</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {(subIssues.length > 0 ? subIssues : [opt.title]).map((subIssue: string) => {
                                                    const value = getImprovementValue(opt.title, subIssues.length > 0 ? subIssue : undefined);
                                                    const selected = improvementAreas.includes(value);

                                                    return (
                                                        <Pressable
                                                            key={value}
                                                            onPress={() => toggleString(improvementAreas, value, setImprovementAreas)}
                                                            className={`px-4 py-2 rounded-full border ${selected ? 'bg-slate-900 border-slate-900' : 'border-slate-200'}`}
                                                            style={!selected ? { backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#ffffff' } : undefined}
                                                        >
                                                            <Text className={`text-xs font-bold ${selected ? 'text-white' : ''}`} style={!selected ? { color: theme.text } : undefined}>
                                                                {subIssue}
                                                            </Text>
                                                        </Pressable>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                        </SettingsSection>

                        {/* Video Creator Preferences */}
                        <SettingsSection>
                        <View>
                            <View className="flex-row items-center justify-between mb-3 ml-1">
                                <View className="flex-row items-center gap-2">
                                    <Video size={16} color="#D4A373" />
                                    <Text className="text-sm font-bold uppercase tracking-widest text-slate-400">Video Creators</Text>
                                </View>
                                <Text className="text-[10px] font-bold text-slate-400">
                                    {preferredChannelIds.length} yes / {blockedChannelIds.length} no
                                </Text>
                            </View>

                            <View className="flex-row p-1 bg-slate-100/80 rounded-xl mb-3">
                                {[
                                    { key: 'discover', label: 'Discover' },
                                    { key: 'preferred', label: 'Preferred' },
                                    { key: 'blocked', label: 'Blocked' }
                                ].map((item) => (
                                    <Pressable
                                        key={item.key}
                                        onPress={() => setChannelFilter(item.key as 'discover' | 'preferred' | 'blocked')}
                                        className={`flex-1 py-2 items-center rounded-lg ${channelFilter === item.key ? 'bg-white' : ''}`}
                                    >
                                        <Text
                                            className={`text-xs font-bold ${channelFilter === item.key ? 'text-slate-800' : 'text-slate-500'}`}
                                        >
                                            {item.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            <View className="flex-row items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 mb-3" style={{ backgroundColor: theme.card }}>
                                <Search size={16} color="#94A3B8" />
                                <TextInput
                                    value={channelSearch}
                                    onChangeText={setChannelSearch}
                                    placeholder="Search channels"
                                    placeholderTextColor="#94A3B8"
                                    autoCapitalize="none"
                                    className="flex-1 text-sm"
                                    style={{ color: theme.text }}
                                />
                            </View>

                            <View className="gap-3">
                                {filteredYoutubeChannels.slice(0, 12).map((channel) => {
                                    const channelId = String(channel.channel_id || '');
                                    const isPreferred = preferredChannelIds.includes(channelId);
                                    const isBlocked = blockedChannelIds.includes(channelId);

                                    return (
                                        <View
                                            key={channelId}
                                            className={`p-4 rounded-xl border ${isBlocked ? 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30' : isPreferred ? 'border-[#D4A373] bg-[#D4A373]/10' : 'border-slate-200'}`}
                                            style={!isBlocked && !isPreferred ? { backgroundColor: theme.card } : undefined}
                                        >
                                            <View className="flex-row items-start justify-between gap-3">
                                                <View className="flex-1">
                                                    <Text className="font-bold text-sm mb-1" numberOfLines={1} style={{ color: theme.text }}>
                                                        {channel.channel_name || 'YouTube Channel'}
                                                    </Text>
                                                    {!!channel.handle && (
                                                        <Text className="text-xs mb-2" numberOfLines={1} style={{ color: theme.mutedForeground }}>
                                                            {channel.handle}
                                                        </Text>
                                                    )}
                                                </View>

                                                {(isPreferred || isBlocked) && (
                                                    <Pressable
                                                        onPress={() => setChannelPreference(channelId, 'neutral')}
                                                        className="px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200"
                                                    >
                                                        <Text className="text-[10px] font-bold text-slate-500">Reset</Text>
                                                    </Pressable>
                                                )}
                                            </View>

                                            <View className="flex-row gap-2 mt-2">
                                                <Pressable
                                                    onPress={() => setChannelPreference(channelId, isPreferred ? 'neutral' : 'preferred')}
                                                    className={`flex-1 py-2 rounded-lg flex-row items-center justify-center gap-2 ${isPreferred ? 'bg-[#D4A373]' : 'bg-slate-100 dark:bg-slate-800'}`}
                                                >
                                                    <Star size={14} color={isPreferred ? 'white' : '#64748B'} />
                                                    <Text className={`text-xs font-bold ${isPreferred ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        Preferred
                                                    </Text>
                                                </Pressable>

                                                <Pressable
                                                    onPress={() => setChannelPreference(channelId, isBlocked ? 'neutral' : 'blocked')}
                                                    className={`flex-1 py-2 rounded-lg flex-row items-center justify-center gap-2 ${isBlocked ? 'bg-red-500' : 'bg-slate-100 dark:bg-slate-800'}`}
                                                >
                                                    <Ban size={14} color={isBlocked ? 'white' : '#64748B'} />
                                                    <Text className={`text-xs font-bold ${isBlocked ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        Block
                                                    </Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    );
                                })}

                                {filteredYoutubeChannels.length === 0 && (
                                    <View className="py-8 items-center rounded-xl border border-dashed border-slate-200" style={{ backgroundColor: theme.card }}>
                                        <Text className="text-sm font-bold text-slate-500">No channels here yet.</Text>
                                        <Text className="text-xs text-slate-400 mt-1">Try another search or tab.</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        </SettingsSection>

                        {/* Gospel Artist Preferences */}
                        <SettingsSection>
                        <View>
                            <View className="flex-row items-center justify-between mb-3 ml-1">
                                <View className="flex-row items-center gap-2">
                                    <Star size={16} color="#D4A373" />
                                    <Text className="text-sm font-bold uppercase tracking-widest text-slate-400">Gospel Artists</Text>
                                </View>
                                <Text className="text-[10px] font-bold text-slate-400">
                                    {favoriteArtists.length}/5 selected
                                </Text>
                            </View>

                            <View className="flex-row items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 mb-3" style={{ backgroundColor: theme.card }}>
                                <Search size={16} color="#94A3B8" />
                                <TextInput
                                    value={artistSearch}
                                    onChangeText={setArtistSearch}
                                    placeholder="Search gospel artists"
                                    placeholderTextColor="#94A3B8"
                                    autoCapitalize="words"
                                    className="flex-1 text-sm"
                                    style={{ color: theme.text }}
                                />
                                {artistSearching && <ActivityIndicator size="small" color="#D4A373" />}
                            </View>

                            {favoriteArtists.length > 0 && (
                                <View className="flex-row flex-wrap gap-2 mb-3">
                                    {favoriteArtists.map((artist) => (
                                        <Pressable
                                            key={artist.id || artist.name}
                                            onPress={() => toggleFavoriteArtist(artist)}
                                            className="px-3 py-2 rounded-full bg-emerald-50 border border-emerald-200 max-w-full"
                                        >
                                            <Text
                                                className="text-xs font-bold text-emerald-700"
                                                numberOfLines={1}
                                                adjustsFontSizeToFit
                                                minimumFontScale={0.75}
                                            >
                                                {artist.name}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}

                            <View className="gap-2">
                                {artistResults.slice(0, 8).map((artist) => {
                                    const selected = favoriteArtists.some((item) => item.id === artist.id || item.name === artist.name);

                                    return (
                                        <Pressable
                                            key={artist.id || artist.name}
                                            onPress={() => toggleFavoriteArtist(artist)}
                                            className={`p-4 rounded-xl border flex-row items-center justify-between ${selected ? 'bg-emerald-50 border-emerald-300' : 'border-slate-200'}`}
                                            style={!selected ? { backgroundColor: theme.card } : undefined}
                                        >
                                            <Text className="font-bold text-sm flex-1" numberOfLines={1} style={{ color: theme.text }}>
                                                {artist.name}
                                            </Text>
                                            {selected && <Check size={16} color="#059669" />}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                        </SettingsSection>

                        {/* News Interests */}
                        <SettingsSection>
                        <View>
                            <View className="flex-row items-center justify-between mb-3 ml-1">
                                <View className="flex-row items-center gap-2">
                                    <Newspaper size={16} color="#D4A373" />
                                    <Text className="text-sm font-bold uppercase tracking-widest text-slate-400">News Interests</Text>
                                </View>
                                <Text className="text-[10px] font-bold text-slate-400">
                                    {followedCategoryIds.length} selected
                                </Text>
                            </View>

                            <View className="flex-row items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 mb-3" style={{ backgroundColor: theme.card }}>
                                <Search size={16} color="#94A3B8" />
                                <TextInput
                                    value={newsInterestSearch}
                                    onChangeText={setNewsInterestSearch}
                                    placeholder="Search news topics"
                                    placeholderTextColor="#94A3B8"
                                    autoCapitalize="words"
                                    className="flex-1 text-sm"
                                    style={{ color: theme.text }}
                                />
                            </View>

                            <View className="flex-row flex-wrap gap-2">
                                {(visibleNewsInterests || []).map(cat => {
                                    const categoryId = Number(cat.id);
                                    const selected = followedCategoryIds.includes(categoryId);

                                    return (
                                        <Pressable
                                            key={cat.id}
                                            onPress={() => toggleId(followedCategoryIds, categoryId, setFollowedCategoryIds)}
                                            className={`flex-row items-center gap-2 px-4 py-3 rounded-xl border w-[48%] mb-1 ${selected
                                                ? 'bg-[#D4A373]/10 border-[#D4A373] border'
                                                : 'border-slate-200'
                                                }`}
                                            style={!selected ? { backgroundColor: theme.card } : undefined}
                                        >
                                            <Text className={`text-xs font-bold flex-1 ${selected ? 'text-[#D4A373]' : ''
                                                }`} numberOfLines={1} style={!selected ? { color: theme.text } : undefined}>
                                                {cat.name}
                                            </Text>
                                            {selected && <Check size={14} color="#D4A373" />}
                                        </Pressable>
                                    );
                                })}
                            </View>

                            {!newsInterestSearch.trim() && categoryOptions.length > visibleNewsInterests.length && (
                                <Text className="text-xs text-slate-400 mt-3 ml-1">
                                    Showing your selections plus the most active topics. Search to find more.
                                </Text>
                            )}

                            {newsInterestSearch.trim() && visibleNewsInterests.length === followedCategoryIds.length && (
                                <View className="py-6 items-center rounded-xl border border-dashed border-slate-200" style={{ backgroundColor: theme.card }}>
                                    <Text className="text-sm font-bold text-slate-500">No matching topics found.</Text>
                                </View>
                            )}
                        </View>
                        </SettingsSection>

                        {userCongregationId && (
                            <SettingsSection>
                            <View className="mb-8">
                                <Text className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3 px-1">
                                    Danger Zone
                                </Text>
                                <View className="bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-900/30 overflow-hidden shadow-sm">
                                    <TouchableOpacity
                                        onPress={handleLeaveChurch}
                                        disabled={isLeavingChurch}
                                        className="p-4 flex-row items-center justify-between"
                                    >
                                        <View className="flex-row items-center gap-3">
                                            <View className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                                                <AlertTriangle size={20} color="#ef4444" />
                                            </View>
                                            <View>
                                                <Text className="font-bold text-red-600 dark:text-red-400">Leave Congregation</Text>
                                                <Text className="text-xs text-gray-500 dark:text-gray-400">Disconnect from your current church</Text>
                                            </View>
                                        </View>
                                        {isLeavingChurch ? (
                                            <ActivityIndicator size="small" color="#ef4444" />
                                        ) : (
                                            <LogOut size={16} color="#ef4444" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                            </SettingsSection>
                        )}
                        {/* Delete Account */}
                        <SettingsSection>
                        <View>
                            <Text className="text-xs font-bold uppercase tracking-widest text-red-300 mb-4 ml-1">Danger Zone</Text>
                            <Pressable
                                onPress={() => Alert.alert("Delete Account", "Please email support@sanctuaryapp.us to delete your account.")}
                                className="flex-row justify-between items-center p-2"
                            >
                                <Text className="text-red-400 font-bold text-sm">Delete Account</Text>
                                <Trash2 size={16} color="#F87171" />
                            </Pressable>
                        </View>
                        </SettingsSection>

                    </View>
                )}
            </ScrollView>

            {/* Floating Save Button */}
            {activeSection === 'settings' && (
                <View className="absolute bottom-16 right-6">
                    <Pressable
                        onPress={handleSave}
                        disabled={saving}
                        className="w-14 h-14 bg-slate-900 rounded-full items-center justify-center shadow-lg active:bg-slate-800"
                    >
                        {saving ? <ActivityIndicator color="white" /> : <Save size={24} color="white" />}
                    </Pressable>
                </View>
            )}

        </SafeAreaView>
    );
}
