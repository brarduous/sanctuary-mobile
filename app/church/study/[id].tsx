import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchStudyDetails } from '@/lib/api';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

export default function StudyDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const theme = Colors[useColorScheme() ?? 'light'];

    const [study, setStudy] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudyDetails(id as string)
            .then(data => setStudy(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color={theme.tint} /></View>;
    if (!study) return <View className="flex-1 justify-center items-center"><Text className="dark:text-white">Study not found</Text></View>;

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Stack.Screen options={{ title: 'Curriculum', headerBackTitle: 'Church' }} />
            
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Header */}
                <View className="mb-8">
                    <Text className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs mb-2">
                        {study.study_method || 'Bible Study'}
                    </Text>
                    <Text className="text-3xl font-serif font-bold dark:text-white leading-tight mb-3">
                        {study.title}
                    </Text>
                    <Text className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                        {study.subtitle}
                    </Text>
                </View>

                {/* Lessons */}
                <Text className="text-xl font-bold dark:text-white mb-4">Lessons in this Study</Text>
                
                <View className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 overflow-hidden shadow-sm">
                    {study.lessons?.sort((a:any, b:any) => a.lesson_number - b.lesson_number).map((lesson: any, index: number) => (
                        <Pressable
                            key={lesson.lesson_id}
                            onPress={() => router.push(`/church/lesson/${lesson.lesson_id}` as any)}
                            className={`p-5 flex-row items-center gap-4 active:bg-slate-50 dark:active:bg-gray-800 transition-colors ${index !== 0 ? 'border-t border-slate-100 dark:border-gray-800' : ''}`}
                        >
                            <View className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full items-center justify-center">
                                <Text className="text-indigo-600 dark:text-indigo-400 font-bold">{lesson.lesson_number}</Text>
                            </View>
                            
                            <View className="flex-1">
                                <Text className="font-bold text-base dark:text-white mb-1 leading-snug">{lesson.title}</Text>
                                {lesson.scripture && (
                                    <View className="flex-row items-center">
                                        <BookOpen size={12} color={Colors.gray} style={{ marginRight: 4 }} />
                                        <Text className="text-xs text-slate-500 font-medium">{lesson.scripture}</Text>
                                    </View>
                                )}
                            </View>
                            
                            <ChevronRight size={20} color={Colors.gray} />
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}