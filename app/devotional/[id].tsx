import ScriptureLinkifier from '@/components/ScriptureLinkifier';
import SpotifyTrackCard from '@/components/SpotifyTrackCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchDevotionalById, recommendSpotifyTrack, SpotifyTrack } from '@/lib/api';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { ArrowLeft, BookOpen, Play, Share2, Square } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNShare from 'react-native-share';
import ViewShot from 'react-native-view-shot';

type ShortFormSlide = {
    slide: number;
    text: string;
};

export default function DevotionalDetailScreen() {
    const { id } = useLocalSearchParams();
    console.log("Devotional ID:", id);
    const router = useRouter();
    const { showActionSheetWithOptions } = useActionSheet();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const storyRefs = useRef<Array<ViewShot | null>>([]);

    const [devotional, setDevotional] = useState<any>(null);
    const [recommendedTrack, setRecommendedTrack] = useState<SpotifyTrack | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const shortFormSlides = useMemo<ShortFormSlide[]>(() => {
        const slides = devotional?.short_form?.slides;
        if (!Array.isArray(slides)) return [];
        return slides
            .filter((slide: any) => typeof slide?.text === 'string' && slide.text.trim().length > 0)
            .slice(0, 3)
            .map((slide: any, index: number) => ({
                slide: Number(slide.slide) || index + 1,
                text: slide.text.trim(),
            }));
    }, [devotional?.short_form]);

    useEffect(() => {
        async function load() {
            if (id) {
                const data = await fetchDevotionalById(id as string);
                console.log("Fetched Devotional Data:", data);
                if (data?.content) {
                    //data.content includes \n for new lines. Let's handle that here
                    data.content = data.content.replace(/\\n/g, '\n');
                }
                setDevotional(data);
                setLoading(false);

                if (data) {
                    const track = await recommendSpotifyTrack({
                        query: data.song_title || undefined,
                        title: data.title,
                        scripture: data.scripture,
                        content: data.content,
                    });
                    setRecommendedTrack(track);
                }
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
        const options = shortFormSlides.length === 3
            ? ['Instagram story gallery', 'Instagram post gallery', 'Share devotional text', 'Cancel']
            : ['Share devotional text', 'Cancel'];
        const cancelButtonIndex = options.length - 1;

        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                title: 'Share devotional',
            },
            async (selectedIndex) => {
                if (selectedIndex === cancelButtonIndex || selectedIndex === undefined) return;

                if (shortFormSlides.length === 3 && selectedIndex === 0) {
                    await shareStoryGallery('story');
                    return;
                }

                if (shortFormSlides.length === 3 && selectedIndex === 1) {
                    await shareStoryGallery('post');
                    return;
                }

                await shareText();
            }
        );
    };

    const shareText = async () => {
        try {
            await Share.share({
                message: `${devotional.title}\n\n"${devotional.scripture}"\n\n${devotional.content}\n\nShared via Sanctuary App`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const captureStorySlides = async () => {
        const uris: string[] = [];

        for (let index = 0; index < shortFormSlides.length; index += 1) {
            const ref = storyRefs.current[index];
            if (ref?.capture) {
                const uri = await ref.capture();
                uris.push(uri);
            }
        }

        return uris;
    };

    const shareStoryGallery = async (target: 'story' | 'post') => {
        try {
            if (Platform.OS === 'web') {
                await shareText();
                return;
            }

            const urls = await captureStorySlides();
            if (urls.length === 0) {
                await shareText();
                return;
            }

            await RNShare.open({
                urls,
                type: 'image/jpeg',
                failOnCancel: false,
                title: target === 'story' ? 'Share to Instagram Stories' : 'Share to Instagram',
                message: 'Shared via Sanctuary App',
            });
        } catch (error) {
            console.error('Story gallery sharing failed', error);
        }
    };

    const handleSpeak = () => {
        if (isSpeaking) {
            Speech.stop();
            setIsSpeaking(false);
        } else {
            const thingToSay = `${devotional.title}. ${devotional.content}`;
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

            {shortFormSlides.length === 3 && (
                <View pointerEvents="none" style={styles.storyCaptureStage}>
                    {shortFormSlides.map((slide, index) => (
                        <ViewShot
                            key={`${slide.slide}-${index}`}
                            ref={(ref) => {
                                storyRefs.current[index] = ref;
                            }}
                            options={{ format: 'jpg', quality: 0.94 }}
                            style={styles.storyFrame}
                        >
                            <View style={[styles.storySlide, storyPalettes[index]]}>
                                <View style={styles.storyKicker}>
                                    <Text style={styles.storyKickerText}>SANCTUARY DEVOTIONAL</Text>
                                </View>
                                <View style={styles.storyContent}>
                                    <Text style={styles.storyTitle} numberOfLines={3} adjustsFontSizeToFit>
                                        {devotional.title}
                                    </Text>
                                    <Text style={styles.storyText} numberOfLines={9} adjustsFontSizeToFit>
                                        {slide.text}
                                    </Text>
                                </View>
                                <View style={styles.storyFooter}>
                                    <Text style={styles.storyScripture} numberOfLines={2} adjustsFontSizeToFit>
                                        {devotional.scripture}
                                    </Text>
                                    <Text style={styles.storyCount}>{index + 1}/3</Text>
                                </View>
                            </View>
                        </ViewShot>
                    ))}
                </View>
            )}
            
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
                    <ScriptureLinkifier
                        text={devotional.scripture}
                    />
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
                            {isSpeaking ? "Stop Reading" : "Listen to Devotional"}
                        </Text>
                   </Pressable>
                </View>

                <SpotifyTrackCard track={recommendedTrack} theme={theme} />

                {/* Content */}
                <View className="mb-10">
                    <Markdown
                        style={{
                            body: { color: theme.text, fontSize: 17, lineHeight: 26, fontFamily: 'serif' },
                            paragraph: { marginTop: 0, marginBottom: 14 },
                            strong: { fontWeight: '700' },
                            em: { fontStyle: 'italic' },
                            bullet_list: { marginVertical: 8 },
                            ordered_list: { marginVertical: 8 },
                            list_item: { color: theme.text, fontSize: 17, lineHeight: 24 },
                            link: { color: theme.tint },
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

const storyPalettes = [
    { backgroundColor: '#2C3E50' },
    { backgroundColor: '#6B705C' },
    { backgroundColor: '#7C3F58' },
];

const styles = StyleSheet.create({
    storyCaptureStage: {
        position: 'absolute',
        left: -9999,
        top: 0,
        width: 1080,
        height: 1920,
    },
    storyFrame: {
        width: 1080,
        height: 1920,
        marginBottom: 48,
    },
    storySlide: {
        width: 1080,
        height: 1920,
        paddingHorizontal: 102,
        paddingVertical: 126,
        justifyContent: 'space-between',
    },
    storyKicker: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.28)',
        paddingBottom: 42,
    },
    storyKickerText: {
        color: 'rgba(255,255,255,0.76)',
        fontSize: 33,
        fontWeight: '800',
        letterSpacing: 0,
        textAlign: 'center',
    },
    storyContent: {
        flex: 1,
        justifyContent: 'center',
    },
    storyTitle: {
        color: '#FFF8EC',
        fontSize: 90,
        lineHeight: 108,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 84,
    },
    storyText: {
        color: '#FFFFFF',
        fontSize: 75,
        lineHeight: 102,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        textAlign: 'center',
    },
    storyFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.28)',
        paddingTop: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 48,
    },
    storyScripture: {
        color: 'rgba(255,255,255,0.82)',
        flex: 1,
        fontSize: 42,
        fontWeight: '700',
    },
    storyCount: {
        color: '#FFF8EC',
        fontSize: 42,
        fontWeight: '800',
    },
});
