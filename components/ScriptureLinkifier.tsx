import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { formatReadingHtml } from '@/lib/readingHtml';
import { getPassageHtml, SCRIPTURE_REGEX } from '@/lib/bibleUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextStyle, useWindowDimensions, View } from 'react-native';
import RenderHtml from 'react-native-render-html';

interface ScriptureLinkifierProps {
  text: string;
  className?: string;
  versionKey?: string; // optional override, defaults to stored Bible reader version
  textStyle?: TextStyle;
}

export default function ScriptureLinkifier({ text, className, versionKey, textStyle }: ScriptureLinkifierProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { width, height } = useWindowDimensions();

  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);
  const [resolvedVersion, setResolvedVersion] = useState<string>(versionKey || 'WEB');

  useEffect(() => {
    let isMounted = true;

    const loadVersion = async () => {
      if (versionKey) {
        setResolvedVersion(versionKey);
        return;
      }

      try {
        const stored = await AsyncStorage.getItem('bible_version');
        if (stored && isMounted) {
          setResolvedVersion(stored);
        }
      } catch (err) {
        // Silently fall back to default on storage errors
      }
    };

    loadVersion();

    return () => {
      isMounted = false;
    };
  }, [versionKey]);

  const parts = useMemo(() => {
    if (!text) return [] as Array<string | { ref: string; key: number }>;
    const tokens: Array<string | { ref: string; key: number }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    SCRIPTURE_REGEX.lastIndex = 0;
    while ((match = SCRIPTURE_REGEX.exec(text)) !== null) {
      if (match.index > lastIndex) tokens.push(text.substring(lastIndex, match.index));
      tokens.push({ ref: match[0], key: match.index });
      lastIndex = SCRIPTURE_REGEX.lastIndex;
    }
    if (lastIndex < text.length) tokens.push(text.substring(lastIndex));
    return tokens;
  }, [text]);

  const baseTextStyle = useMemo<TextStyle[]>(
    () => ([{ color: theme.text } as TextStyle, textStyle].filter(Boolean) as TextStyle[]),
    [theme.text, textStyle]
  );

  const handlePress = (ref: string) => {
    const passage = getPassageHtml(ref, resolvedVersion);
    setSelectedRef(ref);
    setSelectedHtml(passage?.html || null);
  };
  const closePassage = () => { setSelectedRef(null); setSelectedHtml(null); };

  return (
    <>
      <Text className={className} style={baseTextStyle}>
        {parts.map((part, idx) =>
          typeof part === 'string' ? (
            <Text key={idx} style={baseTextStyle}>
              {part}
            </Text>
          ) : (
            <Text
              key={part.key}
              accessibilityRole="link"
              onPress={() => handlePress(part.ref)}
              style={[...baseTextStyle, { color: theme.tint, fontWeight: 'bold' }]}
            >
              {part.ref}
            </Text>
          )
        )}
      </Text>

      <Modal
        visible={!!selectedRef}
        animationType="slide"
        onRequestClose={closePassage}
        transparent
      >
        <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View accessibilityViewIsModal className="rounded-2xl p-5" style={{ backgroundColor: theme.card, maxHeight: height * 0.8 }}>
            <View className="flex-row justify-between items-center mb-3">
              <Text accessibilityRole="header" style={{ color: theme.text, fontWeight: 'bold', fontSize: 16, flex: 1 }}>{selectedRef}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close scripture passage" onPress={closePassage} style={{ minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: theme.muted }}>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>Close</Text>
              </Pressable>
            </View>
            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 12 }}>
            {selectedHtml ? (
              <RenderHtml
                contentWidth={width - 80}
                source={{ html: formatReadingHtml(selectedHtml) }}
                baseStyle={{ color: theme.text, fontFamily: Layout.serif, ...Layout.body }}
                defaultTextProps={{ style: { fontFamily: Layout.serif } }}
                systemFonts={[Layout.serif!]}
                tagsStyles={{
                  sup: { fontSize: 12, color: theme.tint, marginRight: 4 },
                  span: { ...Layout.body, color: theme.text },
                  div: { color: theme.text },
                  p: { marginTop: 0, marginBottom: 14 },
                }}
              />
            ) : (
              <Text style={{ color: theme.mutedForeground, fontSize: 16, lineHeight: 25 }}>This passage could not be loaded in the selected translation. Open the Bible reader to find it.</Text>
            )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
