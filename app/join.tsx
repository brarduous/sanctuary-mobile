import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import ScreenState from '@/components/ScreenState';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { useAuth } from '@/context/AuthContext';
import { joinCongregation } from '@/lib/api';
import { extractInviteToken } from '@/lib/inviteToken';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Church, XCircle } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type JoinStatus = 'idle' | 'joining' | 'joined' | 'error';

export default function JoinScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const {
    user,
    loading,
    setUserCongregationId,
    signInWithApple,
    signInWithGoogle,
  } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<JoinStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const token = useMemo(() => {
    const value = params.token;
    return extractInviteToken(Array.isArray(value) ? value[0] : value);
  }, [params.token]);

  useEffect(() => {
    if (loading || !user || !token) {
      return;
    }

    let cancelled = false;

    const join = async () => {
      setStatus('joining');
      setErrorMessage(null);

      try {
        const congregationId = await joinCongregation(user.id, token);
        if (cancelled) return;

        setUserCongregationId(congregationId);
        setStatus('joined');
      } catch (error: any) {
        if (cancelled) return;

        setStatus('error');
        setErrorMessage(error?.message || 'Unable to join this congregation.');
      }
    };

    void join();

    return () => {
      cancelled = true;
    };
  }, [loading, setUserCongregationId, attempt, token, user]);

  const goToChurch = () => router.replace('/(tabs)/church');

  if (!token) return <ScreenState title="This invite is incomplete" message="Ask your church for a new invite link, or scan the code they provide." onRetry={() => router.replace('/(tabs)')} actionLabel="Back to Sanctuary" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View className="flex-1 justify-center px-6">
        <View className="items-center">
          <View
            className="h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.accentSoft }}
          >
            {status === 'joined' ? (
              <CheckCircle2 size={42} color={colorScheme === 'dark' ? '#6EE7B7' : '#047857'} />
            ) : status === 'error' ? (
              <XCircle size={42} color={colorScheme === 'dark' ? '#FCA5A5' : '#B91C1C'} />
            ) : (
              <Church size={42} color={theme.tint} />
            )}
          </View>

          <Text accessibilityRole="header" className="mt-8 text-center text-3xl font-extrabold" style={{ color: theme.text }}>
            {status === 'joined'
              ? 'You joined your church'
              : status === 'error'
                ? 'Invite could not be used'
                : 'Join your church'}
          </Text>

          <Text className="mt-4 text-center text-base leading-6" style={{ color: theme.mutedForeground }}>
            {loading
              ? 'Checking your account...'
              : !user
                ? 'Sign in to connect this invite to your Sanctuary account.'
                : status === 'joining'
                  ? 'Connecting you to your digital congregation...'
                  : status === 'joined'
                    ? 'Your congregation is now connected in Sanctuary.'
                    : errorMessage || 'This invite is ready to connect.'}
          </Text>

          <View className="mt-10 w-full gap-3">
            {loading || status === 'joining' ? (
              <View className="items-center py-4">
                <ActivityIndicator size="large" color={theme.tint} />
              </View>
            ) : !user ? (
              <>
                {Platform.OS === 'ios' && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={colorScheme === 'dark' ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={12}
                    onPress={signInWithApple}
                    style={{ width: '100%', height: 56 }}
                  />
                )}
                <GoogleSignInButton onPress={signInWithGoogle} />
              </>
            ) : status === 'joined' ? (
              <Pressable
                onPress={goToChurch}
                accessibilityRole="button"
                style={{ alignItems: 'center', justifyContent: 'center', borderRadius: 14, minHeight: 52, padding: 16, backgroundColor: theme.action }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.onAction }}>Go to My Church</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => { setStatus('idle'); setAttempt(n => n + 1); }}
                accessibilityRole="button"
                style={{ alignItems: 'center', justifyContent: 'center', borderRadius: 14, minHeight: 52, padding: 16, backgroundColor: theme.action }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.onAction }}>Try again</Text>
              </Pressable>
            )}

            <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)')} className="items-center py-4">
              <Text style={{ color: theme.mutedForeground, fontWeight: '600' }}>Back to Sanctuary</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
