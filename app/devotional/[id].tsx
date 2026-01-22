import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchDevotionalById } from '@/lib/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { ArrowLeft, BookOpen, Play, Share2, Square } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DevotionalDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [devotional, setDevotional] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        async function load() {
            if (id) {
                const data = await fetchDevotionalById(id as string);
                setDevotional(data);
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
        if (!devotional) return;
        try {
            await Share.share({
                message: `${devotional.title}\n\n"${devotional.scripture}"\n\n${devotional.content}\n\nShared via Sanctuary App`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleSpeak = () => {
        if (isSpeaking) {
            Speech.stop();
            setIsSpeaking(false);
        } else {
            const thingToSay = `${devotional.title}. ${devotional.scripture}. ${devotional.content}`;
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

    if (!devotional) {
        return (
            <View className="flex-1 items-center justify-center p-4">
                <Text style={{ color: theme.text }}>Devotional not found.</Text>
                <Pressable onPress={() => router.back()} className="mt-4 p-2">
                    <Text style={{ color: theme.tint }}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom']}>
            <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <Pressable onPress={() => router.back()} className="p-2">
                    <ArrowLeft size={24} color={theme.text} />
                </Pressable>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>Devotional</Text>
                <Pressable onPress={handleShare} className="p-2">
                    <Share2 size={24} color={theme.text} />
                </Pressable>
            </View>
            
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                 <View className="items-center mb-8">
                    <View className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 items-center justify-center mb-4">
                        <BookOpen size={24} color="#d97706" />
                    </View>
                    <Text className="text-3xl font-serif font-bold text-center mb-2 leading-tight" style={{ color: theme.text }}>
                        {devotional.title}
                    </Text>
                    <Text className="text-center font-serif italic opacity-70" style={{ color: theme.text }}>
                        {new Date(devotional.created_at).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </Text>
                </View>

                {/* Scripture Card */}
                <View className="bg-amber-50 dark:bg-slate-900 border-l-4 border-amber-500 p-6 rounded-r-xl mb-8">
                    <Text className="text-lg font-serif italic text-amber-900 dark:text-amber-100 leading-relaxed text-center">
                        "{devotional.scripture}"
                    </Text>
                </View>

                {/* Audio Controls */}
                <View className="flex-row items-center mb-8 justify-center">
                   <Pressable 
                        onPress={handleSpeak}
                        className="flex-row items-center px-6 py-3 rounded-full"
                        style={{ backgroundColor: isSpeaking ? Colors.gray : theme.tint }}
                   >
                        {isSpeaking ? <Square size={18} color="white" fill="white" /> : <Play size={18} color="white" fill="white" />}
                        <Text className="text-white font-bold ml-2">
                            {isSpeaking ? "Stop Reading" : "Listen to Devotional"}
                        </Text>
                   </Pressable>
                </View>

                {/* Content */}
                <View className="mb-10">
                     <Markdown
                        style={{
                            body: { color: theme.text, fontSize: 18, lineHeight: 28, fontFamily: 'serif' },
                            paragraph: { marginBottom: 20 },
                        }}
                    >
                        {devotional.content}
                    </Markdown>
                </View>

                {/* Prayer Section */}
                {devotional.prayer && (
                     <View className="bg-blue-50 dark:bg-slate-900 p-6 rounded-xl mb-10 border border-blue-100 dark:border-slate-800">
                        <Text className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 text-center">Prayer for Today</Text>
                        <Text className="text-lg font-serif text-slate-800 dark:text-slate-200 leading-relaxed italic text-center">
                            "{devotional.prayer}"
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
