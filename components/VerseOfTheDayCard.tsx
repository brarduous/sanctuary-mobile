//
import { getPassageText, parseScriptureReference } from '@/lib/bibleUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { ChevronRight, Share as ShareIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import ViewShot from "react-native-view-shot";

interface VerseOfTheDayCardProps {
  reference: string; // "John 3:16"
  version?: string;  // "NIV", "WEB", etc.
  backgroundImage: any;
}

const MIN_SCRIPTURE_FONT_SIZE = 15;
const MAX_SCRIPTURE_FONT_SIZE = 26;
const MAX_SCRIPTURE_LINES = 5;
const MAX_SCRIPTURE_TEXT_HEIGHT = 108;
const SCRIPTURE_LINE_HEIGHT_RATIO = 1.42;
const AVERAGE_GLYPH_WIDTH_RATIO = 0.52;
const CARD_HORIZONTAL_INSET = 80;

export const getScriptureVisualLength = (text: string) => {
  return Array.from(text.replace(/\s+/g, ' ').trim()).reduce((total, character) => {
    if (/\s/.test(character)) return total + 0.45;
    if (/[MW@#%&]/.test(character)) return total + 1.35;
    if (/[A-Z]/.test(character)) return total + 1.08;
    if (/[ilI1|'`.,:;!]/.test(character)) return total + 0.55;
    if (/[mw]/.test(character)) return total + 1.2;
    if (/[-–—()[\]{}]/.test(character)) return total + 0.75;
    return total + 1;
  }, 0);
};

export const getScriptureFontSize = (text: string, availableWidth: number) => {
  const visualLength = Math.max(getScriptureVisualLength(text), 1);
  const continuousSize = Math.sqrt(
    (MAX_SCRIPTURE_TEXT_HEIGHT * availableWidth)
    / (visualLength * SCRIPTURE_LINE_HEIGHT_RATIO * AVERAGE_GLYPH_WIDTH_RATIO)
  );
  const startingSize = Math.min(MAX_SCRIPTURE_FONT_SIZE, Math.floor(continuousSize));

  for (let fontSize = startingSize; fontSize >= MIN_SCRIPTURE_FONT_SIZE; fontSize -= 1) {
    const estimatedLines = Math.ceil(
      (visualLength * fontSize * AVERAGE_GLYPH_WIDTH_RATIO) / availableWidth
    );
    const estimatedHeight = estimatedLines * getScriptureLineHeight(fontSize);

    if (estimatedLines <= MAX_SCRIPTURE_LINES && estimatedHeight <= MAX_SCRIPTURE_TEXT_HEIGHT) {
      return fontSize;
    }
  }

  return MIN_SCRIPTURE_FONT_SIZE;
};

const getScriptureLineHeight = (fontSize: number) => Math.round(fontSize * SCRIPTURE_LINE_HEIGHT_RATIO);

const VerseOfTheDayCard: React.FC<VerseOfTheDayCardProps> = ({ reference, version = 'NIV', backgroundImage }) => {
  const viewShotRef = useRef<ViewShot>(null);
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
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

  const handleReadPassage = async () => {
    const parsed = parseScriptureReference(reference);
    if (parsed) {
      await AsyncStorage.multiSet([
        ['bible_book', parsed.book],
        ['bible_chapter', parsed.chapter.toString()],
        ['bible_version', version],
      ]);
    }
    router.push({ pathname: '/bible', params: { reference, version } });
  };

  if (!verseData && !loading) return null;

  const availableTextWidth = Math.max(windowWidth - CARD_HORIZONTAL_INSET, 1);
  const scriptureFontSize = getScriptureFontSize(verseData?.text ?? '', availableTextWidth);
  const scriptureTextStyle = {
    fontSize: scriptureFontSize,
    lineHeight: getScriptureLineHeight(scriptureFontSize),
  };

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
                        <Text style={[styles.scriptureText, scriptureTextStyle]} numberOfLines={MAX_SCRIPTURE_LINES} ellipsizeMode="tail">
                            "{verseData?.text}"
                        </Text>
                    </View>
                    
                    {/* BOTTOM: Full passage affordance */}
                    <View style={styles.bottomContainer}>
                        <TouchableOpacity onPress={handleReadPassage} style={styles.readPassageButton} activeOpacity={0.75}>
                            <Text style={styles.readPassageText}>Read full passage</Text>
                            <ChevronRight size={15} color="white" />
                        </TouchableOpacity>
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
    height: 250,
    justifyContent: 'center',
  },
  imageStyle: {
    borderRadius: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)', // Darker overlay for text pop
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topContainer: {
    alignItems: 'center',
    marginTop: 2,
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
    paddingVertical: 8,
  },
  scriptureText: {
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomContainer: {
    marginBottom: 8,
  },
  readPassageButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  readPassageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
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
  }
});

export default VerseOfTheDayCard;
