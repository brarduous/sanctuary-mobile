import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { fetchAppOptions, fetchCategories, searchSpotifyArtists, SpotifyArtist, updateUserFollowedCategories, updateUserProfile } from '@/lib/api';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Bell, BellRing, BookOpen, Check, ChevronLeft, ChevronRight, Crown, Info, Megaphone, Music, Search, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isPro } = useRevenueCat();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Profile State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Data State
  const [focusOptions, setFocusOptions] = useState<{ title: string, description: string }[]>([]);
  const [improveOptions, setImproveOptions] = useState<{ title: string, description: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [selectedImprove, setSelectedImprove] = useState<string[]>([]);
  const [otherImprovement, setOtherImprovement] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [favoriteArtists, setFavoriteArtists] = useState<SpotifyArtist[]>([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [artistResults, setArtistResults] = useState<SpotifyArtist[]>([]);
  const [artistSearching, setArtistSearching] = useState(false);
  
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
    async function loadData() {
      try {
        const [options, cats] = await Promise.all([fetchAppOptions(), fetchCategories()]);
        if (options) {
          setFocusOptions(options.find((o: any) => o.name === 'focus_areas')?.options || []);
          setImproveOptions(options.find((o: any) => o.name === 'improvement_areas')?.options || []);
        }
        if (cats) {
          setCategoryOptions(cats.slice(0, 20));
        }
      } catch (e) {
        console.error("Failed to load onboarding data", e);
      } finally {
        setLoadingConfig(false);
      }
    }
    loadData();
  }, []);

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

  const getNextImprovementCheckInAt = () => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);
    return nextDate.toISOString();
  };

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

  const toggleFavoriteArtist = (artist: SpotifyArtist) => {
    setFavoriteArtists((current) => {
      if (current.some((item) => item.id === artist.id || item.name === artist.name)) {
        return current.filter((item) => item.id !== artist.id && item.name !== artist.name);
      }
      return [...current, artist].slice(0, 5);
    });
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
      focusAreas: selectedFocus,
      improvementAreas,
      improvementAreasUpdatedAt: new Date().toISOString(),
      improvementAreasCheckInAt: getNextImprovementCheckInAt(),
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

    const profilePromise = updateUserProfile(user.id, updatePayload);
    const categoriesPromise = updateUserFollowedCategories(user.id, selectedCategories);
    await Promise.all([profilePromise, categoriesPromise]);
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
    return (
        <View className="flex-1 items-center justify-center bg-background">
            <ActivityIndicator size="large" color={theme.tint} />
        </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View className="flex-1 px-6">
                {/* Progress Bar */}
                <View className="flex-row gap-2 mt-4 mb-8">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map(i => (
                        <View 
                            key={i}
                            style={{ 
                                flex: 1, height: 6, borderRadius: 3, 
                                backgroundColor: i <= step ? theme.tint : (colorScheme === 'dark' ? '#333' : '#e5e7eb') 
                            }} 
                        />
                    ))}
                </View>

                <View style={{ flex: 1 }}>
                    
                    {/* STEP 1: WELCOME & NAME */}
                    {step === 1 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1, justifyContent: 'center' }}>
                            <View className="items-center mb-8">
                                <View className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full items-center justify-center mb-6">
                                    <User size={32} color={theme.tint} />
                                </View>
                                <Text style={{ color: theme.tint }} className="text-3xl font-serif mb-2 text-center">Welcome</Text>
                                <Text style={{ color: Colors.gray }} className="text-center text-base">Let's get your profile set up.</Text>
                            </View>

                            <View className="space-y-4 mb-8">
                                <View>
                                    <Text style={{ color: theme.text }} className="text-sm font-bold mb-2 ml-1">First Name</Text>
                                    <TextInput 
                                        value={firstName} 
                                        onChangeText={setFirstName} 
                                        placeholder="John" 
                                        placeholderTextColor={theme.text === '#FFFFFF' ? '#475569' : '#CBD5E1'} 
                                        className="w-full p-4 border rounded-2xl text-lg" 
                                        style={{ backgroundColor: theme.card, borderColor: colorScheme === 'dark' ? '#333' : '#e5e7eb', color: theme.text }} 
                                    />
                                </View>
                                <View>
                                    <Text style={{ color: theme.text }} className="text-sm font-bold mb-2 ml-1 mt-4">Last Name</Text>
                                    <TextInput 
                                        value={lastName} 
                                        onChangeText={setLastName} 
                                        placeholder="Doe" 
                                        placeholderTextColor={theme.text === '#FFFFFF' ? '#475569' : '#CBD5E1'} 
                                        className="w-full p-4 border rounded-2xl text-lg" 
                                        style={{ backgroundColor: theme.card, borderColor: colorScheme === 'dark' ? '#333' : '#e5e7eb', color: theme.text }} 
                                    />
                                </View>
                            </View>
                        </Animated.View>
                    )}

                    {/* STEP 2: SPIRITUAL FOCUS */}
                    {step === 2 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
                            <Text style={{ color: theme.tint }} className="text-3xl font-serif mb-2 text-center">Spiritual Focus</Text>
                            <Text style={{ color: Colors.gray }} className="text-center mb-6">Where would you like to grow in your walk with God?</Text>
                            <Text style={{ color: Colors.gray }} className="text-center mb-4 text-xs italic">Long press for more information</Text>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View className="flex-row flex-wrap gap-3 pb-8">
                                    {focusOptions.map((opt) => (
                                        <View key={opt.title} style={{ width: '48%' }}> 
                                            <Pressable
                                                onPress={() => handleToggle(selectedFocus, setSelectedFocus, opt.title)}
                                                onLongPress={() => setModalData(opt)}
                                                delayLongPress={500}
                                                style={{
                                                    padding: 16,
                                                    borderRadius: 12,
                                                    borderWidth: 1,
                                                    borderColor: selectedFocus.includes(opt.title) ? theme.tint : (colorScheme === 'dark' ? '#333' : '#e5e7eb'),
                                                    backgroundColor: selectedFocus.includes(opt.title) ? (colorScheme === 'dark' ? '#112244' : '#eff6ff') : theme.card,
                                                }}
                                            >
                                                <View className="flex-row justify-between items-start mb-2">
                                                     <Text style={{ fontWeight: '600', color: theme.text, flex: 1 }}>{opt.title}</Text>
                                                     {selectedFocus.includes(opt.title) && <Check size={16} color={theme.tint} />}
                                                </View>
                                                <View className="opacity-50">
                                                    <Info size={14} color={Colors.gray} />
                                                </View>
                                            </Pressable>
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
                            <Text style={{ color: Colors.gray }} className="text-center mb-6">What are you hoping to work through right now?</Text>
                            
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
                                                        borderColor: otherImprovement.trim() ? theme.tint : (colorScheme === 'dark' ? '#333' : '#e5e7eb'),
                                                        backgroundColor: theme.card,
                                                    }}
                                                >
                                                    <Text style={{ fontWeight: '700', color: theme.text, marginBottom: 6 }}>{opt.title}</Text>
                                                    <Text style={{ color: Colors.gray, fontSize: 12, lineHeight: 16, marginBottom: 12 }}>{opt.description}</Text>
                                                    <TextInput
                                                        value={otherImprovement}
                                                        onChangeText={setOtherImprovement}
                                                        placeholder="Write a few words"
                                                        placeholderTextColor={theme.text === '#FFFFFF' ? '#475569' : '#CBD5E1'}
                                                        className="w-full p-3 border rounded-xl text-sm"
                                                        style={{ backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#ffffff', borderColor: colorScheme === 'dark' ? '#333' : '#e5e7eb', color: theme.text }}
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
                                                    borderColor: (colorScheme === 'dark' ? '#333' : '#e5e7eb'),
                                                    backgroundColor: theme.card,
                                                }}
                                            >
                                                <View className="flex-row justify-between items-start mb-2">
                                                    <Text style={{ fontWeight: '700', color: theme.text, flex: 1 }}>{opt.title}</Text>
                                                    <Pressable onPress={() => setModalData(opt)} className="opacity-50">
                                                        <Info size={14} color={Colors.gray} />
                                                    </Pressable>
                                                </View>
                                                <Text style={{ color: Colors.gray, fontSize: 12, lineHeight: 16, marginBottom: 12 }}>{opt.description}</Text>
                                                <View className="flex-row flex-wrap gap-2">
                                                    {(subIssues.length > 0 ? subIssues : [opt.title]).map((subIssue: string) => {
                                                        const value = getImprovementValue(opt.title, subIssues.length > 0 ? subIssue : undefined);
                                                        const selected = selectedImprove.includes(value);

                                                        return (
                                                            <Pressable
                                                                key={value}
                                                                onPress={() => handleToggle(selectedImprove, setSelectedImprove, value)}
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
                            </ScrollView>
                        </Animated.View>
                    )}

                    {/* STEP 4: GOSPEL ARTISTS */}
                    {step === 4 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
                            <Text style={{ color: theme.tint }} className="text-3xl font-serif mb-2 text-center">Gospel Artists</Text>
                            <Text style={{ color: Colors.gray }} className="text-center mb-6">Pick a few artists to shape worship track recommendations.</Text>

                            <View className="flex-row items-center gap-2 p-4 rounded-2xl border mb-4" style={{ backgroundColor: theme.card, borderColor: colorScheme === 'dark' ? '#333' : '#e5e7eb' }}>
                                <Search size={18} color={Colors.gray} />
                                <TextInput
                                    value={artistSearch}
                                    onChangeText={setArtistSearch}
                                    placeholder="Search gospel artists"
                                    placeholderTextColor={theme.text === '#FFFFFF' ? '#475569' : '#CBD5E1'}
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

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View className="gap-3 pb-8">
                                    {artistResults.map((artist) => {
                                        const selected = favoriteArtists.some((item) => item.id === artist.id || item.name === artist.name);
                                        return (
                                            <Pressable
                                                key={artist.id || artist.name}
                                                onPress={() => toggleFavoriteArtist(artist)}
                                                className="p-4 rounded-2xl border flex-row items-center justify-between"
                                                style={{ backgroundColor: selected ? '#ecfdf5' : theme.card, borderColor: selected ? '#10b981' : (colorScheme === 'dark' ? '#333' : '#e5e7eb') }}
                                            >
                                                <View className="flex-row items-center flex-1">
                                                    <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mr-3">
                                                        <Music size={18} color="#059669" />
                                                    </View>
                                                    <Text style={{ color: theme.text, fontWeight: '700', flex: 1 }}>{artist.name}</Text>
                                                </View>
                                                {selected && <Check size={18} color="#059669" />}
                                            </Pressable>
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
                             <Text style={{ color: Colors.gray }} className="text-center mb-6">Which topics in the news matter most to you?</Text>
                             
                             <ScrollView showsVerticalScrollIndicator={false}>
                                <View className="flex-row flex-wrap gap-3 pb-8">
                                    {categoryOptions.map((cat) => (
                                        <View key={cat.id} style={{ width: '48%' }}>
                                            <Pressable
                                                onPress={() => handleToggle(selectedCategories, setSelectedCategories, cat.id)}
                                                style={{
                                                    padding: 16,
                                                    borderRadius: 12,
                                                    borderWidth: 1,
                                                    borderColor: selectedCategories.includes(cat.id) ? theme.tint : (colorScheme === 'dark' ? '#333' : '#e5e7eb'),
                                                    backgroundColor: selectedCategories.includes(cat.id) ? (colorScheme === 'dark' ? '#112244' : '#eff6ff') : theme.card,
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <Text style={{ fontWeight: '600', color: selectedCategories.includes(cat.id) ? theme.tint : theme.text, flex: 1 }}>
                                                    {cat.name}
                                                </Text>
                                                {selectedCategories.includes(cat.id) && <Check size={16} color={theme.tint} />}
                                            </Pressable>
                                        </View>
                                    ))}
                                </View>
                             </ScrollView>
                        </Animated.View>
                    )}

                    {/* STEP 6: STAY CONNECTED (NOTIFICATIONS) */}
                    {step === 6 && (
                        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1, justifyContent: 'center' }}>
                            <View className="items-center mb-6">
                                <View className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-6">
                                    <BellRing size={32} color={theme.tint} />
                                </View>
                                <Text style={{ color: theme.tint }} className="text-3xl font-serif mb-2 text-center">Stay Connected</Text>
                                <Text style={{ color: Colors.gray }} className="text-center text-base px-4 leading-relaxed">
                                    Your church uses Sanctuary to communicate. Customize what alerts you want to receive on your device.
                                </Text>
                            </View>

                            <View className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-2 mb-8">
                                <NotificationToggle 
                                    icon={<Megaphone size={20} color="#f59e0b" />}
                                    title="Pastoral Announcements" 
                                    description="Crucial updates, service changes, and alerts from your church leadership."
                                    value={pushAnnouncements} 
                                    onValueChange={setPushAnnouncements} 
                                    theme={theme}
                                />
                                <View className="h-px bg-gray-200 dark:bg-gray-800 ml-14" />
                                <NotificationToggle 
                                    icon={<BookOpen size={20} color="#3b82f6" />}
                                    title="Bible Studies & Events" 
                                    description="Get notified when a new study is posted or you are scheduled to volunteer."
                                    value={pushStudies} 
                                    onValueChange={setPushStudies} 
                                    theme={theme}
                                />
                                <View className="h-px bg-gray-200 dark:bg-gray-800 ml-14" />
                                <NotificationToggle 
                                    icon={<Bell size={20} color="#8b5cf6" />}
                                    title="Daily Devotional" 
                                    description="A gentle morning reminder to read your daily scripture and prayer."
                                    value={pushDevotionals} 
                                    onValueChange={setPushDevotionals} 
                                    theme={theme}
                                />
                            </View>

                            <Pressable
                                onPress={handleEnableNotifications}
                                disabled={saving}
                                style={{ backgroundColor: theme.tint }}
                                className="w-full py-4 rounded-2xl items-center justify-center flex-row mb-4 shadow-lg"
                            >
                                {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Enable Notifications</Text>}
                            </Pressable>
                            
                            <Pressable onPress={handleNotificationsComplete} disabled={saving} className="items-center py-2">
                                <Text style={{ color: Colors.gray, fontSize: 14, fontWeight: '600' }}>Skip for now</Text>
                            </Pressable>
                        </Animated.View>
                    )}

                    {/* STEP 7: PAYWALL */}
                    {step === 7 && !isPro && (
                         <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                             <View className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-6">
                                <Crown size={48} color={theme.tint} />
                             </View>
                             <Text style={{ color: theme.tint }} className="text-3xl font-serif mb-2 text-center">Unlock Sanctuary Pro</Text>
                             <Text style={{ color: Colors.gray }} className="text-center mb-8">Deepen your spiritual journey with full access.</Text>

                             <View className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-8 gap-4">
                                <FeatureRow text="Unlimited AI Spiritual Advice" isPro theme={theme} />
                                <FeatureRow text="Personalized Daily Prayers" isPro theme={theme} />
                                <FeatureRow text="In-depth Christian News Analysis" isPro theme={theme} />
                                <FeatureRow text="Advanced Bible Study Tools" isPro theme={theme} />
                             </View>

                             <View className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900 w-full mb-4">
                                <Text style={{ color: theme.tint }} className="font-bold text-center">7 Days Free, then $4.99/mo</Text>
                                <Text style={{ color: Colors.gray }} className="text-xs text-center">Cancel anytime. No commitment.</Text>
                             </View>
                         </Animated.View>
                    )}
                </View>

                {/* Footer Buttons */}
                <View className="py-6 border-t border-gray-100 dark:border-gray-800 flex-row justify-between items-center gap-4">
                     <Pressable
                        onPress={() => setStep(s => Math.max(1, s - 1))}
                        disabled={step === 1 || saving}
                        style={{ opacity: (step === 1 || step === 6) ? 0 : 1 }} 
                        className="flex-row items-center p-3"
                     >
                        <ChevronLeft size={20} color={Colors.gray} />
                        <Text style={{ color: Colors.gray, fontWeight: '600', marginLeft: 4 }}>Back</Text>
                     </Pressable>

                     {step < 6 ? (
                        <Pressable onPress={handleNextStep} style={{ backgroundColor: theme.tint }} className="flex-row items-center px-6 py-3 rounded-full">
                            <Text className="text-white font-bold mr-2">Next</Text>
                            <ChevronRight size={18} color="white" />
                        </Pressable>
                     ) : step === 6 ? (
                        null /* Handled by the big buttons in the center of step 6 */
                     ) : (
                         <View className="flex-1">
                             <Pressable onPress={goToPaywall} disabled={saving} style={{ backgroundColor: theme.tint }} className="w-full py-4 rounded-xl items-center justify-center flex-row mb-3">
                                {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Start 7-Day Free Trial</Text>}
                             </Pressable>
                             <Pressable onPress={handleContinueFree} disabled={saving} className="items-center py-2">
                                 <Text style={{ color: Colors.gray, fontSize: 12, fontWeight: '500' }}>Continue with Limited Free Plan</Text>
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
                <View style={{ backgroundColor: theme.background, borderRadius: 16, padding: 24 }}>
                    <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold', fontFamily: 'serif', marginBottom: 12 }}>{modalData?.title}</Text>
                    <Text style={{ color: theme.text, lineHeight: 24 }}>{modalData?.description}</Text>
                    <Pressable 
                        onPress={() => setModalData(null)}
                        style={{ marginTop: 24, padding: 12, backgroundColor: theme.tint, borderRadius: 8, alignItems: 'center' }}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
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
                    <Text style={{ color: Colors.gray }} className="text-xs leading-tight">{description}</Text>
                </View>
            </View>
            <Switch
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
      <Text style={{ color: theme.text, fontWeight: '500' }}>{text}</Text>
    </View>
  )
}
