import { scriptureCardHeight, SCRIPTURE_CARD_CHROME_HEIGHT } from '@/lib/scriptureCardLayout';
import { getPassageText, parseScriptureReference } from '@/lib/bibleUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { ChevronRight, Share as ShareIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import ViewShot from "react-native-view-shot";

interface VerseOfTheDayCardProps {
  reference: string; // "John 3:16"
  version?: string;  // "NIV", "WEB", etc.
  backgroundImage: any;
}

const SCRIPTURE_FONT_SIZE = 22;
const SCRIPTURE_LINE_HEIGHT = 32;

const VerseOfTheDayCard: React.FC<VerseOfTheDayCardProps> = ({ reference, version = 'NIV', backgroundImage }) => {
  const viewShotRef = useRef<ViewShot>(null);
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const [verseData, setVerseData] = useState<{ text: string, reference: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardWidth, setCardWidth] = useState(windowWidth - 40);
  const [textHeight, setTextHeight] = useState(0);
  const scriptureScrollRef = useRef<ScrollView>(null);
  const scriptureViewport = useRef(0);
  const scriptureContentHeight = useRef(0);
  const [scriptureOffset, setScriptureOffset] = useState(0);

  // Fetch the text using the util
  useEffect(() => {
    if (!reference) return;
    setLoading(true);
    setTextHeight(0);
    setScriptureOffset(0);
    scriptureScrollRef.current?.scrollTo({ y: 0, animated: false });
    // getPassageText is synchronous since it uses local JSON, but we wrap in timeout to not block UI frame
    const timeout = setTimeout(() => {
        const data = getPassageText(reference, version);
        setVerseData(data);
        setLoading(false);
    }, 10);
    return () => clearTimeout(timeout);
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

  const cardHeight = scriptureCardHeight(cardWidth, textHeight);
  const needsScroll = textHeight > cardHeight - SCRIPTURE_CARD_CHROME_HEIGHT;

  return (
    <View style={styles.container} onLayout={event => setCardWidth(event.nativeEvent.layout.width)}>
      {/* The ViewShot wraps ONLY the card content. 
         The Share Button is a sibling, so it won't be in the screenshot.
      */}
      <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
        <ImageBackground
          source={backgroundImage}
          style={[styles.cardSize, { height: cardHeight }]}
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
                        <ScrollView ref={scriptureScrollRef} nestedScrollEnabled scrollEnabled={needsScroll} showsVerticalScrollIndicator={needsScroll}
                            onLayout={event => { scriptureViewport.current = event.nativeEvent.layout.height; }}
                            onContentSizeChange={(_, height) => { scriptureContentHeight.current = height; }}
                            onScroll={event => setScriptureOffset(event.nativeEvent.contentOffset.y)} scrollEventThrottle={100}
                            style={{ width: '100%', flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: needsScroll ? SCRIPTURE_LINE_HEIGHT : 0, justifyContent: needsScroll ? 'flex-start' : 'center' }}>
                            <Text lineBreakStrategyIOS="standard" textBreakStrategy="simple" style={[styles.scriptureText, { fontSize: SCRIPTURE_FONT_SIZE, lineHeight: SCRIPTURE_LINE_HEIGHT }]}
                                onTextLayout={event => { const lines = event.nativeEvent.lines; const height = lines.reduce((sum, line) => sum + line.height, 0); if (Math.abs(height - textHeight) > 1) setTextHeight(height); }}>
                                {verseData?.text}{'\n'}
                            </Text>
                        </ScrollView>
                    </View>
                    {needsScroll && <TouchableOpacity accessibilityRole="button" accessibilityLabel={scriptureOffset >= scriptureContentHeight.current - scriptureViewport.current - 2 ? 'Back to start of scripture' : 'Read next verses'}
                        onPress={() => {
                            const end = Math.max(0, scriptureContentHeight.current - scriptureViewport.current);
                            const nextOffset = scriptureOffset >= end - 2 ? 0 : Math.min(end, scriptureOffset + scriptureViewport.current - SCRIPTURE_LINE_HEIGHT);
                            setScriptureOffset(nextOffset);
                            scriptureScrollRef.current?.scrollTo({ y: nextOffset, animated: false });
                        }} style={{ minHeight: 44, justifyContent: 'center' }}>
                        <Text style={{ color: 'white', fontSize: 13 }}>{scriptureOffset >= scriptureContentHeight.current - scriptureViewport.current - 2 ? 'Back to start ↑' : 'Scroll or tap for next verses ↓'}</Text>
                    </TouchableOpacity>}

                    {/* BOTTOM: Full passage affordance */}
                    <View style={styles.bottomContainer}>
                        <TouchableOpacity onPress={handleReadPassage} accessibilityRole="button" accessibilityLabel="Read full scripture passage" style={styles.readPassageButton} activeOpacity={0.75}>
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
        accessibilityRole="button" accessibilityLabel="Share verse of the day"
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
    justifyContent: 'center',
  },
  imageStyle: {
    borderRadius: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.56)', // White text retains contrast even over a bright photo.
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
    letterSpacing: 1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Bold' : 'Roboto',
  },
  versionText: {
    color: 'white',
    fontSize: 13,
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
    alignSelf: 'stretch',
    paddingRight: 56,
    minHeight: 44,
    justifyContent: 'center',
  },
  readPassageButton: {
    minHeight: 44,
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
    fontSize: 14,
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
