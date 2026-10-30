import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { useRouter } from 'expo-router';
import { Check, Crown, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaywallScreen() {
  const { packages, purchasePackage, isPro, restorePurchases, isLoaded, loadOfferings } = useRevenueCat();
  const theme = Colors[useColorScheme() ?? 'light'];
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const actionInFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const selected = packages.find(pack => pack.identifier === selectedId) || packages[0];
  useEffect(() => { if (isPro) { if (router.canGoBack()) router.back(); else router.replace('/'); } }, [isPro, router]);
  const purchase = async () => {
    if (!selected || actionInFlight.current) return;
    actionInFlight.current = true;
    setBusy(true);
    try { await purchasePackage(selected); }
    catch { Alert.alert('Purchase unavailable', 'Please try again. Your subscription has not changed.'); }
    finally { actionInFlight.current = false; setBusy(false); }
  };
  const restore = async () => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setBusy(true);
    try { await restorePurchases(); }
    catch (error: any) {
      if (!error?.userCancelled) Alert.alert('Unable to restore', 'Restore purchases is unavailable right now. Please try again later.');
    }
    finally { actionInFlight.current = false; setBusy(false); }
  };
  const period = (type: string) => ({ MONTHLY: 'month', ANNUAL: 'year', WEEKLY: 'week', SIX_MONTH: '6 months', THREE_MONTH: '3 months', TWO_MONTH: '2 months' }[type]);
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} accessibilityRole="button" accessibilityLabel="Close subscription plans" disabled={busy} accessibilityState={{ disabled: busy }} style={{ alignSelf: 'flex-end', padding: 14, marginRight: 10 }}><X size={24} color={theme.text} /></Pressable>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}>
      <Crown size={32} color={theme.tint} />
      <Text accessibilityRole="header" style={{ ...Typography.screenTitle, fontFamily: Layout.serif, color: theme.text, marginTop: 16 }}>Go deeper with Sanctuary Pro</Text>
      <Text style={{ fontSize: 17, lineHeight: 26, color: theme.mutedForeground, marginVertical: 16 }}>Personalized devotionals and guidance for your daily walk.</Text>
      {['Personalized daily reflections', 'More spiritual guidance', 'Prayer and scripture for your journey'].map(benefit => <View key={benefit} style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}><Check size={18} color={theme.tint} /><Text style={{ flex: 1, fontSize: 16, color: theme.text }}>{benefit}</Text></View>)}
      {!isLoaded ? <ActivityIndicator style={{ marginVertical: 32 }} color={theme.tint} /> : !packages.length ? <View style={{ paddingVertical: 24 }}><Text style={{ color: theme.mutedForeground, fontSize: 16, lineHeight: 24 }}>Plans are unavailable right now. Please try again.</Text><Pressable onPress={loadOfferings} accessibilityRole="button" style={{ paddingVertical: 16 }}><Text style={{ color: theme.tint, fontWeight: '600' }}>Reload plans</Text></Pressable></View> : <View style={{ gap: 12, marginTop: 16 }}>
        {packages.map(pack => <Pressable key={pack.identifier} onPress={() => setSelectedId(pack.identifier)} disabled={busy} accessibilityRole="radio" accessibilityState={{ checked: selected?.identifier === pack.identifier }} style={{ padding: 20, borderRadius: 18, borderWidth: 2, borderColor: selected?.identifier === pack.identifier ? theme.tint : theme.border, backgroundColor: selected?.identifier === pack.identifier ? theme.accentSoft : theme.card }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text }}>{pack.product.title}</Text>
          <Text style={{ fontSize: 17, fontWeight: '600', color: theme.tint, marginTop: 8 }}>{pack.product.priceString}{period(pack.packageType) ? ` / ${period(pack.packageType)}` : ''}</Text>
          {pack.product.description?.trim() ? <Text style={{ fontSize: 14, lineHeight: 21, color: theme.mutedForeground, marginTop: 8 }}>{pack.product.description}</Text> : null}
        </Pressable>)}
        <Text style={{ fontSize: 13, lineHeight: 20, color: theme.mutedForeground, marginVertical: 8 }}>Subscriptions renew automatically unless canceled in your account settings. Review final billing terms in the App Store or Google Play confirmation.</Text>
      </View>}
    </ScrollView>
    <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.background }}>
      {isLoaded && selected ? <Pressable onPress={purchase} disabled={busy} accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} style={{ minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.action, borderRadius: 14, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}>{busy ? <ActivityIndicator color={theme.onAction} /> : <Text style={{ color: theme.onAction, fontWeight: '700', fontSize: 16, textAlign: 'center' }}>Continue with selected plan</Text>}</Pressable> : null}
      <Pressable onPress={restore} disabled={busy} accessibilityRole="button" accessibilityState={{ disabled: busy }} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: selected ? 4 : 0 }}><Text style={{ color: theme.tint, fontSize: 15 }}>Restore purchases</Text></Pressable>
    </View>
  </SafeAreaView>;
}
