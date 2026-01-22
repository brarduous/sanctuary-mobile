import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import {
    fetchAppOptions,
    fetchCategories,
    fetchFavorites,
    fetchUserFollowedCategories,
    fetchUserProfile,
    updateUserFollowedCategories,
    updateUserProfile
} from '@/lib/api';
import { useRouter } from 'expo-router';
import {
    BookMarked,
    Check,
    ChevronRight,
    Crown,
    Heart,
    Moon,
    Newspaper,
    Save,
    Settings,
    Sun,
    Target,
    Trash2,
    TrendingUp,
    User
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Text,
    UIManager,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProfileScreen() {
    const { user, profile: authProfile, signOut } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const hasTheme = colorScheme === 'dark'; // Simplified for now
    
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'library' | 'settings'>('library');
    const [favorites, setFavorites] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(authProfile);
    
    // Options
    const [focusOptions, setFocusOptions] = useState<string[]>([]);
    const [improveOptions, setImproveOptions] = useState<string[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<any[]>([]);

    // User Selections
    const [focusAreas, setFocusAreas] = useState<string[]>([]);
    const [improvementAreas, setImprovementAreas] = useState<string[]>([]);
    const [followedCategoryIds, setFollowedCategoryIds] = useState<number[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Initial Load
    useEffect(() => {
        async function init() {
            if (!user) return;
            try {
                const [userProfile, appOptions, cats, userCats] = await Promise.all([
                    fetchUserProfile(user.id),
                    fetchAppOptions(),
                    fetchCategories(),
                    fetchUserFollowedCategories(user.id)
                ]);

                if (appOptions) {
                    setFocusOptions(appOptions.find((o: any) => o.name === 'focus_areas')?.options?.map((x: any) => x.title) || []);
                    setImproveOptions(appOptions.find((o: any) => o.name === 'improvement_areas')?.options?.map((x: any) => x.title) || []);
                }
                if (cats) setCategoryOptions(cats);
                if (userCats) setFollowedCategoryIds(userCats.map((uc: any) => Number(uc.id || uc))); // Handle if API returns objects or IDs

                if (userProfile) {
                    setProfile(userProfile);
                    if (userProfile.user_preferences) {
                        setFocusAreas(userProfile.user_preferences.focusAreas || []);
                        setImprovementAreas(userProfile.user_preferences.improvementAreas || []);
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
        if (activeTab === 'library' && user) {
            fetchFavorites(user.id).then(setFavorites);
        }
    }, [activeTab, user]);

    // Handlers
    const toggleString = (list: string[], item: string, setFn: any) => {
        setFn(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const toggleId = (list: number[], item: number, setFn: any) => {
        setFn(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await Promise.all([
                updateUserProfile(user.id, {
                    user_preferences: {
                        focusAreas,
                        improvementAreas,
                        onboardingCompleted: true
                    }
                }),
                updateUserFollowedCategories(user.id, followedCategoryIds)
            ]);
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
            { text: "Sign Out", style: "destructive", onPress: () => {
                signOut();
                router.replace('/login');
            }}
        ]);
    };

    const handleItemPress = (item: any) => {
        // Navigate based on item_type
        // web: href={`/${fav.item_type}/${fav.item_id}`}
        // mobile: needs adapting. item_type might be 'devotional', 'prayer'.
        
        let path = '';
        if (item.item_type === 'devotional') path = `/devotional/${item.item_id}`;
        else if (item.item_type === 'prayer') path = `/prayer/${item.item_id}`;
        else if (item.item_type === 'advice') path = `/advice/${item.item_id}`;
        else if (item.item_type === 'news') path = `/news/${item.item_id}`;
        
        if (path) {
            router.push(path as any);
        } else {
             console.warn("Unknown type", item.item_type);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-[#FDFBF7]">
                <ActivityIndicator color="#D4A373" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FDFBF7' }} edges={['top']}>
            {/* Header */}
            <View className="px-5 pt-4 pb-2 bg-[#FDFBF7] z-10 border-b border-slate-100">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-2xl font-serif font-bold text-slate-900">My Sanctuary</Text>
                    <Pressable onPress={handleSignOut}>
                        <Text className="text-xs font-bold text-red-400 uppercase tracking-widest">Sign Out</Text>
                    </Pressable>
                </View>

                {/* Tabs */}
                <View className="flex-row p-1 bg-white border border-slate-200 rounded-xl mb-2">
                    <Pressable 
                        onPress={() => setActiveTab('library')}
                        className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg ${activeTab === 'library' ? 'bg-slate-900 shadow-sm' : ''}`}
                    >
                        <BookMarked size={16} color={activeTab === 'library' ? 'white' : '#64748B'} />
                        <Text className={`text-sm font-bold ${activeTab === 'library' ? 'text-white' : 'text-slate-500'}`}>Library</Text>
                    </Pressable>
                    <Pressable 
                        onPress={() => setActiveTab('settings')}
                        className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg ${activeTab === 'settings' ? 'bg-slate-900 shadow-sm' : ''}`}
                    >
                        <Settings size={16} color={activeTab === 'settings' ? 'white' : '#64748B'} />
                        <Text className={`text-sm font-bold ${activeTab === 'settings' ? 'text-white' : 'text-slate-500'}`}>Settings</Text>
                    </Pressable>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                
                {/* --- LIBRARY TAB --- */}
                {activeTab === 'library' && (
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
                                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex-row justify-between items-center active:bg-slate-50"
                                >
                                    <View className="flex-1 pr-4">
                                        <Text className="text-[10px] font-bold uppercase tracking-widest text-[#D4A373] mb-1">
                                            {fav.item_type}
                                        </Text>
                                        <Text className="font-serif font-bold text-slate-900 text-base mb-1" numberOfLines={1}>
                                            {fav.title || 'Untitled Item'}
                                        </Text>
                                        <Text className="text-xs text-slate-500" numberOfLines={2}>
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
                {activeTab === 'settings' && (
                    <View className="gap-8">
                        {/* User Info */}
                        <View className="flex-row items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <View className="w-12 h-12 bg-[#D4A373]/10 rounded-full items-center justify-center">
                                <User size={24} color="#D4A373" />
                            </View>
                            <View>
                                <Text className="font-serif font-bold text-slate-900 text-lg">
                                    {profile?.first_name} {profile?.last_name || 'User'}
                                </Text>
                                <Text className="text-xs text-slate-500">{user?.email}</Text>
                            </View>
                        </View>

                        {/* Subscription */}
                        <View className="bg-gradient-to-br from-[#D4A373]/20 to-slate-100 border border-[#D4A373]/30 rounded-xl p-5">
                            <View className="flex-row items-center gap-3 mb-2">
                                <View className="p-2 bg-[#D4A373]/20 rounded-full">
                                    <Crown size={20} color="#D4A373" />
                                </View>
                                <View>
                                    <Text className="font-serif font-bold text-slate-900 text-lg">
                                        {profile?.subscription_tier === 'pro' ? 'Sanctuary Pro' : 'Free Plan'}
                                    </Text>
                                    <Text className="text-xs text-slate-500">
                                        {profile?.subscription_tier === 'pro' ? 'Thank you for your support.' : 'Unlock unlimited advice & insights.'}
                                    </Text>
                                </View>
                            </View>
                            {profile?.subscription_tier !== 'pro' && (
                                <Pressable 
                                    onPress={() => router.push('/paywall')}
                                    className="mt-4 w-full py-3 bg-[#D4A373] rounded-lg items-center shadow-sm active:opacity-90"
                                >
                                    <Text className="text-white font-bold">Upgrade for $4.99/mo</Text>
                                </Pressable>
                            )}
                        </View>

                        {/* App Settings */}
                        <View>
                            <Text className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3 ml-1">App Settings</Text>
                            <View className="bg-white border border-slate-100 rounded-xl p-4 flex-row justify-between items-center shadow-sm">
                                <View className="flex-row items-center gap-3">
                                    <View className="p-2 bg-slate-100 rounded-full">
                                        {colorScheme === 'dark' ? <Moon size={20} color="#64748B" /> : <Sun size={20} color="#64748B" />}
                                    </View>
                                    <View>
                                        <Text className="font-bold text-sm text-slate-900">Appearance</Text>
                                        <Text className="text-xs text-slate-500">Uses system setting</Text>
                                    </View>
                                </View>
                                <View className="bg-slate-100 px-3 py-1 rounded-md">
                                    <Text className="text-xs font-bold text-slate-500 capitalize">{colorScheme}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Focus Areas */}
                        <View>
                            <View className="flex-row items-center gap-2 mb-3 ml-1">
                                <Target size={16} color="#D4A373" />
                                <Text className="text-sm font-bold uppercase tracking-widest text-slate-400">Spiritual Focus</Text>
                            </View>
                            <View className="flex-row flex-wrap gap-2">
                                {focusOptions.map(opt => (
                                    <Pressable 
                                        key={opt}
                                        onPress={() => toggleString(focusAreas, opt, setFocusAreas)}
                                        className={`px-4 py-2 rounded-full border ${focusAreas.includes(opt) ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                                    >
                                        <Text className={`text-xs font-bold ${focusAreas.includes(opt) ? 'text-white' : 'text-slate-600'}`}>
                                            {opt}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Improvement Areas */}
                        <View>
                            <View className="flex-row items-center gap-2 mb-3 ml-1">
                                <TrendingUp size={16} color="#D4A373" />
                                <Text className="text-sm font-bold uppercase tracking-widest text-slate-400">Areas for Growth</Text>
                            </View>
                            <View className="flex-row flex-wrap gap-2">
                                {improveOptions.map(opt => (
                                    <Pressable 
                                        key={opt}
                                        onPress={() => toggleString(improvementAreas, opt, setImprovementAreas)}
                                        className={`px-4 py-2 rounded-full border ${improvementAreas.includes(opt) ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                                    >
                                        <Text className={`text-xs font-bold ${improvementAreas.includes(opt) ? 'text-white' : 'text-slate-600'}`}>
                                            {opt}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                         {/* News Interests */}
                         <View>
                            <View className="flex-row items-center gap-2 mb-3 ml-1">
                                <Newspaper size={16} color="#D4A373" />
                                <Text className="text-sm font-bold uppercase tracking-widest text-slate-400">News Interests</Text>
                            </View>
                            <View className="flex-row flex-wrap gap-2">
                                {categoryOptions.map(cat => (
                                    <Pressable 
                                        key={cat.id}
                                        onPress={() => toggleId(followedCategoryIds, cat.id, setFollowedCategoryIds)}
                                        className={`flex-row items-center gap-2 px-4 py-3 rounded-xl border w-[48%] mb-1 ${
                                            followedCategoryIds.includes(cat.id) 
                                            ? 'bg-[#D4A373]/10 border-[#D4A373] border' 
                                            : 'bg-white border-slate-200'
                                        }`}
                                    >
                                        <Text className={`text-xs font-bold flex-1 ${
                                            followedCategoryIds.includes(cat.id) ? 'text-[#D4A373]' : 'text-slate-900'
                                        }`} numberOfLines={1}>
                                            {cat.name}
                                        </Text>
                                        {followedCategoryIds.includes(cat.id) && <Check size={14} color="#D4A373" />}
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Delete Account */}
                        <View className="pt-8 mt-4 border-t border-slate-200">
                             <Text className="text-xs font-bold uppercase tracking-widest text-red-300 mb-4 ml-1">Danger Zone</Text>
                             <Pressable 
                                onPress={() => Alert.alert("Delete Account", "Please email support@sanctuaryapp.us to delete your account.")}
                                className="flex-row justify-between items-center p-2"
                            >
                                <Text className="text-red-400 font-bold text-sm">Delete Account</Text>
                                <Trash2 size={16} color="#F87171" />
                             </Pressable>
                        </View>

                    </View>
                )}
            </ScrollView>

            {/* Floating Save Button */}
            {activeTab === 'settings' && (
                <View className="absolute bottom-6 right-6">
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
