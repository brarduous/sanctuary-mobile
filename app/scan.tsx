import { useAuth } from '@/context/AuthContext';
import { joinCongregation } from '@/lib/api';
import { extractInviteToken } from '@/lib/inviteToken';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import ScreenState from '@/components/ScreenState';
import Colors from '@/constants/Colors';
import { QrCode, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const focused = useIsFocused();
  const scanInFlight = useRef(false);
  const retryScan = () => { scanInFlight.current = false; setScanned(false); };
  const [scanned, setScanned] = useState(false);
  const [joining, setJoining] = useState(false);
  const theme = Colors[useColorScheme() ?? 'light'];

  const router = useRouter();
  const { user, setUserCongregationId } = useAuth();

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanInFlight.current || !focused) return;
    scanInFlight.current = true;
    setScanned(true);

    try {
      // Accept links like https://sanctuaryapp.us/join?token=UUID and raw token values.
      const token = extractInviteToken(data);

      if (!token) {
        Alert.alert("Invalid QR Code", "This doesn't look like a valid Sanctuary Church invite.", [
          { text: "Try Again", onPress: retryScan }
        ]);
        return;
      }

      if (!user?.id) {
        router.replace(`/join?token=${encodeURIComponent(token)}` as any);
        return;
      }

      setJoining(true);

      // Call the API we created in the last step
      const congId = await joinCongregation(user.id, token);

      // Update global state so the tab instantly appears
      setUserCongregationId(congId);

      Alert.alert(
        "Welcome!",
        "You have successfully joined your digital congregation.",
        [{ text: "Go to My Church", onPress: () => router.replace('/(tabs)/church') }]
      );
    } catch (err: any) {
      Alert.alert("Connection Failed", err.message || "Unable to join this congregation.", [
        { text: "Try Again", onPress: retryScan }
      ]);
    } finally {
      setJoining(false);
    }
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: theme.background }}><Stack.Screen options={{ title: 'Scan invite' }} /><ScreenState title="Preparing scanner" loading /></View>;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 28, backgroundColor: theme.background }}>
        <Stack.Screen options={{ title: 'Scan invite' }} />
        <QrCode size={36} color={theme.tint} />
        <Text style={{ color: theme.text, fontSize: 24, fontWeight: '700', marginTop: 20, marginBottom: 12 }}>Connect with your church</Text>
        <Text style={{ color: theme.mutedForeground, fontSize: 16, lineHeight: 25 }}>Scan the invite code your church provides. Allow camera access to use the scanner.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => { void (permission.canAskAgain ? requestPermission() : Linking.openSettings()).catch(() => Alert.alert('Camera unavailable', 'Please enable camera access in Settings.')); }}
          style={{ alignSelf: 'flex-start', minHeight: 48, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 14, backgroundColor: theme.action, marginTop: 24 }}
        >
          <Text style={{ color: theme.onAction, fontWeight: '700', fontSize: 15 }}>{permission.canAskAgain ? 'Allow camera' : 'Open Settings'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {focused && <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <SafeAreaView style={styles.overlay}>
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-4">
            <View className="flex-row items-center bg-black/50 px-4 py-2 rounded-full">
              <QrCode size={18} color="white" />
              <Text className="text-white font-bold ml-2">Scan Invite Code</Text>
            </View>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
              accessibilityRole="button"
              accessibilityLabel="Close scanner"
              style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              <X size={24} color="white" />
            </Pressable>
          </View>

          {/* Center Target Area */}
          <View className="flex-1 items-center justify-center">
            <View className="w-64 h-64 border-2 border-white/50 rounded-3xl items-center justify-center">
              {joining ? (
                <View className="items-center bg-black/70 p-6 rounded-2xl">
                  <ActivityIndicator size="large" color="white" />
                  <Text className="text-white mt-4 font-bold">Connecting to Church...</Text>
                </View>
              ) : (
                <View className="w-full h-full rounded-3xl border-4 border-brand-500" style={{ borderStyle: 'dashed' }} />
              )}
            </View>
          </View>

          {/* Footer Text */}
          <View className="pb-12 px-8">
            <Text className="text-white text-center text-lg shadow-black">
              Ask your Pastor for your church's QR code to connect your account.
            </Text>
          </View>
        </SafeAreaView>
      </CameraView>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }
});
