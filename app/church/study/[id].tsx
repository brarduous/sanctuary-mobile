import { formatScriptureReferences } from '@/lib/readingHtml';
import { Layout } from '@/constants/Layout';
import ScreenState from '@/components/ScreenState';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { fetchStudyDetails } from '@/lib/api';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export default function StudyDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { userCongregationId, loading: authLoading } = useAuth();
    const [attempt, setAttempt] = useState(0);
    const screen = <Stack.Screen options={{ title: 'Curriculum', headerBackTitle: 'Church' }} />;
    const theme = Colors[useColorScheme() ?? 'light'];

    const [study, setStudy] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        let active = true;
        setLoading(true);
        setStudy(null);
        fetchStudyDetails(id as string, userCongregationId)
            .then(data => { if (active) setStudy(data); })
            .catch(() => { /* The unavailable state offers a retry. */ })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id, userCongregationId, authLoading, attempt]);

    if (loading) return <>{screen}<ScreenState title="Loading study" loading /></>;
    if (!study) return <>{screen}<ScreenState title="Study unavailable" message="This study may no longer be published. You can try again or return to your church." onRetry={() => setAttempt(value => value + 1)} /></>;

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            {screen}
            
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
                {/* Header */}
                <View className="mb-8">
                    <Text style={{ color: theme.tint, fontSize: 13, lineHeight: 20, fontWeight: '700', marginBottom: 8 }}>
                        {study.study_method || 'Bible Study'}
                    </Text>
                    <Text accessibilityRole="header" style={{ color: theme.text, fontFamily: Layout.serif, fontSize: 28, lineHeight: 36, fontWeight: '700', marginBottom: 12 }}>
                        {study.title}
                    </Text>
                    <Text style={{ color: theme.mutedForeground, fontSize: 17, lineHeight: 28 }}>
                        {study.subtitle}
                    </Text>
                </View>

                {study.lessons?.length > 0 ? <Pressable accessibilityRole="button" onPress={() => router.push(`/church/lesson/${[...study.lessons].sort((a, b) => a.lesson_number - b.lesson_number)[0].lesson_id}` as any)} style={{ minHeight: 52, backgroundColor: theme.action, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}><Text style={{ color: theme.onAction, fontSize: 16, fontWeight: '700' }}>Start study · {study.lessons.length} {study.lessons.length === 1 ? 'lesson' : 'lessons'}</Text></Pressable> : <Text style={{ color: theme.mutedForeground, marginBottom: 24 }}>Lessons will appear here when published.</Text>}

                {/* Lessons */}
                <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 20, lineHeight: 28, fontWeight: '700', marginBottom: 16 }}>Lessons in this Study</Text>
                
                <View className="rounded-3xl border overflow-hidden shadow-sm" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                    {[...(study.lessons || [])].sort((a:any, b:any) => a.lesson_number - b.lesson_number).map((lesson: any, index: number) => (
                        <Pressable
                            key={lesson.lesson_id}
                            onPress={() => router.push(`/church/lesson/${lesson.lesson_id}` as any)}
                            accessibilityRole="button"
                            style={{ padding: 20, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 16, borderTopWidth: index ? 1 : 0, borderColor: theme.border }}
                        >
                            <View style={{ width: 40, height: 40, backgroundColor: theme.accentSoft, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: theme.tint, fontWeight: '700' }}>{lesson.lesson_number}</Text>
                            </View>
                            
                            <View className="flex-1">
                                <Text style={{ color: theme.text, fontSize: 17, lineHeight: 24, fontWeight: '600', marginBottom: 6 }}>{lesson.title}</Text>
                                {lesson.scripture && (
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                        <BookOpen size={12} color={theme.mutedForeground} style={{ marginRight: 4 }} />
                                        <Text style={{ flex: 1, color: theme.mutedForeground, fontSize: 14, lineHeight: 21 }}>{formatScriptureReferences(lesson.scripture)}</Text>
                                    </View>
                                )}
                            </View>
                            
                            <ChevronRight size={20} color={theme.mutedForeground} />
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}