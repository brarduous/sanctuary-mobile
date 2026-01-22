import { useAuth } from '@/context/AuthContext';
import { generateContent } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Send, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, LayoutAnimation, Pressable, Text, TextInput, View } from 'react-native';
import GeneratingState from './GeneratingState';

export default function ChristianAdviceCard({ limitReached }: { limitReached?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();

  const [situation, setSituation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async () => {
    if (!situation.trim() || !user || isSubmitting) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSubmitting(true);
    
    try {
      const result = await generateContent('/generate-advice', {
        userId: user.id,
        situation: situation,
      });

      if (result && result.adviceId) {
        setIsSubmitting(false); // Reset state before nav (or not, but safer here)
        router.push(`/advice/${result.adviceId}`);
      } else {
        setIsSubmitting(false);
        Alert.alert("Error", "Could not generate advice. Please try again.");
      }
    } catch (error) {
      console.error("Error generating advice:", error);
      setIsSubmitting(false);
      Alert.alert("Error", "Could not generate advice. Please try again.");
    }
  };

  return (
    <View className="w-full mb-8">
      <View className="flex-row items-center gap-2 mb-3">
        <Sparkles size={16} color="#CA8A04" />
        <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Spiritual Guidance</Text>
      </View>

      <View className={`bg-white rounded-[24px] shadow-sm border overflow-hidden transition-all ${isFocused ? 'border-[#D4A373]/30' : 'border-slate-100'}`}>
        {isSubmitting ? (
          <GeneratingState className="border-0" />
        ) : (
          <View>
            <TextInput
              value={situation}
              onChangeText={setSituation}
              onFocus={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setIsFocused(true);
              }}
              onBlur={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setIsFocused(false);
              }}
              placeholder="What's weighing on your heart today? Get scripture-based advice for you or a loved one."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              className="w-full p-5 min-h-[140px] text-lg text-slate-900 font-serif leading-relaxed"
              editable={!limitReached}
            />

            {situation.length > 0 && (
              <View className="flex-row justify-between items-center px-4 pb-4 pt-2">
                <Text className="text-xs text-slate-400 font-medium ml-2">
                  {situation.length} characters
                </Text>

                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitting || limitReached}
                  className="bg-[#D4A373] px-5 py-3 rounded-full flex-row items-center gap-2 shadow-sm active:opacity-90"
                >
                  <Text className="text-white font-bold text-sm">Ask Advice</Text>
                  <Send size={14} color="white" />
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>

      {!isSubmitting && (
        <Text className="text-center text-xs text-slate-400 mt-3 mx-4 leading-relaxed">
          Receive scripture-based wisdom tailored to your specific situation.
        </Text>
      )}
    </View>
  );
}
