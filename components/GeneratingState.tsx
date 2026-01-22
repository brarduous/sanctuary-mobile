import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

const GeneratingState = ({ className = "" }: { className?: string }) => (
  <View className={`bg-white p-8 rounded-[24px] items-center justify-center border border-slate-100 min-h-[240px] ${className}`}>
    <ActivityIndicator size="large" color="#D4A373" className="mb-6" />
    <Text className="text-xl font-serif text-slate-900 font-bold mb-2">Creating your devotional</Text>
    <Text className="text-slate-500 text-center text-sm px-4">
      Reflecting on scripture and preparing a word for you...
    </Text>
  </View>
);

export default GeneratingState;
