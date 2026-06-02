import ChristianAdviceCard from '@/components/ChristianAdviceCard';
import { useColorScheme } from '@/components/useColorScheme';
import { getRandomAdvicePromptSample } from '@/constants/AdvicePrompts';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { deleteAdvice, fetchAdvice } from '@/lib/api';
import { useFocusEffect, useRouter } from 'expo-router';
import { Calendar, ChevronRight, Sparkles, Trash2 } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdviceScreen() {
    const { user } = useAuth();
    const userId = user?.id;
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [adviceList, setAdviceList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [limitReached, setLimitReached] = useState(false);
    const [advicePromptSample] = useState(() => getRandomAdvicePromptSample());
    const adviceSignatureRef = useRef('');

    const loadAdvice = React.useCallback(async () => {
        if (userId) {
            const data = await fetchAdvice(userId);
            const nextAdviceList = data || [];
            const nextSignature = nextAdviceList
                .map((item: any) => `${item.advice_id}:${item.status}:${item.updated_at}`)
                .join('|');

            if (nextSignature !== adviceSignatureRef.current) {
                adviceSignatureRef.current = nextSignature;
                setAdviceList(nextAdviceList);
            }
        } else if (adviceSignatureRef.current) {
            adviceSignatureRef.current = '';
            setAdviceList([]);
        }
        setLoading(false);
    }, [userId]);

    useFocusEffect(
        React.useCallback(() => {
            loadAdvice();
        }, [loadAdvice])
    );

    const hasInProgressAdvice = useMemo(
        () => adviceList.some((item) => item?.status === 'pending' || item?.status === 'generating' || item?.status === 'queued'),
        [adviceList],
    );

    React.useEffect(() => {
        if (!userId || !hasInProgressAdvice) return;

        const interval = setInterval(() => {
            loadAdvice();
        }, 3000);

        return () => {
            clearInterval(interval);
        };
    }, [hasInProgressAdvice, loadAdvice, userId]);

    const listHeader = useMemo(() => (
        <View className="mb-6">
            <Text className="text-3xl font-serif font-bold mb-6" style={{ color: theme.text }}>
                Spiritual Guidance
            </Text>

            <View className="mb-8">
                <ChristianAdviceCard limitReached={limitReached} samplePrompt={advicePromptSample} />
            </View>

            {adviceList.length > 0 && (
                <Text className="text-xl font-bold mb-4" style={{ color: theme.text }}>Previous Guidance</Text>
            )}
        </View>
    ), [adviceList.length, advicePromptSample, limitReached, theme.text]);

    const handleDelete = async (id: string) => {
        Alert.alert("Delete Advice", "Are you sure you want to delete this?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: async () => {
                    setAdviceList(prev => prev.filter(item => item.advice_id !== id));
                    await deleteAdvice(id);
                } 
            }
        ]);
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <FlatList
                    data={adviceList}
                    keyExtractor={(item) => item.advice_id}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListHeaderComponent={listHeader}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => router.push(`/advice/${item.advice_id}` as any)}
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.9 : 1,
                                transform: [{ scale: pressed ? 0.98 : 1 }]
                            })}
                            className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 mb-4"
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-row items-center">
                                    <Calendar size={12} color={Colors.gray} />
                                    <Text style={{ color: Colors.gray, fontSize: 10, fontWeight: 'bold', marginLeft: 4, textTransform: 'uppercase' }}>
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Pressable hitSlop={10} onPress={(e) => { e.stopPropagation(); handleDelete(item.advice_id); }}>
                                    <Trash2 size={18} color={Colors.gray} />
                                </Pressable>
                            </View>
                            <Text numberOfLines={2} className="text-lg font-serif mb-3 leading-6" style={{ color: theme.text }}>
                                "{item.situation}"
                            </Text>
                            <View className="flex-row items-center">
                                <Sparkles size={12} color={theme.tint} />
                                <Text style={{ color: theme.tint, fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>
                                    View Guidance
                                </Text>
                                <ChevronRight size={12} color={theme.tint} />
                            </View>
                        </Pressable>
                    )}
                    ListEmptyComponent={
                        <View className="py-12 items-center">
                            <Text className="text-slate-400">No previous guidance yet.</Text>
                            <Text className="text-xs text-slate-400 mt-2">Ask a question above to get started.</Text>
                        </View>
                    }
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
