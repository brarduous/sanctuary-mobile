import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchNewsById } from '@/lib/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { ArrowLeft, Calendar, Play, Share2, Square } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewsDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [news, setNews] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        async function load() {
            if (id) {
                const data = await fetchNewsById(id as string);
                setNews(data);
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
        if (!news) return;
        try {
            await Share.share({
                message: `${news.headline}\n\n${news.summary}\n\nRead more on Sanctuary.`,
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
            // Prefer news_content, then md_content, then synopsis, then content, then summary
            const content = news.news_content || news.md_content || news.synopsis || news.content || news.summary || "";
            const thingToSay = `${news.headline}. ${content.replace(/[#*`_]/g, '')}`; // Strip markdown
            
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

    if (!news) {
        return (
            <View className="flex-1 items-center justify-center p-4">
                <Text style={{ color: theme.text }}>News article not found.</Text>
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
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>Article</Text>
                <Pressable onPress={handleShare} className="p-2">
                    <Share2 size={24} color={theme.text} />
                </Pressable>
            </View>
            
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                 <View className="mb-6">
                    <Text className="text-3xl font-serif font-bold mb-3 leading-tight" style={{ color: theme.text }}>
                        {news.headline}
                    </Text>
                    
                    <View className="flex-row items-center gap-2 mb-6">
                        <Calendar size={14} color={Colors.gray} />
                        <Text style={{ color: Colors.gray, fontWeight: 'medium' }}>
                            {new Date(news.created_at).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Text>
                    </View>
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
                            {isSpeaking ? "Stop Listening" : "Listen to News"}
                        </Text>
                   </Pressable>
                </View>

                {/* Content */}
                <View className="mb-10">
                     <Markdown
                        style={{
                            body: { color: theme.text, fontSize: 18, lineHeight: 28, fontFamily: 'serif' },
                            paragraph: { marginBottom: 20 },
                            heading1: { color: theme.text, fontSize: 24, fontWeight: 'bold', marginBottom: 10, marginTop: 20 },
                            heading2: { color: theme.text, fontSize: 20, fontWeight: 'bold', marginBottom: 10, marginTop: 15 },
                            listItem: { color: theme.text, marginBottom: 5 },
                        }}
                    >
                        {news.news_content || news.md_content || news.synopsis || news.content || news.summary}
                    </Markdown>
                </View>

                <View className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
                    <Text className="text-xs text-gray-400 text-center uppercase tracking-widest">
                        Sanctuary News
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
