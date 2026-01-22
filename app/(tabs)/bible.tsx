import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Type, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import RenderHtml, { MixedStyleDeclaration } from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';

// Load Bible Data directly
// In a real app with multiple versions, we might lazy load or use file system
const WEB_DATA = require('@/assets/bible/web-optimized.json');

const AVAILABLE_TRANSLATIONS: Record<string, { key: string; longName: string; description: string }> = {
  WEB: {
    key: 'WEB',
    longName: 'World English Bible',
    description: 'Modern English, Public Domain',
  },
  // Add placeholders for others if needed, but we only have WEB for now
  ASV: {
    key: 'ASV',
    longName: 'American Standard Version',
    description: 'Literal translation (Coming Soon)', 
  }
};

export default function BibleScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions();
  const theme = Colors[colorScheme];

  // --- STATE ---
  const [versionKey, setVersionKey] = useState<string>('WEB');
  const [versionMenuOpen, setVersionMenuOpen] = useState(false);
  const [bibleData, setBibleData] = useState<any>(null);

  const [currentBookId, setCurrentBookId] = useState<string>('');
  const [currentChapterNum, setCurrentChapterNum] = useState(1);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra'>('normal');
  const [showControls, setShowControls] = useState(true);

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

  // --- 2. LOAD DATA ---
  useEffect(() => {
    // Simulate async load even though it's required
    // This keeps the pattern consistent if we switch to FS later
    setBibleData(WEB_DATA);
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

  const toggleFontSize = () => {
    if (fontSize === 'extra') setFontSize('normal');
    else if (fontSize === 'large') setFontSize('extra');
    else setFontSize('large');
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
    sup: { // Verse numbers
        fontSize: getPixelSize() * 0.6,
        color: Colors[colorScheme].tint,
        fontWeight: 'bold',
        marginRight: 4,
        top: -4,
    },
    span: {
        // Normal text
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
                <Pressable onPress={() => { setMenuView('BOOKS'); setMenuOpen(true); }} className="p-2">
                    <Menu size={24} color={theme.text} />
                </Pressable>

                <View className="items-center">
                    <Text className="text-lg font-serif font-bold dark:text-white" style={{color: theme.text}}>
                        {currentBook.title} {currentChapterNum}
                    </Text>
                    <Pressable onPress={() => setVersionMenuOpen(true)} className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full mt-1">
                        <Text className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                            {bibleData.shortname} ▼
                        </Text>
                    </Pressable>
                </View>

                <Pressable onPress={toggleFontSize} className="p-2">
                    <Type size={24} color={theme.text} />
                </Pressable>
            </Animated.View>
        )}

        {/* CONTENT */}
        <Pressable 
            style={{ flex: 1 }} 
            onPress={() => setShowControls(prev => !prev)}
        >
            <ScrollView 
                ref={scrollViewRef}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <RenderHtml
                    contentWidth={width - 40}
                    source={{ html: currentChapter?.content || "" }}
                    tagsStyles={tagsStyles}
                    enableExperimentalMarginCollapsing={true}
                />

                {/* Footer Nav */}
                <View className="flex-row justify-between mt-12 pt-6 border-t border-gray-200 dark:border-gray-800">
                    <Pressable 
                        onPress={(e) => { e.stopPropagation(); navigateChapter('prev'); }}
                        className="flex-row items-center p-4 active:opacity-50"
                    >
                        <ChevronLeft size={20} color={theme.text} />
                        <Text style={{ color: theme.text, marginLeft: 4, fontWeight: '600' }}>Previous</Text>
                    </Pressable>

                    <Pressable 
                        onPress={(e) => { e.stopPropagation(); navigateChapter('next'); }}
                        className="flex-row items-center p-4 active:opacity-50"
                    >
                        <Text style={{ color: theme.text, marginRight: 4, fontWeight: '600' }}>Next</Text>
                        <ChevronRight size={20} color={theme.text} />
                    </Pressable>
                </View>
            </ScrollView>
        </Pressable>

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
                        <Pressable onPress={() => setMenuView('BOOKS')} className="flex-row items-center">
                            <ArrowLeft size={20} color={theme.tint} />
                            <Text style={{ color: theme.tint, marginLeft: 4, fontWeight: 'bold' }}>Back</Text>
                        </Pressable>
                    ) : (
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>Select Book</Text>
                    )}
                    <Pressable onPress={() => setMenuOpen(false)}>
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
                                    className={`flex-1 py-2 rounded-md items-center justify-center ${activeTab === tab ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
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
                                    className={`flex-row justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 ${currentBookId === book.title ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                >
                                    <Text style={{ 
                                        color: currentBookId === book.title ? theme.tint : theme.text,
                                        fontSize: 16,
                                        fontWeight: currentBookId === book.title ? 'bold' : 'normal'
                                    }}>
                                        {book.title}
                                    </Text>
                                    <ChevronRight size={16} color={Colors.gray} />
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
                        <View className="flex-row flex-wrap gap-3 justify-center">
                            {selectedMenuBook.chapters.map((ch: any) => (
                                <Pressable
                                    key={ch.number}
                                    onPress={() => handleChapterSelect(ch.number)}
                                    style={{
                                        width: (width - 60) / 5,
                                        aspectRatio: 1,
                                        backgroundColor: currentBookId === selectedMenuBook.title && currentChapterNum === ch.number ? theme.tint : (colorScheme === 'dark' ? '#333' : '#f0f0f0'),
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 8,
                                    }}
                                >
                                    <Text style={{ 
                                        color: currentBookId === selectedMenuBook.title && currentChapterNum === ch.number ? '#fff' : theme.text,
                                        fontWeight: 'bold' 
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
                <View style={{ backgroundColor: theme.background, borderRadius: 16, overflow: 'hidden' }}>
                    <View className="p-4 border-b border-gray-200 dark:border-gray-800 flex-row justify-between items-center bg-gray-50 dark:bg-gray-900">
                        <Text style={{ fontWeight: 'bold', fontSize: 18, color: theme.text }}>Select Version</Text>
                        <Pressable onPress={() => setVersionMenuOpen(false)}>
                            <X size={24} color={theme.text} />
                        </Pressable>
                    </View>
                    <View className="p-4">
                        {Object.values(AVAILABLE_TRANSLATIONS).map((info) => (
                            <Pressable
                                key={info.key}
                                onPress={() => { setVersionKey(info.key); setVersionMenuOpen(false); }}
                                className={`p-4 rounded-xl border mb-2 ${versionKey === info.key ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : 'border-gray-200 dark:border-gray-700'}`}
                            >
                                <View className="flex-row justify-between mb-1">
                                    <Text style={{ fontWeight: 'bold', color: versionKey === info.key ? theme.tint : theme.text }}>
                                        {info.key}
                                    </Text>
                                    {versionKey === info.key && (
                                        <View className="bg-blue-500 px-2 py-0.5 rounded-full">
                                            <Text className="text-white text-xs font-bold">Active</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={{ fontSize: 16, fontFamily: 'serif', color: theme.text, marginBottom: 4 }}>
                                    {info.longName}
                                </Text>
                                <Text style={{ fontSize: 12, color: Colors.gray }}>
                                    {info.description}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    </SafeAreaView>
  );
}
