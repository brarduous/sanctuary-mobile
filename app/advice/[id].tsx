import ScriptureLinkifier from '@/components/ScriptureLinkifier';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { fetchAdviceById, fetchPersonalGrowth, updatePersonalGrowth } from '@/lib/api';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { ArrowLeft, BookOpen, Check, MessageCircleQuestion, Play, Share2, Sparkles, Square } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdviceDetailScreen() {
    const { user } = useAuth();
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [advice, setAdvice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [addingGrowthArea, setAddingGrowthArea] = useState(false);
    const [growthAreaAdded, setGrowthAreaAdded] = useState(false);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollAttemptsRef = useRef(0);
    const MAX_POLL_ATTEMPTS = 120;

    const isInProgressStatus = (status?: string) => status === 'generating' || status === 'pending' || status === 'queued';

    const stopPolling = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    };

    const refreshAdvice = async (adviceId: string) => {
        const data = await fetchAdviceById(adviceId);
        setAdvice(data);
        return data;
    };

    useEffect(() => {
        async function load() {
            if (id) {
                const data = await refreshAdvice(id as string);
                setLoading(false);

                if (isInProgressStatus(data?.status)) {
                    startPolling(id as string);
                }
            }
        }
        load();

        return () => {
            stopPolling();
        };
    }, [id]);

    useFocusEffect(
        React.useCallback(() => {
            if (!id) {
                return;
            }

            const run = async () => {
                const data = await refreshAdvice(id as string);
                if (isInProgressStatus(data?.status)) {
                    startPolling(id as string);
                } else {
                    stopPolling();
                }
            };

            run();

            return () => {
                stopPolling();
            };
        }, [id])
    );

    const startPolling = (adviceId: string) => {
        stopPolling();
        pollAttemptsRef.current = 0;

        pollIntervalRef.current = setInterval(async () => {
            try {
                pollAttemptsRef.current += 1;
                const updatedData = await fetchAdviceById(adviceId);
                setAdvice(updatedData);

                if (!isInProgressStatus(updatedData?.status)) {
                    stopPolling();
                    return;
                }

                if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
                    stopPolling();
                }
            } catch (error) {
                console.error('Error polling advice status:', error);
                if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
                    stopPolling();
                }
            }
        }, 2000);
    };

    useEffect(() => {
        return () => {
             Speech.stop();
        };
    }, []);

    const guidance = useMemo(() => {
        if (!advice || !advice.advice_points) return "";
        let points = advice.advice_points;
        if (typeof points === 'string') {
            try {
                points = JSON.parse(points);
            } catch (e) {
                return { steps: [points], scripture_reading: null, prayer: '', acknowledgment: '', follow_up_question: null, suggested_growth_area: null };
            }
        }
        if (Array.isArray(points)) {
             return { steps: points, scripture_reading: null, prayer: '', acknowledgment: '', follow_up_question: null, suggested_growth_area: null };
        }
        return {
            steps: Array.isArray(points.steps) ? points.steps : [],
            scripture_reading: points.scripture_reading || null,
            prayer: points.prayer || '',
            acknowledgment: points.acknowledgment || '',
            follow_up_question: points.follow_up_question || null,
            suggested_growth_area: points.suggested_growth_area || null,
        };
    }, [advice]);

    const getAdviceText = () => {
        if (!guidance || typeof guidance === 'string') return guidance || '';
        const sections = guidance.steps.map((point: string, index: number) => `${index + 1}. ${point}`);
        if (guidance.acknowledgment) sections.unshift(guidance.acknowledgment);
        if (guidance.scripture_reading?.reference) sections.push(`Suggested reading: ${guidance.scripture_reading.reference}. ${guidance.scripture_reading.reason || ''}`);
        if (guidance.prayer) sections.push(`Prayer: ${guidance.prayer}`);
        return sections.join('\n\n');
    };

    const handleAddGrowthArea = async () => {
        if (!user?.id || !guidance || typeof guidance === 'string' || !guidance.suggested_growth_area) return;
        setAddingGrowthArea(true);
        try {
            const current = await fetchPersonalGrowth(user.id);
            const focusAreas = Array.isArray(current?.focus_areas) ? current.focus_areas : [];
            const improvementAreas = Array.isArray(current?.improvement_areas) ? current.improvement_areas : [];
            const suggestedArea = `Other: ${guidance.suggested_growth_area}`;
            await updatePersonalGrowth(user.id, {
                focusAreas,
                improvementAreas: Array.from(new Set([...improvementAreas, suggestedArea])),
            });
            setGrowthAreaAdded(true);
        } catch (error) {
            console.error('Could not add growth area:', error);
            Alert.alert('Could not update your journey', 'Please try again from your profile.');
        } finally {
            setAddingGrowthArea(false);
        }
    };

    const handleShare = async () => {
        if (!advice) return;
        const adviceText = getAdviceText();
        try {
            await Share.share({
                message: `Situation: ${advice.situation}\n\nGuidance:\n${adviceText}\n\nShared via Sanctuary App`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleSpeak = () => {
        if (isSpeaking) {
            Speech.stop();
            setIsSpeaking(false);
            setIsPaused(false);
        } else {
            const adviceText = getAdviceText();
            const thingToSay = adviceText.replace(/[#*`_]/g, '') || "";
            Speech.speak(thingToSay, {
                onDone: () => setIsSpeaking(false),
                onStopped: () => setIsSpeaking(false),
                onError: () => setIsSpeaking(false),
            });
            setIsSpeaking(true);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    if (!advice) {
        return (
            <View className="flex-1 items-center justify-center p-4">
                <Text style={{ color: theme.text }}>Advice not found or deleted.</Text>
                <Pressable onPress={() => router.back()} className="mt-4 p-2">
                    <Text style={{ color: theme.tint }}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    // Show generating state
    if (advice.status === 'generating') {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom']}>
                <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-900" style={{ backgroundColor: theme.background }}>
                    <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800">
                        <ArrowLeft size={24} color={theme.text} />
                    </Pressable>
                    <Text className="text-lg font-bold" style={{ color: theme.text }}>Guidance</Text>
                    <View className="p-2 -mr-2" />
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    {/* Situation Card */}
                    <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mb-6">
                        <Text className="text-sm font-bold opacity-70 mb-2" style={{ color: theme.text }}>YOUR SITUATION</Text>
                        <Text className="text-base italic" style={{ color: theme.text }}>
                            "{advice.situation}"
                        </Text>
                    </View>

                    {/* Generating State */}
                    <View className="flex-1 items-center justify-center py-20">
                        <ActivityIndicator size="large" color={theme.tint} />
                        <Text className="mt-6 text-lg font-serif font-bold text-center" style={{ color: theme.text }}>
                            Seeking Wisdom...
                        </Text>
                        <Text className="mt-2 text-sm text-center" style={{ color: Colors.gray }}>
                            Consulting Scripture for your guidance
                        </Text>
                        <Text className="mt-2 text-xs text-center" style={{ color: Colors.gray }}>
                            This refreshes automatically.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom']}>
            
            {/* Custom Header */}
            <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-900" style={{ backgroundColor: theme.background }}>
                <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800">
                    <ArrowLeft size={24} color={theme.text} />
                </Pressable>
                <Text className="text-lg font-bold" style={{ color: theme.text }}>Guidance</Text>
                <Pressable onPress={handleShare} className="p-2 -mr-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800">
                    <Share2 size={24} color={theme.tint} />
                </Pressable>
            </View>
            
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Situation Card */}
                <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mb-6">
                    <Text className="text-sm font-bold opacity-70 mb-2" style={{ color: theme.text }}>YOUR SITUATION</Text>
                    <Text className="text-base italic" style={{ color: theme.text }}>
                        "{advice.situation}"
                    </Text>
                </View>

                {/* Audio Controls */}
                <View className="flex-row items-center mb-6 justify-center space-x-6">
                   <Pressable 
                        onPress={handleSpeak}
                        className="flex-row items-center px-6 py-3 rounded-full"
                        style={{ backgroundColor: isSpeaking ? Colors.gray : theme.tint }}
                   >
                        {isSpeaking ? 
                            <Square size={18} color={theme.background} fill={theme.background} /> : 
                            <Play size={18} color={theme.background} fill={theme.background} />
                        }
                        <Text className="font-bold ml-2" style={{ color: theme.background }}>
                            {isSpeaking ? "Stop Reading" : "Listen to Guidance"}
                        </Text>
                   </Pressable>
                </View>

                {guidance && typeof guidance !== 'string' ? (
                    <View className="mb-10">
                        {guidance.acknowledgment ? <Text className="text-[16px] leading-6 font-serif mb-6" style={{ color: theme.text }}>{guidance.acknowledgment}</Text> : null}
                        <Text className="text-xl font-serif font-bold mb-4" style={{ color: theme.text }}>Three practical steps</Text>
                        {guidance.steps.map((point: string, index: number) => (
                            <View key={`${index}-${point}`} className="flex-row mb-5">
                                <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.tint }}>
                                    <Text className="font-bold" style={{ color: theme.background }}>{index + 1}</Text>
                                </View>
                                <View className="flex-1 pt-1">
                                    <ScriptureLinkifier text={point} className="text-[16px] leading-6 font-serif" />
                                </View>
                            </View>
                        ))}

                        {guidance.scripture_reading?.reference ? (
                            <View className="p-5 rounded-2xl mb-5" style={{ backgroundColor: theme.card }}>
                                <View className="flex-row items-center mb-2">
                                    <BookOpen size={17} color={theme.tint} />
                                    <Text className="font-bold ml-2" style={{ color: theme.text }}>Suggested Scripture reading</Text>
                                </View>
                                <ScriptureLinkifier text={guidance.scripture_reading.reference} className="text-[16px] leading-6 font-serif" />
                                {guidance.scripture_reading.reason ? <Text className="text-sm leading-5 mt-2" style={{ color: Colors.gray }}>{guidance.scripture_reading.reason}</Text> : null}
                            </View>
                        ) : null}

                        {guidance.prayer ? (
                            <View className="mb-6">
                                <Text className="text-lg font-serif font-bold mb-2" style={{ color: theme.text }}>A prayer</Text>
                                <ScriptureLinkifier text={guidance.prayer} className="text-[16px] leading-6 font-serif italic" />
                            </View>
                        ) : null}

                        {guidance.follow_up_question ? (
                            <View className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-5">
                                <View className="flex-row items-center mb-2">
                                    <MessageCircleQuestion size={17} color={theme.tint} />
                                    <Text className="font-bold ml-2" style={{ color: theme.text }}>A helpful follow-up</Text>
                                </View>
                                <Text className="text-sm leading-5" style={{ color: theme.text }}>{guidance.follow_up_question}</Text>
                            </View>
                        ) : null}

                        {guidance.suggested_growth_area ? (
                            <View className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <View className="flex-row items-center mb-2">
                                    <Sparkles size={17} color={theme.tint} />
                                    <Text className="font-bold ml-2 flex-1" style={{ color: theme.text }}>Connect this to your growth journey?</Text>
                                </View>
                                <Text className="text-sm leading-5 mb-3" style={{ color: Colors.gray }}>
                                    Add “{guidance.suggested_growth_area}” as a private growth area. Nothing is added without your choice.
                                </Text>
                                <Pressable
                                    onPress={handleAddGrowthArea}
                                    disabled={addingGrowthArea || growthAreaAdded}
                                    className="self-start flex-row items-center px-4 py-2 rounded-full"
                                    style={{ backgroundColor: growthAreaAdded ? Colors.gray : theme.tint }}
                                >
                                    {addingGrowthArea ? <ActivityIndicator size="small" color="white" /> : growthAreaAdded ? <Check size={15} color="white" /> : null}
                                    <Text className="text-white font-bold text-sm ml-1">{growthAreaAdded ? 'Added' : 'Add to my journey'}</Text>
                                </Pressable>
                            </View>
                        ) : null}
                    </View>
                ) : (
                    <View className="mb-10">
                        <ScriptureLinkifier text={getAdviceText()} className="text-[16px] leading-6 font-serif" />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
