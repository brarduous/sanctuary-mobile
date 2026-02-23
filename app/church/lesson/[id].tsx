import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { logActivityEvent } from '@/lib/activityLogger';
import { fetchLessonDetail } from '@/lib/api';
import { Stack, useLocalSearchParams } from 'expo-router';
import { BookOpen, Info, MessageCircle, Target } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

// Helper to safely parse JSON strings from the database
const safeParse = (data: any) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try { return JSON.parse(data); } catch { return null; }
};

export default function LessonScreen() {
    const { id } = useLocalSearchParams();
    const theme = Colors[useColorScheme() ?? 'light'];
    const [lesson, setLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchLessonDetail(id as string)
            .then(data => {
                setLesson(data);
                if (user) {
                    logActivityEvent({
                        userId: user.id,
                        activityType: 'bible_study_lesson', // or 'viewed_lesson'
                        description: `Viewed lesson: ${data.title}`,
                        activityId: data.lesson_id
                    });
                }

            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id, user]);

    if (loading) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color={theme.tint} /></View>;
    if (!lesson) return <View className="flex-1 justify-center items-center"><Text className="dark:text-white">Lesson not found</Text></View>;

    // Safely parse all the rich JSON fields
    const intro = safeParse(lesson.introduction);
    const aims = safeParse(lesson.lesson_aims) || [];
    const outline = safeParse(lesson.study_outline) || [];
    const questions = safeParse(lesson.reflection_questions) || safeParse(lesson.discussion_starters) || [];
    const sidebar = safeParse(lesson.application_sidebar);
    const conclusion = safeParse(lesson.conclusion);

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Stack.Screen options={{ title: `Lesson ${lesson.lesson_number}`, headerBackTitle: 'Back' }} />
            
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
                
                {/* 1. Header */}
                <Text className="text-3xl font-serif font-bold dark:text-white leading-tight mb-4">
                    {lesson.title}
                </Text>

                {lesson.scripture && (
                    <View className="flex-row items-center bg-indigo-50 dark:bg-indigo-900/30 self-start px-4 py-2 rounded-full mb-8">
                        <BookOpen size={16} color={theme.tint} style={{ marginRight: 8 }} />
                        <Text className="font-bold text-indigo-700 dark:text-indigo-300">{lesson.scripture}</Text>
                    </View>
                )}

                {/* 2. Introduction & Hook */}
                {intro && (
                    <View className="mb-8">
                        {intro.hook && (
                            <Text className="text-xl font-serif italic text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                                "{intro.hook}"
                            </Text>
                        )}
                        {intro.background && (
                            <Text className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                                {intro.background}
                            </Text>
                        )}
                    </View>
                )}

                {/* 3. Lesson Aims */}
                {aims.length > 0 && (
                    <View className="bg-slate-50 dark:bg-gray-900 p-5 rounded-2xl mb-8 border border-slate-100 dark:border-gray-800">
                        <View className="flex-row items-center mb-3">
                            <Target size={18} color={theme.tint} style={{ marginRight: 8 }} />
                            <Text className="font-bold dark:text-white">Goals for this Lesson</Text>
                        </View>
                        {aims.map((aim: string, i: number) => (
                            <Text key={i} className="text-sm text-slate-600 dark:text-slate-400 mb-2">• {aim}</Text>
                        ))}
                    </View>
                )}

                {/* 4. Main Commentary */}
                {lesson.commentary && (
                    <View className="mb-8">
                        <Text className="text-lg font-bold dark:text-white mb-3">Commentary</Text>
                        <Text className="text-base text-slate-700 dark:text-slate-300 leading-loose">
                            {lesson.commentary}
                        </Text>
                    </View>
                )}

                {/* 5. Study Outline // not ready to include just yet since outlines are for the clergy
                {outline.length > 0 && (
                    <View className="mb-8">
                        <Text className="text-lg font-bold dark:text-white mb-4">Study Outline</Text>
                        {outline.map((section: any, idx: number) => (
                            <View key={idx} className="mb-4 ml-2">
                                <Text className="font-bold text-base dark:text-white mb-2">{idx + 1}. {section.heading}</Text>
                                {section.points?.map((pt: string, pIdx: number) => (
                                    <Text key={pIdx} className="text-slate-600 dark:text-slate-400 ml-4 mb-1.5 leading-snug">
                                        - {pt}
                                    </Text>
                                ))}
                            </View>
                        ))}
                    </View>
                )} */}

                {/* 6. Application Sidebar */}
                {sidebar && (
                    <View className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl mb-8 border border-amber-100 dark:border-amber-900/50">
                        <View className="flex-row items-center mb-3">
                            <Info size={18} color="#d97706" style={{ marginRight: 8 }} />
                            <Text className="font-bold text-amber-900 dark:text-amber-400">{sidebar.title || "Application"}</Text>
                        </View>
                        <Text className="text-amber-800 dark:text-amber-200/80 leading-relaxed">
                            {sidebar.body}
                        </Text>
                    </View>
                )}

                {/* 7. Discussion Questions */}
                {questions.length > 0 && (
                    <View className="mb-8">
                        <View className="flex-row items-center mb-4">
                            <MessageCircle size={20} color={theme.tint} style={{ marginRight: 8 }} />
                            <Text className="text-lg font-bold dark:text-white">Reflection Questions</Text>
                        </View>
                        {questions.map((q: string, i: number) => (
                            <View key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm mb-3 border border-slate-100 dark:border-slate-800">
                                <Text className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{q}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* 8. Conclusion */}
                {conclusion && (
                    <View className="bg-indigo-600 rounded-3xl p-6 mt-4">
                        {conclusion.summary && (
                            <View className="mb-4 pb-4 border-b border-indigo-400">
                                <Text className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">Summary</Text>
                                <Text className="text-white leading-relaxed">{conclusion.summary}</Text>
                            </View>
                        )}
                        {conclusion.thoughtToRemember && (
                            <View className="mb-4 pb-4 border-b border-indigo-400">
                                <Text className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">Thought to Remember</Text>
                                <Text className="text-white font-serif italic text-lg text-center my-2">"{conclusion.thoughtToRemember}"</Text>
                            </View>
                        )}
                        {conclusion.prayer && (
                            <View>
                                <Text className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">Closing Prayer</Text>
                                <Text className="text-white leading-relaxed">{conclusion.prayer}</Text>
                            </View>
                        )}
                    </View>
                )}

            </ScrollView>
        </View>
    );
}