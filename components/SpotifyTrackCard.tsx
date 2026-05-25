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
    <View className="rounded-2xl border p-4 mb-8" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
      <View className="flex-row items-center gap-3">
        {track.imageUrl ? (
          <Image source={{ uri: track.imageUrl }} style={{ width: 56, height: 56, borderRadius: 10 }} />
        ) : (
          <View className="w-14 h-14 rounded-xl items-center justify-center bg-emerald-50">
            <Music size={22} color="#059669" />
          </View>
        )}

        <View className="flex-1">
          <Text className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 mb-1">
            Recommended Worship Song
          </Text>
          <Text className="font-bold text-base" numberOfLines={1} style={{ color: theme.text }}>
            {track.title}
          </Text>
          <Text className="text-xs" numberOfLines={1} style={{ color: theme.mutedForeground }}>
            {track.artist}
          </Text>
        </View>
      </View>

      <View className="mt-4">
        <Pressable
          onPress={openSpotify}
          className="flex-1 rounded-xl py-3 flex-row items-center justify-center bg-emerald-600"
        >
          <ExternalLink size={16} color="white" />
          <Text className="text-white font-bold text-sm ml-2">
            Open in Spotify
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
