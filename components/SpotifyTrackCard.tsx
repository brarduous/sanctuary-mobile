import Colors from '@/constants/Colors';
import type { SpotifyTrack } from '@/lib/api';
import { Image } from 'expo-image';
import { ExternalLink, Music } from 'lucide-react-native';
import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

type Props = {
  track: SpotifyTrack | null;
  theme: typeof Colors.light;
};

export default function SpotifyTrackCard({ track, theme }: Props) {
  if (!track) return null;

  const openSpotify = () => {
    if (track.spotifyUrl) {
      Linking.openURL(track.spotifyUrl);
    }
  };

  return (
    <Pressable onPress={openSpotify} accessibilityRole="link" accessibilityLabel={`Open ${track.title} by ${track.artist} in Spotify`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, marginBottom: 24, borderBottomWidth: 1, borderColor: theme.border }}>
      {track.imageUrl ? <Image source={{ uri: track.imageUrl }} style={{ width: 44, height: 44, borderRadius: 8 }} /> :
        <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: theme.muted, alignItems: 'center', justifyContent: 'center' }}><Music size={20} color={theme.tint} /></View>}
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.mutedForeground, fontSize: 13, marginBottom: 3 }}>Worship on Spotify</Text>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }} numberOfLines={2}>{track.title}</Text>
        <Text style={{ color: theme.mutedForeground, fontSize: 13 }} numberOfLines={1}>{track.artist}</Text>
      </View>
      <ExternalLink size={18} color={theme.mutedForeground} />
    </Pressable>
  );
}
