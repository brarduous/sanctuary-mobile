import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { joinCongregation } from '@/lib/api';
import { extractInviteToken } from '@/lib/inviteToken';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Church, LogIn, XCircle } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
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
  const [status, setStatus] = useState<JoinStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const token = useMemo(() => {
    const value = params.token;
    return extractInviteToken(Array.isArray(value) ? value[0] : value);
  }, [params.token]);

  useEffect(() => {
    if (loading || !user || !token || status === 'joining' || status === 'joined') {
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
  }, [loading, setUserCongregationId, status, token, user]);

  useEffect(() => {
    if (!token) {
      Alert.alert('Invalid Invite', "This invite link doesn't include a valid token.", [
        { text: 'Go Home', onPress: () => router.replace('/(tabs)') },
      ]);
    }
  }, [router, token]);

  const goToChurch = () => router.replace('/(tabs)/church');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View className="flex-1 justify-center px-6">
        <View className="items-center">
          <View
            className="h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: status === 'error' ? '#FEE2E2' : '#E0E7FF' }}
          >
            {status === 'joined' ? (
              <CheckCircle2 size={42} color="#059669" />
            ) : status === 'error' ? (
              <XCircle size={42} color="#DC2626" />
            ) : (
              <Church size={42} color="#4F46E5" />
            )}
          </View>

          <Text className="mt-8 text-center text-3xl font-extrabold" style={{ color: theme.text }}>
            {status === 'joined'
              ? 'You joined your church'
              : status === 'error'
                ? 'Invite could not be used'
                : 'Join your church'}
          </Text>

          <Text className="mt-4 text-center text-base leading-6 text-slate-500">
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
                  <Pressable
                    onPress={signInWithApple}
                    className="flex-row items-center justify-center rounded-xl bg-black px-5 py-4"
                  >
                    <LogIn size={18} color="white" />
                    <Text className="ml-2 text-base font-bold text-white">Continue with Apple</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={signInWithGoogle}
                  className="flex-row items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-4"
                >
                  <LogIn size={18} color="#334155" />
                  <Text className="ml-2 text-base font-bold text-slate-700">Continue with Google</Text>
                </Pressable>
              </>
            ) : status === 'joined' ? (
              <Pressable
                onPress={goToChurch}
                className="items-center justify-center rounded-xl bg-indigo-600 px-5 py-4"
              >
                <Text className="text-base font-bold text-white">Go to My Church</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setStatus('idle')}
                className="items-center justify-center rounded-xl bg-indigo-600 px-5 py-4"
              >
                <Text className="text-base font-bold text-white">Try Again</Text>
              </Pressable>
            )}

            <Pressable onPress={() => router.replace('/(tabs)')} className="items-center py-4">
              <Text className="font-semibold text-slate-500">Back to Sanctuary</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
