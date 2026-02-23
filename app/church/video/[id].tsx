import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { fetchMessageDetail, logUserActivity } from '@/lib/api';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video'; // <-- NEW IMPORTS
import { Calendar } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function VideoMessageScreen() {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const theme = Colors[useColorScheme() ?? 'light'];
    
    const [message, setMessage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [hasLoggedView, setHasLoggedView] = useState(false);

    // 1. Define the source. It will be null until the fetch completes.
    const videoSource = message ? `https://stream.mux.com/${message.playback_id}.m3u8` : null;

    // 2. Initialize the expo-video player
    const player = useVideoPlayer(videoSource, player => {
        player.loop = false;
        player.play(); // <-- AUTOPLAY: Fires as soon as the source is loaded!
    });

    // 3. Analytics Listener for expo-video
    useEffect(() => {
        // Listen to playback state changes
        const subscription = player.addListener('playingChange', ({ isPlaying }) => {
            if (isPlaying && !hasLoggedView && user && message) {
                setHasLoggedView(true);
                logUserActivity(
                    user.id,
                    'pastoral_message',
                    `Watched pastoral message: ${message.title}`,
                    message.message_id
                );
            }
        });

        // Cleanup listener on unmount
        return () => subscription.remove();
    }, [player, hasLoggedView, user, message]);

    // Fetch the video data
    useEffect(() => {
        fetchMessageDetail(id as string)
            .then(data => setMessage(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <View className="flex-1 justify-center items-center bg-background"><ActivityIndicator size="large" color={theme.tint} /></View>;
    if (!message) return <View className="flex-1 justify-center items-center bg-background"><Text className="dark:text-white">Message not found</Text></View>;

    const formattedDate = new Date(message.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Stack.Screen options={{ title: 'Pastoral Update', headerBackTitle: 'Church' }} />
            
            {/* New expo-video VideoView Component */}
            <View style={styles.videoContainer}>
                <VideoView
                    player={player}
                    style={styles.video}
                    allowsFullscreen
                    allowsPictureInPicture
                    contentFit="contain" // Equivalent to resizeMode="contain"
                />
            </View>

            {/* Video Details */}
            <View className="p-6">
                <View className="flex-row items-center gap-2 mb-3">
                    <Text className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs">
                        {message.message_type.replace('_', ' ')}
                    </Text>
                </View>
                
                <Text className="text-2xl font-serif font-bold dark:text-white mb-4 leading-tight">
                    {message.title}
                </Text>

                <View className="flex-row items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Calendar size={14} color={Colors.gray} />
                    <Text className="text-sm font-medium">{formattedDate}</Text>
                </View>
            </View>
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