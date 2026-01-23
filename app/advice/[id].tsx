import ScriptureLinkifier from '@/components/ScriptureLinkifier';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchAdviceById } from '@/lib/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { ArrowLeft, Play, Share2, Square } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdviceDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [advice, setAdvice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const pollIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        async function load() {
            if (id) {
                const data = await fetchAdviceById(id as string);
                setAdvice(data);
                console.log(data);
                setLoading(false);

                // Start polling if status is generating
                if (data?.status === 'generating') {
                    startPolling(id as string);
                }
            }
        }
        load();

        return () => {
            // Cleanup polling on unmount
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [id]);

    const startPolling = (adviceId: string) => {
        // Clear any existing interval
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }

        // Poll every 2 seconds
        pollIntervalRef.current = setInterval(async () => {
            try {
                const updatedData = await fetchAdviceById(adviceId);
                setAdvice(updatedData);

                // Stop polling if status is no longer generating
                if (updatedData?.status !== 'generating') {
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                }
            } catch (error) {
                console.error('Error polling advice status:', error);
            }
        }, 2000);
    };

    useEffect(() => {
        return () => {
             Speech.stop();
        };
    }, []);

    const getAdviceText = () => {
        if (!advice || !advice.advice_points) return "";
        let points = advice.advice_points;
        if (typeof points === 'string') {
            try {
                points = JSON.parse(points);
            } catch (e) {
                return points;
            }
        }
        if (Array.isArray(points)) {
             return points.map((point: string, index: number) => `${index + 1}. ${point}`).join('\n\n');
        }
        return "";
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

                {/* Content with scripture linking */}
                <View className="mb-10">
                    <ScriptureLinkifier
                        text={getAdviceText()}
                        className="text-[16px] leading-6 font-serif"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
