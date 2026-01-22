import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchAdviceById } from '@/lib/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { ArrowLeft, Play, Share2, Square } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
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

    useEffect(() => {
        async function load() {
            if (id) {
                const data = await fetchAdviceById(id as string);
                setAdvice(data);
                console.log(data);
                setLoading(false);
            }
        }
        load();
    }, [id]);

    useEffect(() => {
        return () => {
             Speech.stop();
        };
    }, []);

    const handleShare = async () => {
        if (!advice) return;
        try {
            await Share.share({
                message: `Situation: ${advice.situation}\n\nGuidance:\n${advice.advice_text}\n\nShared via Sanctuary App`,
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
            const thingToSay = advice?.advice_text?.replace(/[#*`_]/g, '') || "";
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
                        {isSpeaking ? <Square size={18} color="white" fill="white" /> : <Play size={18} color="white" fill="white" />}
                        <Text className="text-white font-bold ml-2">
                            {isSpeaking ? "Stop Reading" : "Listen to Guidance"}
                        </Text>
                   </Pressable>
                </View>

                {/* Markdown Content */}
                <View className="mb-10">
                     <Markdown
                        style={{
                            body: { color: theme.text, fontSize: 16, lineHeight: 26, fontFamily: 'serif' },
                            heading1: { color: theme.text, fontFamily: 'serif', fontWeight: 'bold' },
                            heading2: { color: theme.text, fontFamily: 'serif', marginTop: 16, marginBottom: 8 },
                            paragraph: { marginBottom: 16 },
                            blockquote: { 
                                borderLeftWidth: 4, 
                                borderLeftColor: theme.tint, 
                                paddingLeft: 12, 
                                fontStyle: 'italic',
                                color: Platform.OS === 'ios' ? Colors.gray : theme.text, // Android dark mode text fix
                                opacity: 0.8
                            },
                        }}
                    >
                        {JSON.parse(advice.advice_points).map((point: string, index: number) => `${index + 1}. ${point}`).join('\n')}
                    </Markdown>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
