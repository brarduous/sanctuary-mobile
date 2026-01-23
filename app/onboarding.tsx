import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { fetchAppOptions, fetchCategories, updateUserFollowedCategories, updateUserProfile } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Check, ChevronLeft, ChevronRight, Crown, Info } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isPro } = useRevenueCat();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Data State
  const [focusOptions, setFocusOptions] = useState<{ title: string, description: string }[]>([]);
  const [improveOptions, setImproveOptions] = useState<{ title: string, description: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [selectedImprove, setSelectedImprove] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  
  const [modalData, setModalData] = useState<{ title: string, description: string } | null>(null);

  // Skip paywall step if already Pro
  const totalSteps = isPro ? 3 : 4;

  useEffect(() => {
    async function loadData() {
      try {
        const [options, cats] = await Promise.all([
          fetchAppOptions(),
          fetchCategories()
        ]);

        if (options) {
          const focusData = options.find((o: any) => o.name === 'focus_areas')?.options || [];
          const improveData = options.find((o: any) => o.name === 'improvement_areas')?.options || [];
          setFocusOptions(focusData);
          setImproveOptions(improveData);
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

  // Check if already completed?
  // We assume the calling logic handles this, or we check profile content
  useEffect(() => {
    if (profile?.user_preferences?.onboardingCompleted) {
       // Replace to avoid going back
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

  const savePreferences = async () => {
    if (!user) return;
    const userPreferences = {
      focusAreas: selectedFocus,
      improvementAreas: selectedImprove,
      onboardingCompleted: true
    };

    const profilePromise = updateUserProfile(user.id, {
      user_preferences: userPreferences
    });
    const categoriesPromise = updateUserFollowedCategories(user.id, selectedCategories);
    await Promise.all([profilePromise, categoriesPromise]);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await savePreferences();
      router.replace('/(tabs)');
    } catch (err) {
      console.error(err);
      setSaving(false);
      Alert.alert("Error", "Could not save preferences. Please try again.");
    }
  };

  const goToPaywall = async () => {
      // First save prefs but maybe NOT mark as completed? 
      // Actually we should save prefs so if they close app they are saved.
      if (!user) return;
      setSaving(true);
      try {
        // We set onboardingCompleted to true because even if they decline pro, they are done with onboarding content
        await savePreferences(); 
        router.push('/paywall'); 
      } catch (e) {
        console.log(e);
        setSaving(false);
      }
  };

  const handleContinueFree = async () => {
      if (!user) return;
      setSaving(true);
      try {
        await savePreferences();
        router.replace('/(tabs)');
      } catch (err) {
        setSaving(false);
      }
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
        <View className="flex-1 px-6">
            {/* Progress Bar */}
            <View className="flex-row gap-2 mt-4 mb-8">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map(i => (
                    <View 
                        key={i}
                        style={{ 
                            flex: 1, 
                            height: 6, 
                            borderRadius: 3, 
                            backgroundColor: i <= step ? theme.tint : (colorScheme === 'dark' ? '#333' : '#e5e7eb') 
                        }} 
                    />
                ))}
            </View>

            <View style={{ flex: 1 }}>
                {step === 1 && (
                    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
                        <Text style={{ color: theme.tint }} className="text-3xl font-serif mb-2 text-center">Spiritual Focus</Text>
                        <Text style={{ color: Colors.gray }} className="text-center mb-6">Where would you like to grow in your walk with God?</Text>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="flex-row flex-wrap gap-3 pb-8">
                                {focusOptions.map((opt) => (
                                    <View key={opt.title} style={{ width: '48%' }}> 
                                        {/* Simple custom card */}
                                        <Pressable
                                            onPress={() => handleToggle(selectedFocus, setSelectedFocus, opt.title)}
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
                                            <Pressable onPress={() => setModalData(opt)} hitSlop={10}>
                                                <Info size={14} color={Colors.gray} />
                                            </Pressable>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </Animated.View>
                )}

                {step === 2 && (
                    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
                        <Text style={{ color: theme.tint }} className="text-3xl font-serif mb-2 text-center">Areas for Growth</Text>
                        <Text style={{ color: Colors.gray }} className="text-center mb-6">What specific challenges would you like guidance on?</Text>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="flex-row flex-wrap gap-3 pb-8">
                                {improveOptions.map((opt) => (
                                    <View key={opt.title} style={{ width: '48%' }}>
                                        <Pressable
                                            onPress={() => handleToggle(selectedImprove, setSelectedImprove, opt.title)}
                                            style={{
                                                padding: 16,
                                                borderRadius: 12,
                                                borderWidth: 1,
                                                borderColor: selectedImprove.includes(opt.title) ? theme.tint : (colorScheme === 'dark' ? '#333' : '#e5e7eb'),
                                                backgroundColor: selectedImprove.includes(opt.title) ? (colorScheme === 'dark' ? '#112244' : '#eff6ff') : theme.card,
                                            }}
                                        >
                                            <View className="flex-row justify-between items-start mb-2">
                                                 <Text style={{ fontWeight: '600', color: theme.text, flex: 1 }}>{opt.title}</Text>
                                                 {selectedImprove.includes(opt.title) && <Check size={16} color={theme.tint} />}
                                            </View>
                                            <Pressable onPress={() => setModalData(opt)} hitSlop={10}>
                                                <Info size={14} color={Colors.gray} />
                                            </Pressable>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </Animated.View>
                )}

                {step === 3 && (
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

                {step === 4 && !isPro && (
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
                    style={{ opacity: step === 1 ? 0 : 1 }}
                    className="flex-row items-center p-3"
                 >
                    <ChevronLeft size={20} color={Colors.gray} />
                    <Text style={{ color: Colors.gray, fontWeight: '600', marginLeft: 4 }}>Back</Text>
                 </Pressable>

                 {step < 3 ? (
                    <Pressable
                        onPress={() => setStep(s => s + 1)}
                        style={{ backgroundColor: theme.tint }}
                        className="flex-row items-center px-6 py-3 rounded-full"
                    >
                        <Text className="text-white font-bold mr-2">Next</Text>
                        <ChevronRight size={18} color="white" />
                    </Pressable>
                 ) : step === 3 ? (
                     <Pressable
                        onPress={() => {
                            if (isPro) {
                                handleFinish();
                            } else {
                                setStep(4);
                            }
                        }}
                        disabled={saving}
                        style={{ backgroundColor: theme.tint }}
                        className="flex-row items-center px-6 py-3 rounded-full"
                    >
                        {saving ? <ActivityIndicator color="white" /> : (
                            <>
                                <Text className="text-white font-bold mr-2">{isPro ? 'Finish' : 'Next'}</Text>
                                <ChevronRight size={18} color="white" />
                            </>
                        )}
                    </Pressable>
                 ) : (
                     <View className="flex-1">
                         <Pressable
                            onPress={goToPaywall}
                            disabled={saving}
                            style={{ backgroundColor: theme.tint }}
                            className="w-full py-4 rounded-xl items-center justify-center flex-row mb-3"
                         >
                            {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Start 7-Day Free Trial</Text>}
                         </Pressable>
                         <Pressable onPress={handleContinueFree} disabled={saving} className="items-center py-2">
                             <Text style={{ color: Colors.gray, fontSize: 12, fontWeight: '500' }}>Continue with Limited Free Plan</Text>
                         </Pressable>
                     </View>
                 )}
            </View>
        </View>

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
