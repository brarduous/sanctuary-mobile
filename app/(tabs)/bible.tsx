import { formatReadingHtml } from '@/lib/readingHtml';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { parseScriptureReference } from '@/lib/bibleUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Type, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import RenderHtml, { MixedStyleDeclaration } from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';

// Load Bible Data directly
// In a real app with multiple versions, we might lazy load or use file system
const BIBLE_FILES: Record<string, any> = {
  WEB: require('@/assets/bible/web-optimized.json'),
  ASV: require('@/assets/bible/asv-optimized.json'),
  NIV: require('@/assets/bible/niv-optimized.json'),
  KJV: require('@/assets/bible/kjv-optimized.json'),
};

const AVAILABLE_TRANSLATIONS: Record<string, { key: string; longName: string; description: string }> = {
  WEB: {
    key: 'WEB',
    longName: 'World English Bible',
    description: 'Modern English, Public Domain',
  },
  ASV: {
    key: 'ASV',
    longName: 'American Standard Version',
    description: 'Literal translation, Public Domain', 
  },
  NIV: {
    key: 'NIV',
    longName: 'New International Version',
    description: 'Balanced, readable translation',
  },
  KJV: {
    key: 'KJV',
    longName: 'King James Version',
    description: 'Classic, majestic translation',
  }
};

export default function BibleScreen() {
  const { reference, version } = useLocalSearchParams<{ reference?: string; version?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const { width, height } = useWindowDimensions();
  const theme = Colors[colorScheme];

  // --- STATE ---
  const [versionKey, setVersionKey] = useState<string>('WEB');
  const [versionMenuOpen, setVersionMenuOpen] = useState(false);
  const [bibleData, setBibleData] = useState<any>(null);

  const [currentBookId, setCurrentBookId] = useState<string>('');
  const [currentChapterNum, setCurrentChapterNum] = useState(1);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra'>('normal');
  const showControls = true;
  const [readerSettingsOpen, setReaderSettingsOpen] = useState(false);

  // Menu State
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<'BOOKS' | 'CHAPTERS'>('BOOKS');
  const [selectedMenuBook, setSelectedMenuBook] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'OT' | 'NT'>('NT');

  const scrollViewRef = useRef<ScrollView>(null);

  // --- 1. INITIALIZE FROM STORAGE ---
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSize = await AsyncStorage.getItem('bible_font_size');
        if (savedSize === 'normal' || savedSize === 'large' || savedSize === 'extra') setFontSize(savedSize);
        const savedVersion = await AsyncStorage.getItem('bible_version');
        const savedBook = await AsyncStorage.getItem('bible_book');
        const savedChapter = await AsyncStorage.getItem('bible_chapter');
        // const savedVerse = await AsyncStorage.getItem('bible_verse'); // Scrolling to verse is harder in RN without layout measurement

        if (savedVersion && AVAILABLE_TRANSLATIONS[savedVersion]) {
          setVersionKey(savedVersion);
        }

        if (savedBook && savedChapter) {
          setCurrentBookId(savedBook);
          setCurrentChapterNum(parseInt(savedChapter, 10));
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };
    loadSettings();
  }, []);

  // A scripture card can deep-link directly into its full chapter.
  useEffect(() => {
    if (!reference) return;
    const parsed = parseScriptureReference(reference);
    if (!parsed) return;

    setCurrentBookId(parsed.book);
    setCurrentChapterNum(parsed.chapter);
    if (version && AVAILABLE_TRANSLATIONS[version]) setVersionKey(version);
  }, [reference, version]);

  // --- 2. LOAD DATA ---
  useEffect(() => {
    // Load the appropriate Bible translation file based on versionKey
    const bibleData = BIBLE_FILES[versionKey];
    if (bibleData) {
      setBibleData(bibleData);
    }
  }, [versionKey]);

  // --- 3. DERIVED STATE ---
  const allBooks = useMemo(() => {
    if (!bibleData) return [];
    return [...bibleData.oldTestament, ...bibleData.newTestament];
  }, [bibleData]);

  const currentBook = useMemo(() =>
    allBooks.find((b: any) => b.title === currentBookId),
  [allBooks, currentBookId]);

  const currentChapter = useMemo(() =>
    currentBook?.chapters.find((c: any) => c.number === currentChapterNum),
  [currentBook, currentChapterNum]);

  // --- 4. HANDLE DEFAULTS (Genesis 1) ---
  useEffect(() => {
    if (bibleData && !currentBookId && allBooks.length > 0) {
      const firstBook = allBooks[0];
      setCurrentBookId(firstBook.title);
      setCurrentChapterNum(1);
    }
  }, [bibleData, currentBookId, allBooks]);

  // --- 5. PERSIST STATE ---
  useEffect(() => {
    if (currentBookId) {
      AsyncStorage.setItem('bible_book', currentBookId);
      AsyncStorage.setItem('bible_chapter', currentChapterNum.toString());
      AsyncStorage.setItem('bible_version', versionKey);
    }
  }, [currentBookId, currentChapterNum, versionKey]);

  // Scroll to top when chapter changes
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentBookId, currentChapterNum]);

  // --- HANDLERS ---
  const navigateChapter = (direction: 'next' | 'prev') => {
    if (!currentBook) return;

    const bIndex = allBooks.findIndex((b: any) => b.title === currentBookId);
    const cIndex = currentBook.chapters.findIndex((c: any) => c.number === currentChapterNum);

    if (direction === 'next') {
      if (cIndex < currentBook.chapters.length - 1) {
        setCurrentChapterNum(currentBook.chapters[cIndex + 1].number);
      } else if (bIndex < allBooks.length - 1) {
        const nextBook = allBooks[bIndex + 1];
        setCurrentBookId(nextBook.title);
        setCurrentChapterNum(nextBook.chapters[0].number);
      }
    } else {
      if (cIndex > 0) {
        setCurrentChapterNum(currentBook.chapters[cIndex - 1].number);
      } else if (bIndex > 0) {
        const prevBook = allBooks[bIndex - 1];
        setCurrentBookId(prevBook.title);
        setCurrentChapterNum(prevBook.chapters[prevBook.chapters.length - 1].number);
      }
    }
  };

  const handleBookSelect = (book: any) => {
    setSelectedMenuBook(book);
    setMenuView('CHAPTERS');
  };

  const handleChapterSelect = (chapterNum: number) => {
    setCurrentBookId(selectedMenuBook.title);
    setCurrentChapterNum(chapterNum);
    setMenuOpen(false);
  };

  // Get next chapter or book label
  const getNextLabel = () => {
    if (!currentBook) return 'Next';
    const bIndex = allBooks.findIndex((b: any) => b.title === currentBookId);
    const cIndex = currentBook.chapters.findIndex((c: any) => c.number === currentChapterNum);
    
    if (cIndex < currentBook.chapters.length - 1) {
      return `Ch. ${currentBook.chapters[cIndex + 1].number}`;
    } else if (bIndex < allBooks.length - 1) {
      const nextBook = allBooks[bIndex + 1];
      return nextBook.title; // Truncate long names
    }
    return 'Next';
  };

  // Get previous chapter or book label
  const getPrevLabel = () => {
    if (!currentBook) return 'Prev';
    const bIndex = allBooks.findIndex((b: any) => b.title === currentBookId);
    const cIndex = currentBook.chapters.findIndex((c: any) => c.number === currentChapterNum);
    
    if (cIndex > 0) {
      return `Ch. ${currentBook.chapters[cIndex - 1].number}`;
    } else if (bIndex > 0) {
      const prevBook = allBooks[bIndex - 1];
      return prevBook.title; // Truncate long names
    }
    return 'Prev';
  };

  const getPixelSize = () => {
    if (fontSize === 'extra') return 24;
    if (fontSize === 'large') return 20;
    return 18;
  };

  const tagsStyles: Readonly<Record<string, MixedStyleDeclaration>> = useMemo(() => ({
    body: {
      fontSize: getPixelSize(),
      lineHeight: getPixelSize() * 1.5,
      color: theme.text,
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    p: { marginTop: 0, marginBottom: 14, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
    sup: { // Verse numbers
        fontSize: getPixelSize() * 0.6,
        color: Colors[colorScheme].tint,
        fontWeight: 'bold',
        marginRight: 4,
        top: -4,
    },
    span: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    }
  }), [fontSize, theme, colorScheme]);

  if (!bibleData || !currentBook) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={{ color: theme.text, marginTop: 16 }}>Loading Scripture...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
        {/* HEADER */}
        {showControls && (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}
                className="flex-row items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 z-10 bg-white dark:bg-black"
                style={{ backgroundColor: theme.background }}
            >
                <Pressable accessibilityRole="button" accessibilityLabel="Choose book and chapter" onPress={() => { setMenuView('BOOKS'); setMenuOpen(true); }} className="p-3">
                    <Menu size={24} color={theme.text} />
                </Pressable>

                <View className="items-center">
                    <Text className="text-lg font-serif font-bold dark:text-white" style={{color: theme.text}}>
                        {currentBook.title} {currentChapterNum}
                    </Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Choose translation, current version ${versionKey}`} onPress={() => setVersionMenuOpen(true)} style={{ backgroundColor: theme.muted, minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 22, marginTop: 4 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.mutedForeground }}>
                            {versionKey} ▼
                        </Text>
                    </Pressable>
                </View>

                <Pressable onPress={() => setReaderSettingsOpen(true)} accessibilityRole="button" accessibilityLabel="Reading settings" className="p-3">
                    <Type size={24} color={theme.text} />
                </Pressable>
            </Animated.View>
        )}

        {/* CONTENT WRAPPER */}
        <View 
            style={{ flex: 1 }} 
        >
            <ScrollView 
                ref={scrollViewRef}
                scrollEnabled={true}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={true}
            >
                <RenderHtml
                    contentWidth={width - 40}
                    source={{ html: formatReadingHtml(currentChapter?.content || "") }}
                    tagsStyles={tagsStyles}
                    baseStyle={tagsStyles.body}
                    defaultTextProps={{ style: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' } }}
                    enableExperimentalMarginCollapsing={true}
                />
            </ScrollView>
        </View>

        {/* Sticky Navigation at Bottom */}
        <View className="flex-row justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-800" style={{ backgroundColor: theme.background }}>
            <Pressable 
                onPress={() => navigateChapter('prev')}
                className="flex-row items-center p-3 active:opacity-50"
            >
                <ChevronLeft size={20} color={theme.text} />
                <Text style={{ color: theme.text, marginLeft: 4, fontWeight: '600', fontSize: 14 }}>{getPrevLabel()}</Text>
            </Pressable>

            <Pressable 
                onPress={() => navigateChapter('next')}
                className="flex-row items-center p-3 active:opacity-50"
            >
                <Text style={{ color: theme.text, marginRight: 4, fontWeight: '600', fontSize: 14 }}>{getNextLabel()}</Text>
                <ChevronRight size={20} color={theme.text} />
            </Pressable>
        </View>

        <Modal visible={readerSettingsOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setReaderSettingsOpen(false)}>
          <View style={{ flex: 1, padding: 24, backgroundColor: theme.background }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <Text style={{ fontSize: 22, fontWeight: '600', color: theme.text }}>Reading settings</Text>
              <Pressable onPress={() => setReaderSettingsOpen(false)} accessibilityRole="button" style={{ padding: 12 }}><Text style={{ color: theme.tint, fontSize: 16 }}>Done</Text></Pressable>
            </View>
            <Text style={{ color: theme.mutedForeground, fontSize: 16, marginBottom: 16 }}>Choose a comfortable text size.</Text>
            {([{ value: 'normal', label: 'Standard', size: 18 }, { value: 'large', label: 'Comfortable', size: 20 }, { value: 'extra', label: 'Large', size: 24 }] as const).map(option => (
              <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: fontSize === option.value }}
                onPress={() => { setFontSize(option.value); void AsyncStorage.setItem('bible_font_size', option.value); }}
                style={{ padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: fontSize === option.value ? theme.tint : theme.border, backgroundColor: fontSize === option.value ? theme.accentSoft : theme.card }}>
                <Text style={{ fontSize: option.size, color: theme.text, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </Modal>

        {/* BOOKS MENU (Modal) */}
        <Modal
            visible={menuOpen}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setMenuOpen(false)}
        >
            <View style={{ flex: 1, backgroundColor: theme.background }}>
                {/* Modal Header */}
                <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    {menuView === 'CHAPTERS' ? (
                        <Pressable onPress={() => setMenuView('BOOKS')} accessibilityRole="button" className="flex-row items-center" style={{ minHeight: 44, paddingRight: 12 }}>
                            <ArrowLeft size={20} color={theme.tint} />
                            <Text style={{ color: theme.tint, marginLeft: 4, fontWeight: 'bold' }}>Back</Text>
                        </Pressable>
                    ) : (
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>Select Book</Text>
                    )}
                    <Pressable onPress={() => setMenuOpen(false)} accessibilityRole="button" style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: theme.text, fontWeight: 'bold' }}>Close</Text>
                    </Pressable>
                </View>

                {/* VIEW 1: BOOKS LIST */}
                {menuView === 'BOOKS' && (
                    <View style={{ flex: 1 }}>
                        <View className="flex-row p-2 bg-gray-100 dark:bg-gray-800">
                            {['OT', 'NT'].map(tab => (
                                <Pressable 
                                    key={tab} 
                                    onPress={() => setActiveTab(tab as 'OT' | 'NT')}
                                    accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab }} style={{ minHeight: 44 }}
                                    className={`flex-1 py-2 rounded-md items-center justify-center ${activeTab === tab ? 'bg-white dark:bg-gray-700' : ''}`}
                                >
                                    <Text style={{ 
                                        color: activeTab === tab ? theme.tint : theme.tabIconDefault,
                                        fontWeight: 'bold' 
                                    }}>
                                        {tab === 'OT' ? 'Old Testament' : 'New Testament'}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
                            {(activeTab === 'OT' ? bibleData.oldTestament : bibleData.newTestament).map((book: any) => (
                                <Pressable
                                    key={book.id}
                                    onPress={() => handleBookSelect(book)}
                                    accessibilityRole="button" accessibilityState={{ selected: currentBookId === book.title }}
                                    style={{ backgroundColor: currentBookId === book.title ? theme.accentSoft : theme.background }}
                                    className="flex-row justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800"
                                >
                                    <Text style={{ 
                                        color: currentBookId === book.title ? theme.tint : theme.text,
                                        fontSize: 16,
                                        fontWeight: currentBookId === book.title ? 'bold' : 'normal'
                                    }}>
                                        {book.title}
                                    </Text>
                                    <ChevronRight size={16} color={theme.mutedForeground} />
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* VIEW 2: CHAPTERS GRID */}
                {menuView === 'CHAPTERS' && selectedMenuBook && (
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        <Text className="text-2xl font-serif font-bold text-center mb-6 dark:text-white" style={{ color: theme.text }}>
                            {selectedMenuBook.title}
                        </Text>
                        <View className="flex-row flex-wrap gap-3">
                            {selectedMenuBook.chapters.map((ch: any) => (
                                <Pressable
                                    key={ch.number}
                                    onPress={() => handleChapterSelect(ch.number)}
                                    accessibilityRole="button" accessibilityLabel={`${selectedMenuBook.title} chapter ${ch.number}`}
                                    accessibilityState={{ selected: currentBookId === selectedMenuBook.title && currentChapterNum === ch.number }}
                                    style={{
                                        width: Math.max(44, Math.floor((width - 80) / 5)),
                                        aspectRatio: 1,
                                        backgroundColor: currentBookId === selectedMenuBook.title && currentChapterNum === ch.number ? theme.tint : theme.card,
                                        borderWidth: 1,
                                        borderColor: currentBookId === selectedMenuBook.title && currentChapterNum === ch.number ? theme.tint : theme.border,
                                        alignItems: 'center',
                                        alignContent: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 8,
                                    }}
                                >
                                    <Text style={{ 
                                        color: currentBookId === selectedMenuBook.title && currentChapterNum === ch.number ? theme.onTint : theme.text,
                                        fontSize: 17,
                                        fontWeight: 'bold',
                                        textAlign: 'center',

                                    }}>
                                        {ch.number}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>
                )}
            </View>
        </Modal>

        {/* VERSION MENU (Simple Modal for now) */}
        <Modal
            visible={versionMenuOpen}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setVersionMenuOpen(false)}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                <View accessibilityViewIsModal style={{ backgroundColor: theme.card, borderRadius: 20, overflow: 'hidden', maxHeight: height * 0.85 }}>
                    <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text accessibilityRole="header" style={{ fontWeight: '600', fontSize: 20, color: theme.text }}>Select Version</Text>
                        <Pressable accessibilityRole="button" accessibilityLabel="Close translation picker" onPress={() => setVersionMenuOpen(false)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                            <X size={24} color={theme.text} />
                        </Pressable>
                    </View>
                    <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ padding: 16 }}>
                        {Object.values(AVAILABLE_TRANSLATIONS).map((info) => (
                            <Pressable
                                key={info.key}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: versionKey === info.key }}
                                onPress={() => { setVersionKey(info.key); setVersionMenuOpen(false); }}
                                style={{ padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 8, backgroundColor: versionKey === info.key ? theme.accentSoft : theme.card, borderColor: versionKey === info.key ? theme.tint : theme.border }}
                            >
                                <View className="flex-row justify-between mb-1">
                                    <Text style={{ fontWeight: 'bold', color: versionKey === info.key ? theme.tint : theme.text }}>
                                        {info.key}
                                    </Text>
                                    {versionKey === info.key && (
                                        <View style={{ backgroundColor: theme.tint, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                                            <Text style={{ color: theme.onTint, fontSize: 12, fontWeight: '600' }}>Active</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={{ fontSize: 17, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: theme.text, marginBottom: 4 }}>
                                    {info.longName}
                                </Text>
                                <Text style={{ fontSize: 14, color: theme.mutedForeground }}>
                                    {info.description}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    </SafeAreaView>
  );
}
