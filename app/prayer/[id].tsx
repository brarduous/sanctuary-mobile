import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchPrayerById } from '@/lib/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { ArrowLeft, Calendar, Play, Share2, Sparkles, Square } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrayerDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [prayer, setPrayer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        async function load() {
            if (id) {
                const data = await fetchPrayerById(id as string);
                setPrayer(data);
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
        if (!prayer) return;
        const content = prayer.content || prayer.generated_prayer || "";
        try {
            await Share.share({
                message: `${prayer.title || "Daily Prayer"}\n\n${content}\n\nShared via Sanctuary App`,
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
            const content = prayer.content || prayer.generated_prayer || "";
            const thingToSay = `Prayer. ${content}`; 
            
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
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    if (!prayer) {
        return (
            <View className="flex-1 items-center justify-center p-4" style={{ backgroundColor: theme.background }}>
                <Text className="mb-4" style={{ color: theme.mutedForeground }}>Prayer not found.</Text>
                <Pressable onPress={() => router.back()} className="p-2">
                    <Text className="font-bold" style={{ color: theme.tint }}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const prayerContent = prayer.content || prayer.generated_prayer || "";

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'bottom']}>
            
            {/* Custom Header */}
            <View className="flex-row items-center justify-between px-4 py-2 border-b" style={{ backgroundColor: theme.background, borderColor: theme.border }}>
                <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full" style={({ pressed }) => [{ backgroundColor: pressed ? theme.muted : 'transparent' }]}>
                    <ArrowLeft size={24} color={theme.text} />
                </Pressable>
                <Text className="text-lg font-bold" style={{ color: theme.text }}>Prayer</Text>
                <Pressable onPress={handleShare} className="p-2 -mr-2 rounded-full" style={({ pressed }) => [{ backgroundColor: pressed ? theme.muted : 'transparent' }]}>
                    <Share2 size={22} color={theme.text} />
                </Pressable>
            </View>


            
            <ScrollView contentContainerStyle={{ padding: 24 }}>
                 <View className="mb-8 items-center">
                    <View className="w-12 h-12 bg-[#D4A373]/10 rounded-full items-center justify-center mb-4">
                        <Sparkles size={24} color="#D4A373" />
                    </View>
                    <Text className="text-2xl font-serif font-bold text-center mb-2" style={{ color: theme.text }}>
                        {prayer.title || "Daily Prayer"}
                    </Text>
                    
                    <View className="flex-row items-center gap-2">
                        <Calendar size={14} color={theme.mutedForeground} />
                        <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.mutedForeground }}>
                            {new Date(prayer.created_at).toLocaleDateString(undefined, {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Text>
                    </View>
                </View>

                {/* Audio Controls */}
                <View className="flex-row items-center mb-10 justify-center">
                    <Pressable 
                        onPress={handleSpeak}
                        className="flex-row items-center px-6 py-3 rounded-full"
                        style={({ pressed }) => [{ backgroundColor: pressed ? theme.text : '#0F172A' }]}
                   >
                        {isSpeaking ? <Square size={16} color="white" fill="white" /> : <Play size={16} color="white" fill="white" />}
                        <Text className="text-white font-bold ml-2 text-sm">
                            {isSpeaking ? "Stop Listening" : "Listen to Prayer"}
                        </Text>
                   </Pressable>
                </View>

                {/* Content */}
                <View className="mb-10 p-8 rounded-[24px] border border-slate-100 dark:border-slate-800" style={{ backgroundColor: theme.card }}>
                     <Text className="text-lg leading-loose font-serif italic text-center" style={{ color: theme.text }}>
                        "{prayerContent}"
                     </Text>
                </View>

                <View className="border-t pt-8 items-center" style={{ borderColor: theme.border }}>
                    <Text className="text-[10px] uppercase tracking-widest font-bold" style={{ color: theme.mutedForeground }}>
                        Sanctuary Prayer
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
