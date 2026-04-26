import { useAuth } from '@/context/AuthContext';
import { joinCongregation } from '@/lib/api';
import { extractInviteToken } from '@/lib/inviteToken';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { QrCode, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [joining, setJoining] = useState(false);
  
  const router = useRouter();
  const { user, setUserCongregationId } = useAuth();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned || joining) return;
    setScanned(true);

    try {
      // Accept links like https://sanctuaryapp.us/join?token=UUID and raw token values.
      const token = extractInviteToken(data);

      if (!token) {
        Alert.alert("Invalid QR Code", "This doesn't look like a valid Sanctuary Church invite.", [
          { text: "Try Again", onPress: () => setScanned(false) }
        ]);
        return;
      }

      if (!user?.id) {
        router.push(`/join?token=${encodeURIComponent(token)}` as any);
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
        { text: "Try Again", onPress: () => setScanned(false) }
      ]);
    } finally {
      setJoining(false);
    }
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-lg mb-6 dark:text-white">
          We need your permission to show the camera to scan the invite code.
        </Text>
        <Pressable 
          onPress={requestPermission} 
          className="bg-indigo-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold text-lg">Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
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
              onPress={() => router.back()} 
              className="bg-black/50 p-2 rounded-full"
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
                <View className="w-full h-full rounded-3xl border-4 border-indigo-500" style={{ borderStyle: 'dashed' }} />
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
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }
});