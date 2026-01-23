import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getPassageHtml, SCRIPTURE_REGEX } from '@/lib/bibleUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, TextStyle, useWindowDimensions, View } from 'react-native';
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
  const { width } = useWindowDimensions();

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

  return (
    <>
      <Text className={className} style={baseTextStyle}>
        {parts.map((part, idx) =>
          typeof part === 'string' ? (
            <Text key={idx} style={baseTextStyle}>
              {part}
            </Text>
          ) : (
            <Pressable
              key={part.key}
              onPress={() => handlePress(part.ref)}
            >
              <Text style={[...baseTextStyle, { color: theme.tint, fontWeight: 'bold' }]}>{part.ref}</Text>
            </Pressable>
          )
        )}
      </Text>

      <Modal
        visible={!!selectedHtml}
        animationType="slide"
        onRequestClose={() => setSelectedHtml(null)}
        transparent
      >
        <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View className="rounded-2xl p-5" style={{ backgroundColor: theme.card }}>
            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>{selectedRef}</Text>
              <Pressable onPress={() => setSelectedHtml(null)} className="px-3 py-1 rounded-full" style={{ backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#e2e8f0' }}>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>Close</Text>
              </Pressable>
            </View>
            {selectedHtml ? (
              <RenderHtml
                contentWidth={width - 60}
                source={{ html: `<div>${selectedHtml}</div>` }}
                tagsStyles={{
                  sup: { fontSize: 12, color: theme.tint, marginRight: 4 },
                  span: { fontSize: 16, lineHeight: 24, color: theme.text },
                  div: { color: theme.text },
                }}
              />
            ) : (
              <Text style={{ color: Colors.gray }}>Unable to load passage.</Text>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
