//
import { useColorScheme } from '@/components/useColorScheme';
import { getPassageText } from '@/lib/bibleUtils';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Share as ShareIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ViewShot from "react-native-view-shot";

interface VerseOfTheDayCardProps {
  reference: string; // "John 3:16"
  version?: string;  // "NIV", "WEB", etc.
  backgroundImage: any;
}

const VerseOfTheDayCard: React.FC<VerseOfTheDayCardProps> = ({ reference, version = 'NIV', backgroundImage }) => {
  const viewShotRef = useRef<ViewShot>(null);
  const colorScheme = useColorScheme();
  const [verseData, setVerseData] = useState<{ text: string, reference: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the text using the util
  useEffect(() => {
    if (!reference) return;
    setLoading(true);
    // getPassageText is synchronous since it uses local JSON, but we wrap in timeout to not block UI frame
    setTimeout(() => {
        const data = getPassageText(reference, version);
        setVerseData(data);
        setLoading(false);
    }, 10);
  }, [reference, version]);

  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        if (Platform.OS === 'web') {
          alert('Sharing is not supported on web');
        } else {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/jpeg',
            UTI: 'public.jpeg',
            dialogTitle: 'Share Verse of the Day'
          });
        }
      }
    } catch (error) {
      console.error("Sharing failed", error);
    }
  };

  if (!verseData && !loading) return null;

  return (
    <View style={styles.container}>
      {/* The ViewShot wraps ONLY the card content. 
         The Share Button is a sibling, so it won't be in the screenshot.
      */}
      <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
        <ImageBackground
          source={backgroundImage}
          style={styles.cardSize}
          imageStyle={styles.imageStyle}
        >
          {/* Dark Gradient/Overlay for readability */}
          <View style={styles.overlay}>
            
            {loading ? (
               <ActivityIndicator color="white" />
            ) : (
                <>
                    {/* TOP: Reference */}
                    <View style={styles.topContainer}>
                        <Text style={styles.referenceText}>
                            {verseData?.reference.toUpperCase()}
                        </Text>
                        {version !== 'WEB' && (
                           <Text style={styles.versionText}>{version}</Text>
                        )}
                    </View>

                    {/* CENTER: Scripture */}
                    <View style={styles.centerContainer}>
                        <Text style={styles.scriptureText} adjustsFontSizeToFit numberOfLines={12}>
                            "{verseData?.text}"
                        </Text>
                    </View>
                    
                    {/* BOTTOM: Branding (Optional, adds nice touch to share) */}
                    <View style={styles.bottomContainer}>
                        <Text style={styles.brandingText}>SANCTUARY</Text>
                    </View>
                </>
            )}
          </View>
        </ImageBackground>
      </ViewShot>

      {/* Share Button - Absolute Positioned Floating on top */}
      <TouchableOpacity 
        style={styles.floatingShareButton} 
        onPress={handleShare}
        activeOpacity={0.8}
      >
        <ShareIcon size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 24,
    borderRadius: 20,
    // Shadow for the whole card container
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardSize: {
    width: '100%',
    aspectRatio: 1/1, // Slightly shorter than full 9/16 to fit nicely on dashboard
    justifyContent: 'center',
  },
  imageStyle: {
    borderRadius: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)', // Darker overlay for text pop
    borderRadius: 20,
    padding: 32,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  referenceText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800', // Extra Bold
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Bold' : 'Roboto',
  },
  versionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  scriptureText: {
    color: 'white',
    fontSize: 18,
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomContainer: {
    marginBottom: 8,
  },
  brandingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '600',
  },
  floatingShareButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)', // Works on some versions, ignored on others
  }
});

export default VerseOfTheDayCard;