import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { checkAdviceLimit, deleteAdvice, fetchAdvice, generateContent } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, Lock, Send, Sparkles, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdviceScreen() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const { isPro } = useRevenueCat();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [adviceList, setAdviceList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [limitReached, setLimitReached] = useState(false);
    const [loadingLimit, setLoadingLimit] = useState(true);

    // Input State
    const [situation, setSituation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function check() {
            if (user && !isPro) {
                const status = await checkAdviceLimit(user.id);
                setLimitReached(status.limitReached);
            } else {
                setLimitReached(false);
            }
            setLoadingLimit(false);
        }
        check();
    }, [user, isPro]);

    useEffect(() => {
        async function loadAdvice() {
            if (user) {
                const data = await fetchAdvice(user.id);
                setAdviceList(data || []);
            }
            setLoading(false);
        }
        loadAdvice();
    }, [user]);

    const handleDelete = async (id: string) => {
        Alert.alert("Delete Advice", "Are you sure you want to delete this?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: async () => {
                    setAdviceList(prev => prev.filter(item => item.advice_id !== id));
                    await deleteAdvice(id);
                } 
            }
        ]);
    };

    const handleSubmit = async () => {
        if (!situation.trim() || !user || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const result = await generateContent('/generate-advice', {
                userId: user.id,
                situation: situation,
            });

            if (result && result.adviceId) {
                setSituation('');
                setIsSubmitting(false);
                router.push(`/advice/${result.adviceId}` as any);
            } else {
                setIsSubmitting(false);
                Alert.alert("Error", "Could not generate advice. Please try again.");
            }
        } catch (error) {
            console.error("Error generating advice:", error);
            setIsSubmitting(false);
            Alert.alert("Error", "An error occurred.");
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
                <View className="flex-1 items-center justify-center p-6 bg-background">
                    <Sparkles size={48} color={theme.tint} style={{ marginBottom: 16 }} />
                    <Text style={{ color: theme.text }} className="text-2xl font-serif text-center mb-2">Spiritual Guidance</Text>
                    <Text style={{ color: Colors.gray }} className="text-center mb-8">Sign in to receive personalized biblical advice and save your conversations.</Text>
                    <Pressable 
                        onPress={() => router.push('/profile')}
                        style={{ backgroundColor: theme.tint }}
                        className="w-full py-4 rounded-xl items-center shadow-sm"
                    >
                        <Text className="text-white font-bold text-lg">Sign In</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <FlatList
                    data={adviceList}
                    keyExtractor={(item) => item.advice_id}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListHeaderComponent={() => (
                        <View className="mb-6">
                            <Text className="text-3xl font-serif font-bold mb-6" style={{ color: theme.text }}>
                                Spiritual Guidance
                            </Text>

                            {/* Limit Banner */}
                            {!loadingLimit && limitReached && !isPro && (
                                <View className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 items-center mb-8">
                                    <View className="w-12 h-12 bg-white dark:bg-gray-700 rounded-full items-center justify-center mb-3">
                                        <Lock size={20} color={Colors.gray} />
                                    </View>
                                    <Text className="font-bold text-lg mb-2" style={{ color: theme.text }}>Monthly Limit Reached</Text>
                                    <Text className="text-center text-gray-500 mb-4 px-4">
                                        You have used your free advice session for this month. Upgrade to Sanctuary Pro for unlimited guidance.
                                    </Text>
                                    <Pressable 
                                        onPress={() => router.push('/paywall')}
                                        style={{ backgroundColor: theme.tint }}
                                        className="flex-row items-center px-6 py-2 rounded-full"
                                    >
                                        <Sparkles size={16} color="white" style={{ marginRight: 8 }} />
                                        <Text className="text-white font-bold">Unlock Unlimited</Text>
                                    </Pressable>
                                </View>
                            )}

                            {/* Input Card */}
                            {!limitReached && (
                                <View className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-1 mb-8">
                                    {isSubmitting ? (
                                        <View className="py-12 items-center justify-center space-y-4">
                                            <ActivityIndicator size="large" color={theme.tint} />
                                            <Text style={{ color: theme.tint, fontWeight: 'bold' }}>Seeking Wisdom...</Text>
                                            <Text style={{ color: Colors.gray }}>Consulting Scripture...</Text>
                                        </View>
                                    ) : (
                                        <View>
                                            <TextInput
                                                value={situation}
                                                onChangeText={setSituation}
                                                placeholder="What's weighing on your heart today?"
                                                placeholderTextColor={Colors.gray}
                                                editable={!isSubmitting}
                                                multiline
                                                style={{ 
                                                    minHeight: 120, 
                                                    padding: 16, 
                                                    fontSize: 18, 
                                                    color: theme.text,
                                                    textAlignVertical: 'top'
                                                }}
                                            />
                                            {situation.length > 0 && (
                                                <Animated.View entering={FadeInUp} className="flex-row justify-between items-center p-4 border-t border-gray-100 dark:border-gray-800">
                                                    <Text style={{ color: Colors.gray, fontSize: 12 }}>{situation.length} chars</Text>
                                                    <Pressable
                                                        onPress={handleSubmit}
                                                        disabled={isSubmitting}
                                                        style={{ backgroundColor: theme.tint }}
                                                        className="flex-row items-center px-4 py-2 rounded-full"
                                                    >
                                                        <Text className="text-white font-bold mr-2">Ask Advice</Text>
                                                        <Send size={14} color="white" />
                                                    </Pressable>
                                                </Animated.View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            )}

                            {adviceList.length > 0 && (
                                <Text className="text-xl font-bold mb-4" style={{ color: theme.text }}>Previous Guidance</Text>
                            )}
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => router.push(`/advice/${item.advice_id}` as any)}
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.9 : 1,
                                transform: [{ scale: pressed ? 0.98 : 1 }]
                            })}
                            className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-4"
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-row items-center">
                                    <Calendar size={12} color={Colors.gray} />
                                    <Text style={{ color: Colors.gray, fontSize: 10, fontWeight: 'bold', marginLeft: 4, textTransform: 'uppercase' }}>
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Pressable hitSlop={10} onPress={(e) => { e.stopPropagation(); handleDelete(item.advice_id); }}>
                                    <Trash2 size={18} color={Colors.gray} />
                                </Pressable>
                            </View>
                            <Text numberOfLines={2} className="text-lg font-serif mb-3 leading-6" style={{ color: theme.text }}>
                                "{item.situation}"
                            </Text>
                            <View className="flex-row items-center">
                                <Sparkles size={12} color={theme.tint} />
                                <Text style={{ color: theme.tint, fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>
                                    View Guidance
                                </Text>
                                <ChevronRight size={12} color={theme.tint} />
                            </View>
                        </Pressable>
                    )}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
