import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import * as Sharing from 'expo-sharing';
import { Share as ShareIcon } from 'lucide-react-native';
import React, { useRef } from 'react';
import { ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ViewShot from "react-native-view-shot";

interface VerseOfTheDayCardProps {
  verse: string;
  backgroundImage: any; // Can be a local require() or an object with { uri: '...' }
}

const VerseOfTheDayCard: React.FC<VerseOfTheDayCardProps> = ({ verse, backgroundImage }) => {
  const viewShotRef = useRef<ViewShot>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleShare = async () => {
    try {
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        if (Platform.OS === 'web') {
          alert('Sharing is not supported on web');
        } else {
          await Sharing.shareAsync(uri);
        }
      }
    } catch (error) {
      console.error("Sharing failed", error);
    }
  };

  return (
    <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
      <ImageBackground
        source={backgroundImage}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.overlay}>
          <View style={styles.contentContainer}>
            <Text style={styles.verseText}>{verse}</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <ShareIcon size={24} color="white" />
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    width: '100%',
    aspectRatio: 9 / 16, // Standard stories aspect ratio
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  backgroundImageStyle: {
    borderRadius: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)', // Subtle dark overlay for text readability
    justifyContent: 'space-between',
    padding: 24,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), // A nice serif font
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  shareButton: {
    alignSelf: 'flex-end',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
  },
});

export default VerseOfTheDayCard;