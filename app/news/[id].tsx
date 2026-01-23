import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchNewsById } from '@/lib/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { ArrowLeft, Calendar, Play, Share2, Square } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Share, Text, View } from 'react-native';
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

    const getAiOutlook = () => {
        if (!news || !news.ai_outlook) return null;
        if (typeof news.ai_outlook === 'string') {
            try { return JSON.parse(news.ai_outlook); } catch(e) { return null; }
        }
        return news.ai_outlook;
    };

    const handleShare = async () => {
        if (!news) return;
        const outlook = getAiOutlook();
        const content = outlook 
            ? `Synopsis: ${outlook.synopsis}\n\nOutlook: ${outlook.outlook}\n\nScripture: ${outlook.scriptureReference}` 
            : (news.article_title || news.headline);

        try {
            await Share.share({
                message: `${news.article_title || news.headline}\n\n${content}\n\nRead more on Sanctuary.`,
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
            const outlook = getAiOutlook();
            let thingToSay = "";

            if (outlook) {
                thingToSay = `${news.article_title || news.headline}. `;
                if (outlook.synopsis) thingToSay += `Synopsis: ${outlook.synopsis}. `;
                if (outlook.scriptureReference) thingToSay += `Scripture Reference: ${outlook.scriptureReference}. `;
                if (outlook.outlook) thingToSay += `Outlook: ${outlook.outlook}. `;
                if (outlook.reflectionQuestions && Array.isArray(outlook.reflectionQuestions)) {
                   thingToSay += `Reflection Questions: ${outlook.reflectionQuestions.join('. ')}`;
                }
            } else {
                 thingToSay = `${news.article_title || news.headline}. Content not available.`;
            }
            
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

    const outlook = getAiOutlook();

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
                    {news.article_thumbnail_url && (
                        <Image 
                            source={{ uri: news.article_thumbnail_url }} 
                            className="w-full h-48 rounded-xl mb-6 bg-gray-200"
                            resizeMode="cover"
                        />
                    )}

                    <Text className="text-3xl font-serif font-bold mb-3 leading-tight" style={{ color: theme.text }}>
                        {news.article_title || news.headline}
                    </Text>
                    
                    <View className="flex-row items-center gap-2 mb-6">
                        <Calendar size={14} color={Colors.gray} />
                        <Text style={{ color: Colors.gray, fontWeight: 'medium' }}>
                            {new Date(news.publish_date || news.created_at).toLocaleDateString(undefined, {
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
                        {isSpeaking ? 
                            <Square size={18} color={theme.background} fill={theme.background} /> : 
                            <Play size={18} color={theme.background} fill={theme.background} />
                        }
                        <Text className="font-bold ml-2" style={{ color: theme.background }}>
                            {isSpeaking ? "Stop Listening" : "Listen to News"}
                        </Text>
                   </Pressable>
                </View>

                {/* Content */}
                <View className="mb-10">
                    {!outlook ? (
                        <Text style={{ color: theme.text, fontSize: 16 }}>
                            Analysis not available.
                        </Text>
                    ) : (
                        <View>
                            {/* Synopsis */}
                            {outlook.synopsis && (
                                <View className="mb-6">
                                    <Text className="text-lg font-bold mb-2 uppercase tracking-wide opacity-70" style={{ color: theme.text }}>Synopsis</Text>
                                    <Text style={{ color: theme.text, fontSize: 16, lineHeight: 26 }}>
                                        {outlook.synopsis}
                                    </Text>
                                </View>
                            )}

                            {/* Scripture Reference */}
                            {outlook.scriptureReference && (
                                <View className="mb-8 p-4 rounded-xl bg-gray-100 dark:bg-gray-800 border-l-4 border-amber-500">
                                    <Text className="font-bold text-amber-600 dark:text-amber-400 mb-2 uppercase text-xs tracking-widest">Scripture Focus</Text>
                                    <Text style={{ color: theme.text, fontSize: 18, fontFamily: 'serif', fontStyle: 'italic', fontWeight: '500' }}>
                                        "{outlook.scriptureReference}"
                                    </Text>
                                </View>
                            )}

                            {/* Outlook */}
                            {outlook.outlook && (
                                <View className="mb-8">
                                    <Text className="text-xl font-serif font-bold mb-3" style={{ color: theme.text }}>Christian Outlook</Text>
                                    <View style={{ height: 2, width: 40, backgroundColor: theme.tint, marginBottom: 16 }} />
                                    <Text style={{ color: theme.text, fontSize: 18, lineHeight: 30, fontFamily: 'serif' }}>
                                        {outlook.outlook}
                                    </Text>
                                </View>
                            )}

                            {/* Reflection Questions */}
                            {outlook.reflectionQuestions && outlook.reflectionQuestions.length > 0 && (
                                <View className="mt-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                                    <Text className="text-lg font-bold mb-4" style={{ color: theme.text }}>Reflection Questions</Text>
                                    {outlook.reflectionQuestions.map((q: string, i: number) => (
                                        <View key={i} className="flex-row mb-4 last:mb-0">
                                            <View className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: theme.tint }}>
                                                <Text className="text-xs font-bold" style={{ color: theme.background }}>{i+1}</Text>
                                            </View>
                                            <Text style={{ color: theme.text, flex: 1, fontSize: 16, lineHeight: 24 }}>{q}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
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
