import { Audio } from 'expo-av';
import { Mic } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from 'react-native';

interface AudioMicButtonProps {
  onTranscription: (text: string) => void;
  tintColor: string;
}

export default function AudioMicButton({ onTranscription, tintColor }: AudioMicButtonProps) {
  const [isRecordingState, setIsRecordingState] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use a ref to prevent race conditions if the user releases the button too quickly
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isPressingRef = useRef(false);
  
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  useEffect(() => {
    if (!permissionResponse) {
       requestPermission();
    }
  }, [permissionResponse, requestPermission]);

  async function startRecording() {
    isPressingRef.current = true;
    try {
      if (permissionResponse?.status !== 'granted') {
        const response = await requestPermission();
        if (response.status !== 'granted') {
             Alert.alert("Permission Denied", "Please grant microphone access to record your request.");
             isPressingRef.current = false;
             return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      // If the user already let go of the button before initialization finished, stop immediately
      if (!isPressingRef.current) {
         await recording.stopAndUnloadAsync();
         return;
      }

      recordingRef.current = recording;
      setIsRecordingState(true);
      
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording.');
      isPressingRef.current = false;
    }
  }

  async function stopRecording() {
    isPressingRef.current = false;
    const recording = recordingRef.current;
    
    if (!recording) return;
    
    recordingRef.current = null;
    setIsRecordingState(false);
    setIsProcessing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) throw new Error("No audio URI found");

      const formData = new FormData();
      const filename = uri.split('/').pop() || 'recording.m4a';
      
      formData.append('file', {
        uri: uri,
        name: filename,
        type: 'audio/m4a', 
      } as any);

      // Defaulting to your cloud backend or process.env
      const apiUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://api.sanctuaryapp.us';

      const response = await fetch(`${apiUrl}/api/transcribe`, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.text) {
        onTranscription(data.text);
      } else {
        throw new Error(data.error || "Failed to transcribe");
      }
    } catch (error: any) {
      console.error("Transcription error:", error);
      Alert.alert("Error", error.message || "Could not transcribe audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <TouchableOpacity
      onPressIn={startRecording}
      onPressOut={stopRecording}
      disabled={isProcessing}
      activeOpacity={0.8}
      // Using standard inline styles bypasses the NativeWind/Reanimated crash bug
      style={[
        styles.button,
        isRecordingState ? styles.recording : styles.idle
      ]}
    >
      {isProcessing ? (
        <ActivityIndicator size="small" color={tintColor} />
      ) : (
        <Mic size={20} color={isRecordingState ? 'white' : tintColor} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idle: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)', // Indigo 50 equivalent
  },
  recording: {
    backgroundColor: '#ef4444', // Red 500
    transform: [{ scale: 1.1 }],
  }
});