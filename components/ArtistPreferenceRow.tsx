import { Image } from 'expo-image';
import { Check, Music } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Colors from '@/constants/Colors';
import type { SpotifyArtist } from '@/lib/api';

export default function ArtistPreferenceRow({ artist, selected, disabled = false, onPress, theme }: {
  artist: SpotifyArtist;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
  theme: typeof Colors.light | typeof Colors.dark;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={artist.name}
      accessibilityState={{ checked: selected, disabled }}
      accessibilityHint={disabled ? 'Remove an artist before choosing another. You can choose up to five.' : undefined}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 72, padding: 12, borderRadius: 16, borderWidth: 1,
        borderColor: selected ? theme.tint : theme.border,
        backgroundColor: selected ? theme.accentSoft : theme.card,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: theme.muted, alignItems: 'center', justifyContent: 'center' }}>
        <Music size={20} color={theme.tint} />
        {artist.imageUrl ? <Image source={{ uri: artist.imageUrl }} contentFit="cover" accessible={false} style={{ position: 'absolute', width: 44, height: 44 }} /> : null}
      </View>
      <Text style={{ flex: 1, color: theme.text, fontWeight: '600', fontSize: 16, lineHeight: 22 }}>{artist.name}</Text>
      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: selected ? 0 : 1.5, borderColor: theme.mutedForeground, backgroundColor: selected ? theme.tint : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {selected ? <Check size={16} color={theme.onTint} strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}
