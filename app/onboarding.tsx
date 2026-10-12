import { isSameArtist, toggleArtistPreference } from '@/lib/artistPreferences';
import ArtistPreferenceRow from '@/components/ArtistPreferenceRow';
import { nextImprovementCheckInAt } from '@/lib/improvementCheckIn';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import ScreenState from '@/components/ScreenState';
import { useAuth } from '@/context/AuthContext';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { fetchAppOptions, fetchCategories, searchSpotifyArtists, SpotifyArtist, updatePersonalGrowth, updateUserFollowedCategories, updateUserProfile } from '@/lib/api';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Bell, BellRing, BookOpen, Check, ChevronLeft, ChevronRight, Crown, Info, Megaphone, Search, User } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isPro } = useRevenueCat();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [configAttempt, setConfigAttempt] = useState(0);

  // Profile State
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const lastNameInput = useRef<TextInput>(null);

  // Data State
  const [focusOptions, setFocusOptions] = useState<{ title: string, description: string }[]>([]);
  const [improveOptions, setImproveOptions] = useState<{ title: string, description: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [selectedImprove, setSelectedImprove] = useState<string[]>([]);
  const [otherImprovement, setOtherImprovement] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [favoriteArtists, setFavoriteArtists] = useState<SpotifyArtist[]>([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [artistResults, setArtistResults] = useState<SpotifyArtist[]>([]);
  const [artistSearching, setArtistSearching] = useState(false);
  const [artistSearchError, setArtistSearchError] = useState(false);
  const [artistSearchComplete, setArtistSearchComplete] = useState(false);
  const [artistSearchAttempt, setArtistSearchAttempt] = useState(0);
  
  // Notification State
  const [pushDevotionals, setPushDevotionals] = useState(true);
  const [pushAnnouncements, setPushAnnouncements] = useState(true);
  const [pushStudies, setPushStudies] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  const [modalData, setModalData] = useState<{ title: string, description: string } | null>(null);

  // Step 1: Profile, Step 2: Focus, Step 3: Improve, Step 4: Music, Step 5: Categories, Step 6: Notifications, Step 7: Paywall
  const totalSteps = isPro ? 6 : 7;

  // Extract name from Apple/Google metadata automatically
  useEffect(() => {
    if (user?.user_metadata) {
        const meta = user.user_metadata;
        if (meta.given_name) setFirstName(meta.given_name);
        if (meta.family_name) setLastName(meta.family_name);
        if ((meta.full_name || meta.name) && !meta.given_name) {
            const fullName = meta.full_name || meta.name;
            const parts = fullName.split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
        }
    }
  }, [user]);

  // Load backend options
  useEffect(() => {
    if (authLoading || !user || profile?.user_preferences?.onboardingCompleted) return;
    let active = true;
    setLoadingConfig(true);
    setConfigError(false);
    async function loadData() {
      try {
        const [options, cats] = await Promise.all([fetchAppOptions(true), fetchCategories(true)]);
        if (!active) return;
        const focus = Array.isArray(options) ? options.find((option: any) => option.name === 'focus_areas')?.options : null;
        const improve = Array.isArray(options) ? options.find((option: any) => option.name === 'improvement_areas')?.options : null;
        if (!Array.isArray(focus) || !focus.length || !Array.isArray(improve) || !improve.length || !Array.isArray(cats) || !cats.length) throw new Error('Setup options unavailable');
        setFocusOptions(focus);
        setImproveOptions(improve);
        setCategoryOptions(cats);
      } catch {
        if (active) setConfigError(true);
      } finally {
        if (active) setLoadingConfig(false);
      }
    }
    void loadData();
    return () => { active = false; };
  }, [authLoading, user?.id, profile?.user_preferences?.onboardingCompleted, configAttempt]);

  // Redirect if already completed
  useEffect(() => {
    if (profile?.user_preferences?.onboardingCompleted) {
       router.replace('/(tabs)');
    }
  }, [profile]);

  const handleToggle = (list: any[], setList: any, item: any) => {
    if (list.includes(item)) {
      setList(list.filter((i: any) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const getImprovementValue = (category: string, subIssue?: string) => (
    subIssue ? `${category}: ${subIssue}` : category
  );



  useEffect(() => {
    let active = true;
    setArtistResults([]);
    setArtistSearchError(false);
    setArtistSearchComplete(false);
    setArtistSearching(Boolean(artistSearch.trim()));
    const handle = setTimeout(async () => {
      if (!artistSearch.trim()) return;
      try {
        const results = await searchSpotifyArtists(`${artistSearch} gospel christian`, true);
        if (!Array.isArray(results)) throw new Error('Artist search unavailable');
        if (active) setArtistResults(results);
      } catch {
        if (active) setArtistSearchError(true);
      } finally {
        if (active) { setArtistSearching(false); setArtistSearchComplete(true); }
      }
    }, 350);
    return () => { active = false; clearTimeout(handle); };
  }, [artistSearch, artistSearchAttempt]);

  const toggleFavoriteArtist = (artist: SpotifyArtist) => {
    setFavoriteArtists(current => toggleArtistPreference(current, artist));
  };

  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return null;
      }
      try {
        // NOTE: Make sure your expo project ID is configured in app.json/eas.json
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (e) {
        console.error("Error getting push token", e);
      }
    }
    return token;
  };

  const handleEnableNotifications = async () => {
      setSaving(true);
      const token = await registerForPushNotificationsAsync();
      if (token) setExpoPushToken(token);
      setSaving(false);
      handleNotificationsComplete();
  };

  const handleNotificationsComplete = () => {
      if (isPro) {
        handleFinish();
        return;
      }
      handleNextStep();
  };

  const savePreferences = async () => {
    if (!user) return;
    const improvementAreas = [
      ...selectedImprove,
      ...(otherImprovement.trim() ? [`Other: ${otherImprovement.trim()}`] : []),
    ];

    const userPreferences = {
      ...(profile?.user_preferences || {}),
      improvementAreasUpdatedAt: new Date().toISOString(),
      improvementAreasCheckInAt: nextImprovementCheckInAt(),
      notifications: {
          devotionals: pushDevotionals,
          advice: true,
          news: true,
          announcements: pushAnnouncements,
          bibleStudies: pushStudies
      },
      musicPreferences: {
          favoriteGospelArtists: favoriteArtists
      },
      onboardingCompleted: true
    };

    const updatePayload: any = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      user_preferences: userPreferences
    };

    if (expoPushToken) {
        updatePayload.expo_push_token = expoPushToken;
    }

    const growthPromise = updatePersonalGrowth(user.id, { focusAreas: selectedFocus, improvementAreas });
    const categoriesPromise = updateUserFollowedCategories(user.id, selectedCategories, true);
    await Promise.all([growthPromise, categoriesPromise]);
    await updateUserProfile(user.id, updatePayload, true);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await savePreferences();
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (err) {
      setSaving(false);
      Alert.alert("Error", "Could not save preferences. Please try again.");
    }
  };

  const goToPaywall = async () => {
      if (!user) return;
      setSaving(true);
      try {
        await savePreferences(); 
        await refreshProfile();
        router.replace('/paywall');
      } catch (e) {
        setSaving(false);
        Alert.alert('Could not save setup', 'Please try again before viewing plans.');
      }
  };

  const handleContinueFree = async () => {
      if (!user) return;
      setSaving(true);
      try {
        await savePreferences();
        await refreshProfile();
        router.replace('/(tabs)');
      } catch (err) {
        setSaving(false);
        Alert.alert('Could not save setup', 'Please try again. Your choices are still here.');
      }
  };

  const handleNextStep = () => {
    if (step === 1 && !firstName.trim()) {
        Alert.alert("Name Required", "Please enter your first name to continue.");
        return;
    }
    setStep(s => s + 1);
  };

  if (loadingConfig) {
    return <ScreenState title="Preparing your preferences" loading />;
  }
  if (configError) return <ScreenState title="Preferences unavailable" message="We couldn’t load your setup options. Please try again." onRetry={() => setConfigAttempt(value => value + 1)} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View className="flex-1 px-6">
                {/* Progress Bar */}
                <View accessibilityRole="progressbar" accessibilityLabel="Setup progress" accessibilityValue={{ min: 1, max: totalSteps, now: step, text: `Step ${step} of ${totalSteps}` }} className="flex-row gap-2 mt-4 mb-8">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map(i => (
                        <View 
                            key={i}
                            style={{ 
                                flex: 1, height: 6, borderRadius: 3, 
                                backgroundColor: i <= step ? theme.tint : theme.border
                            }} 
                        />
                    ))}
                </View>

                {step === 1 && <Pressable onPress={handleFinish} disabled={saving || !firstName.trim()} accessibilityRole="button" style={{ paddingVertical: 12, alignItems: 'flex-end', opacity: saving || !firstName.trim() ? 0.4 : 1 }}><Text style={{ color: theme.tint, fontSize: 15 }}>Personalize later</Text></Pressable>}
                {step > 1 && step < 6 && <Text style={{ color: theme.mutedForeground, fontSize: 14, marginBottom: 12 }}>Optional · You can update these preferences in your profile.</Text>}
                <View style={{ flex: 1 }}>
                    
                    {/* STEP 1: WELCOME & NAME */}
                    {step === 1 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
                            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 12 }}>
                            <View className="items-center mb-8">
                                <View className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-full items-center justify-center mb-6">
                                    <User size={32} color={theme.tint} />
                                </View>
                                <Text style={{ color: theme.tint }} className="text-3xl font-serif mb-2 text-center">Welcome</Text>
                                <Text style={{ color: theme.mutedForeground }} className="text-center text-base">Let's get your profile set up.</Text>
                            </View>

                            <View className="space-y-4 mb-8">
                                <View>
                                    <Text style={{ color: theme.text }} className="text-sm font-bold mb-2 ml-1">First name · Required</Text>
                                    <TextInput 
                                        accessibilityLabel="First name, required" autoComplete="given-name" textContentType="givenName" returnKeyType="next" submitBehavior="submit"
                                        onSubmitEditing={() => lastNameInput.current?.focus()}
                                        value={firstName}
                                        onChangeText={setFirstName} 
                                        placeholder="John" 
                                        placeholderTextColor={theme.mutedForeground}
                                        className="w-full p-4 border rounded-2xl text-lg" 
                                        style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }}
                                    />
                                </View>
                                <View>
                                    <Text style={{ color: theme.text }} className="text-sm font-bold mb-2 ml-1 mt-4">Last name · Optional</Text>
                                    <TextInput 
                                        ref={lastNameInput}
                                        accessibilityLabel="Last name" autoComplete="family-name" textContentType="familyName" returnKeyType="done"
                                        onSubmitEditing={() => Keyboard.dismiss()}
                                        value={lastName}
                                        onChangeText={setLastName} 
                                        placeholder="Doe" 
                                        placeholderTextColor={theme.mutedForeground}
                                        className="w-full p-4 border rounded-2xl text-lg" 
                                        style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }}
                                    />
                                </View>
                            </View>

                            </ScrollView>
                        </Animated.View>
                    )}

                    {/* STEP 2: SPIRITUAL FOCUS */}
                    {step === 2 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
                            <Text style={{ color: theme.tint }} className="text-3xl font-serif mb-2 text-center">Spiritual Focus</Text>
                            <Text style={{ color: theme.mutedForeground }} className="text-center mb-6">Where would you like to grow in your walk with God?</Text>
                            <Text style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 16 }}>Choose any that feel relevant.</Text>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={{ gap: 12, paddingBottom: 24 }}>
                                    {focusOptions.map((opt) => (
                                        <View key={opt.title} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 64, borderRadius: 16, borderWidth: 1, borderColor: selectedFocus.includes(opt.title) ? theme.tint : theme.border, backgroundColor: selectedFocus.includes(opt.title) ? theme.accentSoft : theme.card }}>
                                            <Pressable
                                                accessibilityRole="checkbox"
                                                accessibilityLabel={opt.title}
                                                accessibilityState={{ checked: selectedFocus.includes(opt.title) }}
                                                onPress={() => handleToggle(selectedFocus, setSelectedFocus, opt.title)}
                                                onLongPress={() => setModalData(opt)}
                                                delayLongPress={500}
                                                style={{ flex: 1, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}
                                            >
                                                <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 1, borderColor: selectedFocus.includes(opt.title) ? theme.tint : theme.border, backgroundColor: selectedFocus.includes(opt.title) ? theme.tint : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{selectedFocus.includes(opt.title) ? <Check size={16} color={theme.onTint} /> : null}</View>
                                                <Text style={{ fontSize: 16, lineHeight: 24, fontWeight: '600', color: theme.text, flex: 1 }}>{opt.title}</Text>
                                            </Pressable>
                                            <Pressable onPress={() => setModalData(opt)} accessibilityRole="button" accessibilityLabel={`About ${opt.title}`} style={{ minWidth: 48, minHeight: 48, marginRight: 8, alignItems: 'center', justifyContent: 'center' }}><Info size={20} color={theme.mutedForeground} /></Pressable>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        </Animated.View>
                    )}

                    {/* STEP 3: AREAS FOR GROWTH */}
                    {step === 3 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
                            <Text style={{ color: theme.tint }} className="text-3xl font-serif mb-2 text-center">Areas for Growth</Text>
                            <Text style={{ color: theme.mutedForeground }} className="text-center mb-6">What are you hoping to work through right now?</Text>
                            
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View className="gap-4 pb-8">
                                    {improveOptions.map((opt: any) => {
                                        const subIssues = Array.isArray(opt.subIssues) ? opt.subIssues : [];
                                        const isOther = opt.title === 'Other';

                                        if (isOther) {
                                            return (
                                                <View
                                                    key={opt.title}
                                                    style={{
                                                        padding: 16,
                                                        borderRadius: 12,
                                                        borderWidth: 1,
                                                        borderColor: otherImprovement.trim() ? theme.tint : theme.border,
                                                        backgroundColor: theme.card,
                                                    }}
                                                >
                                                    <Text style={{ fontWeight: '700', color: theme.text, marginBottom: 6 }}>{opt.title}</Text>
                                                    <Text style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 21, marginBottom: 12 }}>{opt.description}</Text>
                                                    <TextInput
                                                        accessibilityLabel="Other area for growth"
                                                        value={otherImprovement}
                                                        onChangeText={setOtherImprovement}
                                                        placeholder="Write a few words"
                                                        placeholderTextColor={theme.mutedForeground}
                                                        className="w-full p-3 border rounded-xl text-sm"
                                                        style={{ backgroundColor: theme.background, borderColor: theme.border, color: theme.text, minHeight: 48 }}
                                                    />
                                                </View>
                                            );
                                        }

                                        return (
                                            <View
                                                key={opt.title}
                                                style={{
                                                    padding: 16,
                                                    borderRadius: 12,
                                                    borderWidth: 1,
                                                    borderColor: theme.border,
                                                    backgroundColor: theme.card,
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                    <Text style={{ fontSize: 16, lineHeight: 24, fontWeight: '700', color: theme.text, flex: 1 }}>{opt.title}</Text>
                                                    <Pressable onPress={() => setModalData(opt)} accessibilityRole="button" accessibilityLabel={`About ${opt.title}`} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
                                                        <Info size={20} color={theme.mutedForeground} />
                                                    </Pressable>
                                                </View>
                                                <Text style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 21, marginBottom: 12 }}>{opt.description}</Text>
                                                <View className="flex-row flex-wrap gap-2">
                                                    {(subIssues.length > 0 ? subIssues : [opt.title]).map((subIssue: string) => {
                                                        const value = getImprovementValue(opt.title, subIssues.length > 0 ? subIssue : undefined);
                                                        const selected = selectedImprove.includes(value);

                                                        return (
                                                            <Pressable
                                                                key={value}
                                                                onPress={() => handleToggle(selectedImprove, setSelectedImprove, value)}
                                                                accessibilityRole="checkbox" accessibilityLabel={subIssue} accessibilityState={{ checked: selected }}
                                                                style={{ minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, borderWidth: 1, borderColor: selected ? theme.tint : theme.border, backgroundColor: selected ? theme.tint : theme.card }}
                                                            >
                                                                <Text style={{ fontSize: 14, lineHeight: 21, fontWeight: '600', color: selected ? theme.onTint : theme.text }}>
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
                            </ScrollView>
                        </Animated.View>
                    )}

                    {/* STEP 4: GOSPEL ARTISTS */}
                    {step === 4 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
                            <Text style={{ color: theme.tint }} className="text-3xl font-serif mb-2 text-center">Gospel Artists</Text>
                            <Text style={{ color: theme.mutedForeground }} className="text-center mb-6">Pick a few artists to shape worship track recommendations.</Text>

                            <View className="flex-row items-center gap-2 p-4 rounded-2xl border mb-4" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                                <Search size={18} color={theme.mutedForeground} />
                                <TextInput
                                    accessibilityLabel="Search gospel artists"
                                    returnKeyType="search"
                                    onSubmitEditing={() => Keyboard.dismiss()}
                                    value={artistSearch}
                                    onChangeText={setArtistSearch}
                                    placeholder="Search gospel artists"
                                    placeholderTextColor={theme.mutedForeground}
                                    autoCapitalize="words"
                                    style={{ color: theme.text, flex: 1 }}
                                />
                                {artistSearching && <ActivityIndicator size="small" color={theme.tint} />}
                            </View>

                            {favoriteArtists.length > 0 && (
                                <View className="flex-row flex-wrap gap-2 mb-4">
                                    {favoriteArtists.map((artist) => (
                                        <Pressable
                                            key={artist.id || artist.name}
                                            onPress={() => toggleFavoriteArtist(artist)}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Remove ${artist.name}`}
                                            style={{ minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 22, borderWidth: 1, borderColor: theme.tint, backgroundColor: theme.accentSoft, maxWidth: '100%' }}
                                        >
                                            <Text
                                                style={{ fontSize: 14, lineHeight: 21, fontWeight: '600', color: theme.text }}
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

                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
                                <View className="gap-3 pb-8">
                                    {!artistSearch.trim() && <Text style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 21 }}>Search for an artist you enjoy, or continue to choose later.</Text>}
                                    {artistSearching && <Text accessibilityLiveRegion="polite" style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 21 }}>Searching artists…</Text>}
                                    {artistSearchError && <View style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, gap: 12 }}>
                                        <Text style={{ color: theme.text, fontSize: 16, lineHeight: 24, fontWeight: '600' }}>Artist search is unavailable</Text>
                                        <Text style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 21 }}>Try again, or continue and add artists in your profile later.</Text>
                                        <Pressable accessibilityRole="button" onPress={() => setArtistSearchAttempt(value => value + 1)} style={{ minHeight: 48, borderRadius: 12, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: theme.onTint, fontWeight: '600' }}>Try again</Text></Pressable>
                                    </View>}
                                    {artistSearchComplete && !artistSearchError && !artistResults.length && <Text style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 21 }}>No artists found. Try another name.</Text>}
                                    {artistResults.map((artist) => {
                                        const selected = favoriteArtists.some(item => isSameArtist(item, artist));
                                        return (
                                            <ArtistPreferenceRow
                                                key={artist.id || artist.name}
                                                artist={artist}
                                                selected={selected}
                                                disabled={!selected && favoriteArtists.length >= 5}
                                                onPress={() => toggleFavoriteArtist(artist)}
                                                theme={theme}
                                            />
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </Animated.View>
                    )}

                    {/* STEP 5: CHRISTIAN OUTLOOK */}
                    {step === 5 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
                             <Text style={{ color: theme.tint }} className="text-3xl font-serif mb-2 text-center">Christian Outlook</Text>
                             <Text style={{ color: theme.mutedForeground }} className="text-center mb-6">Which topics in the news matter most to you?</Text>
                             
                             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, marginBottom: 12, minHeight: 48 }}>
                                <Search size={18} color={theme.mutedForeground} />
                                <TextInput accessibilityLabel="Search news topics" value={categorySearch} onChangeText={setCategorySearch} placeholder="Search topics" placeholderTextColor={theme.mutedForeground} returnKeyType="search" onSubmitEditing={() => Keyboard.dismiss()} style={{ flex: 1, color: theme.text, fontSize: 16, paddingVertical: 12 }} />
                             </View>
                             <Text accessibilityLiveRegion="polite" style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 21, marginBottom: 12 }}>{selectedCategories.length ? `${selectedCategories.length} selected · Choose any that interest you` : 'Choose any that interest you'}</Text>
                             <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
                                <View style={{ gap: 12, paddingBottom: 24 }}>
                                    {categoryOptions.filter(cat => cat.name.toLowerCase().includes(categorySearch.trim().toLowerCase())).map((cat) => {
                                        const selected = selectedCategories.includes(cat.id);
                                        return <Pressable key={cat.id} onPress={() => handleToggle(selectedCategories, setSelectedCategories, cat.id)} accessibilityRole="checkbox" accessibilityLabel={cat.name} accessibilityState={{ checked: selected }} style={{ minHeight: 64, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: selected ? theme.tint : theme.border, backgroundColor: selected ? theme.accentSoft : theme.card, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 1, borderColor: selected ? theme.tint : theme.border, backgroundColor: selected ? theme.tint : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{selected ? <Check size={16} color={theme.onTint} /> : null}</View>
                                            <Text style={{ color: theme.text, fontSize: 16, lineHeight: 24, fontWeight: '600', flex: 1 }}>{cat.name}</Text>
                                        </Pressable>;
                                    })}
                                    {!categoryOptions.some(cat => cat.name.toLowerCase().includes(categorySearch.trim().toLowerCase())) && <Text style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 21 }}>No topics found. Try a different word.</Text>}
                                </View>
                             </ScrollView>
                        </Animated.View>
                    )}

                    {/* STEP 6: STAY CONNECTED (NOTIFICATIONS) */}
                    {step === 6 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
                            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}>
                            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ color: theme.tint }} className="text-3xl font-serif mb-2 text-center">Stay Connected</Text>
                                <Text style={{ color: theme.mutedForeground }} className="text-center text-base px-4 leading-relaxed">
                                    Choose your reminders. You can change these in your profile.
                                </Text>
                            </View>

                            <View style={{ backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.border, marginBottom: 16 }}>
                                <NotificationToggle 
                                    icon={<Megaphone size={20} color="#f59e0b" />}
                                    title="Pastoral Announcements" 
                                    description="Updates and service changes from your church."
                                    value={pushAnnouncements} 
                                    onValueChange={setPushAnnouncements} 
                                    theme={theme}
                                />
                                <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 16 }} />
                                <NotificationToggle 
                                    icon={<BookOpen size={20} color="#3b82f6" />}
                                    title="Bible Studies & Events" 
                                    description="New studies and your volunteer schedule."
                                    value={pushStudies} 
                                    onValueChange={setPushStudies} 
                                    theme={theme}
                                />
                                <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 16 }} />
                                <NotificationToggle 
                                    icon={<Bell size={20} color="#8b5cf6" />}
                                    title="Daily Devotional" 
                                    description="A reminder for daily scripture and prayer."
                                    value={pushDevotionals} 
                                    onValueChange={setPushDevotionals} 
                                    theme={theme}
                                />
                            </View>

                            </ScrollView>
                        </Animated.View>
                    )}

                    {/* STEP 7: PAYWALL */}
                    {step === 7 && !isPro && (
                         <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
                            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 12, alignItems: 'center' }}>
                             <View style={{ padding: 12, backgroundColor: theme.accentSoft, borderRadius: 40, marginBottom: 16 }}>
                                <Crown size={32} color={theme.tint} />
                             </View>
                             <Text style={{ color: theme.tint }} className="text-3xl font-serif mb-2 text-center">Unlock Sanctuary Pro</Text>
                             <Text style={{ color: theme.mutedForeground }} className="text-center mb-6">Deepen your spiritual journey with full access.</Text>

                             <View style={{ width: '100%', padding: 20, borderRadius: 16, marginBottom: 20, gap: 12, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }}>
                                <FeatureRow text="Unlimited AI Spiritual Advice" isPro theme={theme} />
                                <FeatureRow text="Personalized Daily Prayers" isPro theme={theme} />
                                <FeatureRow text="In-depth Christian News Analysis" isPro theme={theme} />
                                <FeatureRow text="Advanced Bible Study Tools" isPro theme={theme} />
                             </View>

                             <View className="bg-brand-50 dark:bg-brand-900/10 p-4 rounded-xl border border-brand-100 dark:border-brand-900 w-full mb-4">
                                <Text style={{ color: theme.tint }} className="font-bold text-center">See available plans and pricing</Text>
                                <Text style={{ color: theme.mutedForeground }} className="text-xs text-center">Review subscription terms before purchasing.</Text>
                             </View>

                            </ScrollView>
                        </Animated.View>
                    )}
                </View>

                {/* Footer Buttons */}
                <View style={{ paddingVertical: 16, borderTopWidth: 1, borderColor: theme.border, flexDirection: step === 6 ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                     {step !== 6 && <Pressable
                        accessibilityRole="button"
                        onPress={() => setStep(s => Math.max(1, s - 1))}
                        disabled={step === 1 || step === 6 || saving}
                        style={{ opacity: (step === 1 || step === 6) ? 0 : 1 }} 
                        className="flex-row items-center p-3"
                     >
                        <ChevronLeft size={20} color={theme.mutedForeground} />
                        <Text style={{ color: theme.mutedForeground, fontWeight: '600', marginLeft: 4 }}>Back</Text>
                     </Pressable>}

                     {step < 6 ? (
                        <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving || (step === 1 && !firstName.trim()) }} disabled={saving || (step === 1 && !firstName.trim())} onPress={handleNextStep} style={{ minHeight: 48, backgroundColor: theme.tint, opacity: saving || (step === 1 && !firstName.trim()) ? 0.4 : 1 }} className="flex-row items-center px-6 py-3 rounded-full">
                            <Text style={{ color: theme.onTint }} className="font-bold mr-2">Next</Text>
                            <ChevronRight size={18} color={theme.onTint} />
                        </Pressable>
                     ) : step === 6 ? (
                        <View style={{ width: '100%', gap: 4 }}>
                            <Pressable accessibilityRole="button" onPress={handleEnableNotifications} disabled={saving} style={{ minHeight: 48, backgroundColor: theme.tint, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                                {saving ? <ActivityIndicator color={theme.onTint} /> : <Text style={{ color: theme.onTint, fontSize: 17, fontWeight: '600' }}>Enable Notifications</Text>}
                            </Pressable>
                            <Pressable accessibilityRole="button" onPress={handleNotificationsComplete} disabled={saving} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: theme.mutedForeground, fontSize: 14, fontWeight: '600' }}>Skip for now</Text>
                            </Pressable>
                        </View>
                     ) : (
                         <View className="flex-1">
                             <Pressable accessibilityRole="button" onPress={goToPaywall} disabled={saving} style={{ minHeight: 48, backgroundColor: theme.tint }} className="w-full py-4 rounded-xl items-center justify-center flex-row mb-3">
                                {saving ? <ActivityIndicator color={theme.onTint} /> : <Text style={{ color: theme.onTint }} className="font-bold text-lg">View Sanctuary Pro plans</Text>}
                             </Pressable>
                             <Pressable accessibilityRole="button" onPress={handleContinueFree} disabled={saving} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
                                 <Text style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 21, fontWeight: '600', textAlign: 'center' }}>Continue with Free Plan</Text>
                             </Pressable>
                         </View>
                     )}
                </View>
            </View>
        </KeyboardAvoidingView>

        {/* Modal for Details */}
        <Modal
            visible={!!modalData}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalData(null)}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
                <View style={{ backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, borderRadius: 20, padding: 24, maxHeight: '80%' }}>
                    <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 24, lineHeight: 32, fontWeight: '700', fontFamily: Layout.serif, marginBottom: 16 }}>{modalData?.title}</Text>
                    <ScrollView style={{ flexGrow: 0, flexShrink: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 17, lineHeight: 28 }}>{modalData?.description}</Text>
                    </ScrollView>
                    <Pressable 
                        accessibilityRole="button"
                        accessibilityLabel="Close preference information"
                        onPress={() => setModalData(null)}
                        style={{ marginTop: 24, padding: 12, minHeight: 48, backgroundColor: theme.tint, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={{ color: theme.onTint, fontWeight: '600' }}>Close</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    </SafeAreaView>
  );
}

// Helper Component for the Notification Toggles
function NotificationToggle({ icon, title, description, value, onValueChange, theme }: any) {
    return (
        <View className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center flex-1 pr-4">
                <View className="w-10 h-10 rounded-full bg-white dark:bg-black items-center justify-center mr-4 shadow-sm border border-gray-100 dark:border-gray-800">
                    {icon}
                </View>
                <View className="flex-1">
                    <Text style={{ color: theme.text }} className="font-bold text-base mb-0.5">{title}</Text>
                    <Text style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 21 }}>{description}</Text>
                </View>
            </View>
            <Switch
                accessibilityLabel={title}
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#d1d5db', true: theme.tint }}
                thumbColor={Platform.OS === 'ios' ? '#ffffff' : (value ? '#ffffff' : '#f4f3f4')}
            />
        </View>
    );
}

function FeatureRow({ text, isPro, theme }: { text: string, isPro?: boolean, theme: any }) {
  return (
    <View className="flex-row items-center gap-3">
      <View style={{ padding: 4, borderRadius: 999, backgroundColor: isPro ? '#dcfce7' : '#f3f4f6' }}>
        <Check size={14} color={isPro ? '#15803d' : '#9ca3af'} strokeWidth={3} />
      </View>
      <Text style={{ color: theme.text, fontWeight: '500', fontSize: 16, lineHeight: 24, flex: 1 }}>{text}</Text>
    </View>
  )
}
