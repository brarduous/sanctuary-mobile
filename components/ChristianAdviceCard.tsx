import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getRandomAdvicePromptSample } from '@/constants/AdvicePrompts';
import { useAuth } from '@/context/AuthContext';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { checkAdviceLimit, generateContent } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Lock, Send, Sparkles } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';

// Import the new Mic Button
import AudioMicButton from './AudioMicButton';

interface ChristianAdviceCardProps {
    limitReached?: boolean;
    samplePrompt?: string;
}

export default function ChristianAdviceCard({ limitReached: initialLimitReached, samplePrompt: providedSamplePrompt }: ChristianAdviceCardProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { isPro } = useRevenueCat();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [limitReached, setLimitReached] = useState(initialLimitReached ?? false);
    const [loadingLimit, setLoadingLimit] = useState(true);

    // Input State
    const [situation, setSituation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [samplePrompt] = useState(() => providedSamplePrompt || getRandomAdvicePromptSample());

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

    const handleTranscription = (text: string) => {
        setSituation(prev => prev ? `${prev} ${text}` : text);
    };

    if (!user) {
        return (
            <View className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 items-center">
                <Sparkles size={32} color={theme.tint} style={{ marginBottom: 12 }} />
                <Text style={{ color: theme.text }} className="text-lg font-serif font-bold text-center mb-2">Spiritual Guidance</Text>
                <Text style={{ color: Colors.gray }} className="text-center text-sm mb-4">Bring a real situation, question, or struggle and receive Scripture-shaped guidance.</Text>
                <Pressable 
                    onPress={() => router.push('/profile' as any)}
                    style={{ backgroundColor: theme.tint }}
                    className="w-full py-2 rounded-lg items-center"
                >
                    <Text className="text-white font-bold text-sm">Sign In</Text>
                </Pressable>
            </View>
        );
    }

    if (loadingLimit) {
        return (
            <View className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 items-center justify-center h-24">
                <ActivityIndicator color={theme.tint} />
            </View>
        );
    }

    if (limitReached && !isPro) {
        return (
            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 items-center">
                <View className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full items-center justify-center mb-3">
                    <Lock size={18} color={Colors.gray} />
                </View>
                <Text className="font-bold text-base mb-1" style={{ color: theme.text }}>Monthly Limit Reached</Text>
                <Text className="text-center text-gray-500 text-xs mb-4">
                    You've used your free advice session. Upgrade for unlimited guidance.
                </Text>
                <Pressable 
                    onPress={() => router.push('/paywall' as any)}
                    style={{ backgroundColor: theme.tint }}
                    className="flex-row items-center px-4 py-2 rounded-full"
                >
                    <Sparkles size={14} color="white" style={{ marginRight: 6 }} />
                    <Text className="text-white font-bold text-xs">Unlock Pro</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View 
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-1"
            style={{ 
                shadowColor: '#000', 
                shadowOffset: { width: 0, height: 1 }, 
                shadowOpacity: 0.1, 
                shadowRadius: 2, 
                elevation: 2 
            }}
        >
            {isSubmitting ? (
                <View className="py-8 items-center justify-center">
                    <ActivityIndicator size="large" color={theme.tint} />
                    <Text style={{ color: theme.tint, fontWeight: 'bold', marginTop: 8 }}>Seeking Wisdom...</Text>
                    <Text style={{ color: Colors.gray, fontSize: 12, marginTop: 4 }}>Consulting Scripture...</Text>
                </View>
            ) : (
                <View>
                    <View className="px-4 pt-4 pb-2">
                        <View className="flex-row items-center mb-1">
                            <Sparkles size={16} color={theme.tint} />
                            <Text style={{ color: theme.text }} className="text-lg font-serif font-bold ml-2">Ask for Scriptural Advice</Text>
                        </View>
                        <Text style={{ color: Colors.gray }} className="text-sm leading-5">
                            Describe what you are facing. Sanctuary will help you think through it with biblical wisdom, prayer, and practical next steps.
                        </Text>
                    </View>

                    <TextInput
                        value={situation}
                        onChangeText={setSituation}
                        placeholder="What are you walking through?"
                        placeholderTextColor={Colors.gray}
                        editable={!isSubmitting}
                        multiline
                        style={{ 
                            minHeight: 100, 
                            padding: 16, 
                            fontSize: 16, 
                            color: theme.text,
                            textAlignVertical: 'top'
                        }}
                    />

                    {samplePrompt && !situation.trim() && (
                        <View className="px-4 pb-4">
                            <Text style={{ color: Colors.gray }} className="text-xs font-bold uppercase tracking-widest mb-2">
                                Try asking
                            </Text>
                            <Pressable
                                onPress={() => setSituation(samplePrompt)}
                                className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            >
                                <Text style={{ color: theme.text }} className="text-sm leading-5">
                                    {samplePrompt}
                                </Text>
                            </Pressable>
                        </View>
                    )}
                    
                    {/* The Footer with Mic and Send Button */}
                    <View className="flex-row justify-between items-center p-4 border-t border-slate-100 dark:border-slate-700">
                        <View className="flex-row items-center gap-3">
                            <AudioMicButton 
                                onTranscription={handleTranscription} 
                                tintColor={theme.tint} 
                            />
                            <Text style={{ color: Colors.gray, fontSize: 12 }}>
                                {situation.length > 0 ? `${situation.length} chars` : 'Hold to record'}
                            </Text>
                        </View>
                        
                        {situation.length > 0 && (
                            <Pressable
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                                style={{ backgroundColor: theme.tint }}
                                className="flex-row items-center px-4 py-3 rounded-full shadow-sm"
                            >
                                <Text className="text-white font-bold mr-2 text-sm">Ask Advice</Text>
                                <Send size={12} color="white" />
                            </Pressable>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}
