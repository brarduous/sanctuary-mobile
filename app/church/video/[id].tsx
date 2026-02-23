import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { fetchMessageDetail, logUserActivity } from '@/lib/api'; // <-- Updated import
import { Stack, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Calendar } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

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

// --- MAIN SCREEN ---
export default function VideoMessageScreen() {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const theme = Colors[useColorScheme() ?? 'light'];
    
    const [message, setMessage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [muxStreamUrl, setMuxStreamUrl] = useState<string | null>(null);
    const [formattedDate, setFormattedDate] = useState<string>(''); 

    // Fetch the video data
    useEffect(() => {
        fetchMessageDetail(id as string)
            .then(data => {
                console.log('Fetched message detail:', data);
                setMessage(data);
                console.log('https://stream.mux.com/' + data.video_playback_id + '.m3u8');    
                setMuxStreamUrl(`https://stream.mux.com/${data.video_playback_id}.m3u8`);
                setFormattedDate(new Date(data.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }));
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <View className="flex-1 justify-center items-center bg-background"><ActivityIndicator size="large" color={theme.tint} /></View>;
    if (!message) return <View className="flex-1 justify-center items-center bg-background"><Text className="dark:text-white">Message not found</Text></View>;


    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Stack.Screen options={{ title: 'Pastoral Update', headerBackTitle: 'Church' }} />
            
            {/* The video container now safely renders our child component ONLY after the URL is known */}
            <View style={styles.videoContainer}>
                <PastoralVideoPlayer 
                    sourceUrl={muxStreamUrl? muxStreamUrl : ''} 
                    message={message} 
                    user={user} 
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