import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { logActivityEvent } from '@/lib/activityLogger';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const { signInWithGoogle, signInWithApple, loading } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    useEffect(() => {
        void logActivityEvent({ activityType: 'login_screen_viewed', description: 'Login screen mounted' });
    }, []);

    const handleApplePress = async () => {
        void logActivityEvent({ activityType: 'login_apple_pressed' });
        await signInWithApple();
    };

    const handleGooglePress = async () => {
        void logActivityEvent({ activityType: 'login_google_pressed' });
        await signInWithGoogle();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: 24 }}>
                <View style={{ paddingHorizontal: 28, alignItems: 'center', marginBottom: 28 }}>
                    <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: theme.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                        <BookOpen size={36} color={theme.tint} />
                    </View>
                    <Text style={{ fontSize: 32, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: theme.text, textAlign: 'center', marginBottom: 12 }}>Make room for faith.</Text>
                    <Text style={{ fontSize: 17, lineHeight: 26, color: theme.mutedForeground, textAlign: 'center' }}>Scripture, daily reflection, and guidance for your walk with God.</Text>
                </View>
            {/* Auth Section */}
            <Animated.View
                entering={FadeInUp.delay(300).springify()}
                style={{

                    backgroundColor: theme.background,
                    paddingHorizontal: 24,
                    paddingBottom: 12,
                    justifyContent: 'center',
                    gap: 16
                }}
            >
                {loading ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center', height: 100 }}>
                        <ActivityIndicator size="large" color={theme.tint} />
                        <Text style={{ marginTop: 12, color: theme.text }}>Signing in...</Text>
                    </View>
                ) : (
                    <>
                        <View style={{ alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{ fontSize: 16, color: theme.text, fontWeight: '500' }}>Get started:</Text>
                        </View>

                        {/* Apple Button - iOS Only */}
                        {Platform.OS === 'ios' && (
                            <AppleAuthentication.AppleAuthenticationButton
                                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                                buttonStyle={colorScheme === 'dark'
                                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                                cornerRadius={12}
                                onPress={handleApplePress}
                                style={{
                                    width: '100%',
                                    height: 56,
                                }}
                            />
                        )}

                        {/* Google Button - All Platforms */}
                        <GoogleSignInButton onPress={handleGooglePress} />

                        <Pressable
                            accessibilityRole="button"
                            onPress={() => router.replace('/(tabs)')}
                            className="mt-4 p-4 items-center"
                        >
                            <Text style={{ color: theme.mutedForeground, fontSize: 16, fontWeight: '600' }}>Continue as Guest</Text>
                        </Pressable>

                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                            <Text style={{ color: theme.mutedForeground, textAlign: 'center', fontSize: 13, lineHeight: 20, paddingHorizontal: 4 }}>
                                By continuing, you agree to our Terms of Service and Privacy Policy.
                            </Text>
                        </View>
                    </>
                )}
            </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}
