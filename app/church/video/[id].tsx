import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import ScreenState from '@/components/ScreenState';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/context/AuthContext';
import { fetchMessageDetail, logUserActivity } from '@/lib/api'; // <-- Updated import
import { Stack, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Calendar } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import RenderHTML, { defaultSystemFonts } from 'react-native-render-html';

const readerFonts = [...defaultSystemFonts, Layout.serif];

// --- NEW: SEPARATED PLAYER COMPONENT ---
// This guarantees the hook only initializes when the URL is ready
const PastoralVideoPlayer = ({ 
    sourceUrl, 
    message, 
    user 
}: { 
    sourceUrl: string; 
    message: any; 
    user: any; 
}) => {
    const [hasLoggedView, setHasLoggedView] = useState(false);

    // Initialize the expo-video player
    const player = useVideoPlayer(sourceUrl, player => {
        player.loop = false;
        player.play(); // Autoplay now works reliably!
    });

    // Analytics Listener for expo-video
    useEffect(() => {
        const subscription = player.addListener('playingChange', ({ isPlaying }) => {
            if (isPlaying && !hasLoggedView && user && message) {
                setHasLoggedView(true);
                
                // Updated to match your exact parameter signature
                logUserActivity(
                    user.id,
                    'pastoral_message',
                    `Watched pastoral message: ${message.title}`,
                    message.message_id
                );
            }
        });

        return () => subscription.remove();
    }, [player, hasLoggedView, user, message]);

    return (
        <VideoView
            player={player}
            style={styles.video}
            allowsFullscreen
            allowsPictureInPicture
            contentFit="contain"
        />
    );
};

export default function VideoMessageScreen() {
    const { id } = useLocalSearchParams();
    const { user, userCongregationId, loading: authLoading } = useAuth();
    const theme = Colors[useColorScheme() ?? 'light'];
    const { width } = useWindowDimensions();
    const [message, setMessage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    const screen = <Stack.Screen options={{ title: 'Pastoral Update', headerBackTitle: 'Church' }} />;

    useEffect(() => {
        if (authLoading) return;
        let active = true;
        setLoading(true);
        setMessage(null);
        fetchMessageDetail(id as string, userCongregationId)
            .then(data => { if (active) setMessage(data); })
            .catch(() => { /* Show the same retry state for unavailable reads. */ })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id, userCongregationId, authLoading, attempt]);

    if (loading) return <>{screen}<ScreenState title="Loading update" loading /></>;
    if (!message) return <>{screen}<ScreenState title="Update unavailable" message="This update may no longer be published. You can try again or return to your church." onRetry={() => setAttempt(value => value + 1)} /></>;

    const streamUrl = message.video_playback_id ? `https://stream.mux.com/${message.video_playback_id}.m3u8` : null;
    const date = new Date(message.created_at);
    const formattedDate = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            {screen}
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {streamUrl ? <View style={styles.videoContainer}>
                    <PastoralVideoPlayer sourceUrl={streamUrl} message={message} user={user} />
                </View> : null}
                <View style={{ padding: Layout.gutter }}>
                    <Text style={{ color: theme.tint, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                        {String(message.message_type || 'Church update').replace(/_/g, ' ')}
                    </Text>
                    <Text accessibilityRole="header" style={{ color: theme.text, fontFamily: Layout.serif, fontSize: 28, lineHeight: 36, fontWeight: '700', marginBottom: 16 }}>{message.title}</Text>
                    {formattedDate ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                        <Calendar size={14} color={theme.mutedForeground} />
                        <Text style={{ color: theme.mutedForeground, fontSize: 14 }}>{formattedDate}</Text>
                    </View> : null}
                    {message.message_body ? <RenderHTML
                        systemFonts={readerFonts}
                        contentWidth={Math.max(1, width - Layout.gutter * 2)}
                        source={{ html: message.message_body }}
                        baseStyle={{ color: theme.text, fontFamily: Layout.serif, fontSize: 17, lineHeight: 28 }}
                        tagsStyles={{ p: { marginTop: 0, marginBottom: 20 }, h1: { color: theme.text, fontSize: 24, lineHeight: 32, fontWeight: '700', marginTop: 24, marginBottom: 12 }, h2: { color: theme.text, fontSize: 22, lineHeight: 30, fontWeight: '700', marginTop: 24, marginBottom: 12 }, h3: { color: theme.text, fontSize: 20, lineHeight: 28, fontWeight: '700', marginTop: 20, marginBottom: 12 }, a: { color: theme.tint } }}
                    /> : !streamUrl ? <Text style={{ color: theme.mutedForeground, fontSize: 16, lineHeight: 25 }}>Your church has not added a message or video to this update yet.</Text> : null}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    videoContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
    },
    video: {
        flex: 1,
    }
});
