import ReadingControls from '@/components/ReadingControls';
import ScreenState from '@/components/ScreenState';
import { Layout } from '@/constants/Layout';
import ScriptureLinkifier from '@/components/ScriptureLinkifier';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchNewsById } from '@/lib/api';
import { newsShareText } from '@/lib/contentShare';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { ArrowLeft, Calendar, Share2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewsDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [news, setNews] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [failedImage, setFailedImage] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setNews(null);
        Speech.stop();
        setIsSpeaking(false);
        async function load() {
            const articleId = Array.isArray(id) ? id[0] : id;
            if (articleId) {
                const data = await fetchNewsById(articleId);
                if (!active) return;
                setNews(data);
            }
            if (active) setLoading(false);
        }
        void load();
        return () => { active = false; };
    }, [id, attempt]);

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

    const scriptureReferences = (outlook: any): string => {
        const references = Array.isArray(outlook?.citedPassages)
            ? outlook.citedPassages.map((passage: any) => passage?.reference).filter((reference: unknown): reference is string => typeof reference === 'string' && reference.trim().length > 0)
            : [];
        if (typeof outlook?.scriptureReference === 'string') references.unshift(outlook.scriptureReference);
        return [...new Set<string>(references.map((reference: string) => reference.trim()))].join('; ');
    };

    const handleShare = async () => {
        if (!news) return;
        const outlook = getAiOutlook();
        try {
            await Share.share({
                message: newsShareText({
                    title: news.article_title || news.headline,
                    summary: outlook?.newsSummary || outlook?.synopsis,
                    reflection: outlook?.thoughtToRemember,
                    sourceUrl: news.article_url,
                }),
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
                const references = scriptureReferences(outlook);
                if (references) thingToSay += `Scripture Reference: ${references}. `;
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
        return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}><ScreenState title="Loading article" loading /></SafeAreaView>;
    }

    if (!news) {
        return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}><ScreenState title="Article unavailable" message="This article may no longer be available. Try again or return to News." onRetry={() => setAttempt(value => value + 1)} /><Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/news')} style={{ alignSelf: 'center', padding: 16, minHeight: 48, marginBottom: 20 }}><Text style={{ color: theme.tint, fontWeight: '600' }}>Back to News</Text></Pressable></SafeAreaView>;
    }

    const outlook = getAiOutlook();
    const references = scriptureReferences(outlook);
    const publishedAt = news.publish_date || news.created_at;
    const readableDate = publishedAt && !Number.isNaN(Date.parse(publishedAt)) ? new Date(publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom']}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 4, borderBottomWidth: 1, borderColor: theme.border }}>
                <Pressable accessibilityRole="button" accessibilityLabel="Back to News" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/news')} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeft size={24} color={theme.text} />
                </Pressable>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>Article</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Share article" onPress={handleShare} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
                    <Share2 size={24} color={theme.text} />
                </Pressable>
            </View>
            
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                 <View className="mb-6">
                    {news.article_thumbnail_url && failedImage !== news.article_thumbnail_url && (
                        <Image 
                            source={{ uri: news.article_thumbnail_url }} 
                            className="w-full h-48 rounded-xl mb-6 bg-gray-200"
                            resizeMode="cover"
                            onError={() => setFailedImage(news.article_thumbnail_url)}
                        />
                    )}

                    <Text style={{ color: theme.text, fontFamily: Layout.serif, fontSize: 28, lineHeight: 36, fontWeight: '700', marginBottom: 16 }}>
                        {news.article_title || news.headline}
                    </Text>
                    
                    {readableDate && <View className="flex-row items-center gap-2">
                        <Calendar size={14} color={theme.mutedForeground} />
                        <Text style={{ color: theme.mutedForeground, fontSize: 13, lineHeight: 20 }}>
                            {readableDate}
                        </Text>
                    </View>}
                </View>

                <View style={{ marginBottom: 24 }}><ReadingControls speaking={isSpeaking} onPress={handleSpeak} label="Listen to news" theme={theme} /></View>

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
                                    <Text style={{ color: theme.mutedForeground, fontSize: 13, lineHeight: 20, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>THE QUICK READ</Text>
                                    <Text style={{ color: theme.text, fontFamily: Layout.serif, ...Layout.body }}>{outlook.synopsis}</Text>
                                    
                                </View>
                            )}

                            {/* Scripture Reference */}
                            {references && (
                                <View style={{ marginBottom: 28, padding: 20, borderRadius: 16, backgroundColor: theme.accentSoft }}>
                                    <Text style={{ color: theme.tint, fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>SCRIPTURE FOCUS</Text>
                                    <ScriptureLinkifier
                                        text={references}
                                        textStyle={{ ...Layout.body, fontFamily: Layout.serif }}
                                    />
                                </View>
                            )}

                            {/* Outlook */}
                            {outlook.outlook && (
                                <View className="mb-8">
                                    <Text className="text-xl font-serif font-bold mb-3" style={{ color: theme.text }}>Christian Outlook</Text>
                                    <View style={{ height: 2, width: 40, backgroundColor: theme.tint, marginBottom: 16 }} />
                                    <ScriptureLinkifier
                                        text={outlook.outlook}
                                        textStyle={{ ...Layout.body, fontFamily: Layout.serif }}
                                    />
                                </View>
                            )}

                            {/* Reflection Questions */}
                            {Array.isArray(outlook.reflectionQuestions) && outlook.reflectionQuestions.length > 0 && (
                                <View style={{ marginTop: 4, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card }}>
                                    <Text className="text-lg font-bold mb-4" style={{ color: theme.text }}>Reflection Questions</Text>
                                    {outlook.reflectionQuestions.map((q: string, i: number) => (
                                        <View key={i} className="flex-row mb-4 last:mb-0">
                                            <View className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: theme.tint }}>
                                                <Text className="text-xs font-bold" style={{ color: theme.onTint }}>{i+1}</Text>
                                            </View>
                                            <Text style={{ color: theme.text, flex: 1, fontSize: 17, lineHeight: 28 }}>{q}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </View>

                <View style={{ borderTopWidth: 1, borderColor: theme.border, paddingTop: 24 }}>
                    <Text style={{ color: theme.mutedForeground, fontSize: 13, textAlign: 'center', letterSpacing: 1 }}>
                        Sanctuary News
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
