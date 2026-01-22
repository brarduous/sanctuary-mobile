import { useRevenueCat } from '@/context/RevenueCatContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaywallScreen() {
  const { packages, purchasePackage, isPro, restorePurchases } = useRevenueCat();
  const router = useRouter();
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    if (isPro) {
        Alert.alert("Success", "You are already a Pro member!");
        router.back();
    }
  }, [isPro]);

  const onPurchase = async (pack: any) => {
    setIsPurchasing(true);
    try {
      await purchasePackage(pack);
    } catch (e: any) {
      console.log(e);
    } finally {
      setIsPurchasing(false);
    }
  };

  const onRestore = async () => {
    setIsPurchasing(true);
    try {
      await restorePurchases();
      Alert.alert("Restore", "Purchases restored successfully.");
    } finally {
        setIsPurchasing(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 p-6">
      <TouchableOpacity onPress={() => router.back()} className="mb-4">
         <Ionicons name="close" size={28} color="gray" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="items-center mb-8">
            <Text className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2 text-center">
                Upgrade to Sanctuary Pro
            </Text>
            <Text className="text-center text-slate-600 dark:text-slate-400">
                Unlock unlimited AI guidance, deeper devotionals, and more.
            </Text>
        </View>

        {packages.length === 0 ? (
            <View className="py-10">
                <ActivityIndicator size="large" />
                <Text className="text-center text-gray-400 mt-4">Loading offerings...</Text>
            </View>
        ) : (
            <View className="gap-4">
                {packages.map((pack) => (
                    <TouchableOpacity
                        key={pack.identifier}
                        onPress={() => onPurchase(pack)}
                        disabled={isPurchasing}
                        className={`p-6 rounded-2xl border-2 ${isPurchasing ? 'opacity-50' : ''} border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900`}
                    >
                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="font-bold text-lg text-slate-900 dark:text-white">
                                    {pack.product.title}
                                </Text>
                                <Text className="text-slate-500 dark:text-slate-400">
                                    {pack.product.description}
                                </Text>
                            </View>
                             <Text className="font-bold text-lg text-amber-600">
                                {pack.product.priceString}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        )}
        
        <TouchableOpacity onPress={onRestore} className="mt-8">
            <Text className="text-center text-slate-400 underline">Restore Purchases</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
