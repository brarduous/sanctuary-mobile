import ChristianAdviceCard from '@/components/ChristianAdviceCard';
import { useColorScheme } from '@/components/useColorScheme';
import { getRandomAdvicePromptSample } from '@/constants/AdvicePrompts';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { deleteAdvice, fetchAdvice } from '@/lib/api';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, ChevronRight, Sparkles, MoreHorizontal } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdviceScreen() {
    const { user } = useAuth();
    const userId = user?.id;
    const router = useRouter();
    const { compose } = useLocalSearchParams<{ compose?: string }>();
    const [focusRequest, setFocusRequest] = useState<string>();
    const listRef = useRef<FlatList>(null);
    const handleComposerFocused = React.useCallback(() => setFocusRequest(undefined), []);
    useFocusEffect(React.useCallback(() => {
        if (!compose) return;
        setFocusRequest(compose);
        router.setParams({ compose: undefined });
    }, [compose, router]));
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

    React.useEffect(() => {
        if (focusRequest && !loading) listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [focusRequest, loading]);

    const listHeader = useMemo(() => (
        <View className="mb-6">
            <View className="mb-8">
                <ChristianAdviceCard limitReached={limitReached} samplePrompt={advicePromptSample} focusRequest={focusRequest} onComposerFocused={handleComposerFocused} />
            </View>

            {adviceList.length > 0 && (
                <Text className="text-xl font-bold mb-4" style={{ color: theme.text }}>Previous Guidance</Text>
            )}
        </View>
    ), [adviceList.length, advicePromptSample, limitReached, theme.text, focusRequest, handleComposerFocused]);

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
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['left', 'right']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <FlatList
                    ref={listRef}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
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
                            className="p-4 border-b border-slate-200 dark:border-slate-700 mb-1"
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-row items-center">
                                    <Calendar size={12} color={theme.mutedForeground} />
                                    <Text style={{ color: theme.mutedForeground, fontSize: 13, fontWeight: 'bold', marginLeft: 4, textTransform: 'uppercase' }}>
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Guidance options" style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }} onPress={(e) => { e.stopPropagation(); Alert.alert('Guidance options', 'Choose an action for this reflection.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item.advice_id) }]); }}>
                                    <MoreHorizontal size={18} color={theme.mutedForeground} />
                                </Pressable>
                            </View>
                            <Text numberOfLines={2} className="text-lg font-serif mb-3 leading-6" style={{ color: theme.text }}>
                                "{item.situation}"
                            </Text>
                            <View className="flex-row items-center">
                                <Sparkles size={12} color={theme.tint} />
                                <Text style={{ color: theme.tint, fontSize: 14, fontWeight: 'bold', marginLeft: 4 }}>
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
