import ChurchLessonContent from '@/components/ChurchLessonContent';
import ScreenState from '@/components/ScreenState';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { logActivityEvent } from '@/lib/activityLogger';
import { fetchLessonDetail } from '@/lib/api';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function LessonScreen() {
    const { id } = useLocalSearchParams();
    const theme = Colors[useColorScheme() ?? 'light'];
    const [lesson, setLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { user, userCongregationId, loading: authLoading } = useAuth();
    const [attempt, setAttempt] = useState(0);
    const screen = <Stack.Screen options={{ title: lesson ? `Lesson ${lesson.lesson_number}` : 'Lesson', headerBackTitle: 'Back' }} />;

    useEffect(() => {
        if (authLoading) return;
        let active = true;
        setLoading(true);
        setLesson(null);
        fetchLessonDetail(id as string, userCongregationId)
            .then(data => {
                if (!active) return;
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
            .catch(() => { /* Retry is available on the unavailable state. */ })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id, user, userCongregationId, authLoading, attempt]);

    if (loading) return <>{screen}<ScreenState title="Loading lesson" loading /></>;
    if (!lesson) return <>{screen}<ScreenState title="Lesson unavailable" message="This lesson may no longer be published. You can try again or return to the study." onRetry={() => setAttempt(value => value + 1)} /></>;

    return <View style={{ flex: 1, backgroundColor: theme.background }}>{screen}<ChurchLessonContent lesson={lesson} /></View>;
}
