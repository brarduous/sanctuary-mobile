import { logActivityEvent, logErrorEvent } from '@/lib/activityLogger';
import { fetchUserCongregation, fetchUserProfile, setAuthToken } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { discoverySessionId, discoveryStore, sendDiscoveryCompletions } from '@/lib/discoveries';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const activeUserId = useRef<string | null>(null);
  const authRevision = useRef(0);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoadError, setProfileLoadError] = useState<unknown>(null);
  const [userCongregationId, setUserCongregationId] = useState<number | null>(null); // <-- NEW
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const revision = authRevision.current;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted || revision !== authRevision.current) return;

        activeUserId.current = session?.user?.id ?? null;
        setAuthToken(session?.access_token ?? null);
        setUser(session?.user ?? null);
        if (session?.user) {
          setLoading(true);
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setProfileLoadError(null);
          setUserCongregationId(null);
          setLoading(false);
        }
        void logActivityEvent({
          userId: session?.user?.id,
          activityType: 'auth_session_checked',
          description: session?.user ? 'Active session found' : 'No active session',
        });
      } catch (error) {
        if (!mounted || revision !== authRevision.current) return;
        activeUserId.current = null;
        setAuthToken(null);
        setUser(null);
        setProfile(null);
        setProfileLoadError(error);
        setUserCongregationId(null);
        setLoading(false);
      }
    };

    restoreSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthToken(session?.access_token ?? null);

      if (event === 'INITIAL_SESSION') {
        return;
      }

      authRevision.current += 1;
      const nextUserId = session?.user?.id ?? null;
      if (activeUserId.current !== nextUserId) {
        setProfile(null);
        setUserCongregationId(null);
      }
      activeUserId.current = nextUserId;
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        // Supabase invokes auth listeners while holding its auth lock. Defer any
        // work that may call another auth method until after this callback returns.
        setTimeout(() => {
          if (!mounted) return;

          void loadProfile(session.user.id);
          void logActivityEvent({
            userId: session.user.id,
            activityType: 'auth_state_changed',
            activityId: event,
            description: 'Signed in',
          });
        }, 0);
      } else if (!session?.user) {
        setProfile(null);
        setProfileLoadError(null);
        setUserCongregationId(null);
        setLoading(false);
        setTimeout(() => {
          if (!mounted) return;

          void logActivityEvent({
            activityType: 'auth_state_changed',
            activityId: event,
            description: 'Signed out',
          });
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const refreshProfileQuietly = async () => {
      try {
        await loadProfile(user.id, { silent: true });
      } catch (error) {
        console.error('Background profile refresh failed:', error);
      }
    };

    // Pull latest profile periodically so admin whitelist/tier DB edits are reflected in-app.
    const interval = setInterval(() => {
      refreshProfileQuietly();
    }, 60000);

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshProfileQuietly();
      }
    });

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [user?.id]);

  const loadProfile = async (userId: string, options?: { silent?: boolean }) => {
    try {
      if (activeUserId.current !== userId) return;
      setProfileLoadError(null);
      const [data, congregationId] = await Promise.all([fetchUserProfile(userId), fetchUserCongregation(userId)]);
      if (activeUserId.current !== userId) return;
      setProfile(data);
      setUserCongregationId(congregationId);
      if (!options?.silent) {
        await logActivityEvent({
          userId,
          activityType: 'profile_loaded',
          description: data ? 'Profile loaded' : 'Profile missing',
        });
      }
    } catch (error) {
      if (activeUserId.current !== userId) return;
      setProfileLoadError(error);
      if (!options?.silent) {
        await logErrorEvent('profile_load_error', error, { userId });
      }
    }
    finally {
      if (activeUserId.current === userId) setLoading(false);
    }
  };
  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  const applySession = async (session: any) => {
    activeUserId.current = session?.user?.id ?? null;
    setUser(session?.user ?? null);

    if (session?.user) {
      await loadProfile(session.user.id);
      return;
    }

    setProfile(null);
    setProfileLoadError(null);
    setUserCongregationId(null);
    setLoading(false);
  };

  // --- APPLE SIGN IN ---
  const signInWithApple = async () => {
    await logActivityEvent({ activityType: 'apple_sign_in_started', description: 'User tapped Apple sign-in' });
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      await logActivityEvent({
        activityType: 'apple_sign_in_credential_received',
        activityId: credential.user ?? null,
        description: credential.identityToken ? 'Identity token received' : 'Missing identity token',
      });

      if (credential.identityToken) {
        const { data: signInData, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        if (error) throw error;

        const session = signInData.session ?? (await supabase.auth.getSession()).data.session;
        await applySession(session);
        await logActivityEvent({
          userId: session?.user?.id,
          activityType: 'apple_sign_in_success',
          description: 'Supabase session created via Apple',
        });
      } else {
        await logActivityEvent({
          activityType: 'apple_sign_in_no_token',
          description: 'Apple credential did not include identity token',
        });
        setLoading(false);
      }
    } catch (e: any) {
      if (e?.code === 'ERR_REQUEST_CANCELED') {
        setLoading(false);
        await logActivityEvent({ activityType: 'apple_sign_in_cancelled', description: 'User cancelled Apple sign-in' });
        return;
      }

      setLoading(false);
      await logErrorEvent('apple_sign_in_error', e);
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // handle that the user canceled the sign-in flow
      } else {
        // handle other errors
      }
    }
  };

  // --- GOOGLE SIGN IN ---
  const signInWithGoogle = async () => {
    await logActivityEvent({ activityType: 'google_sign_in_started', description: 'User tapped Google sign-in' });
    try {
      setLoading(true);
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
      if (!webClientId || (Platform.OS === 'ios' && !iosClientId)) {
        throw new Error('Google Sign-In configuration is missing for this build.');
      }
      // Keep native configuration errors inside the sign-in flow. The SDK's
      // signIn method awaits its configuration promise and propagates failures.
      GoogleSignin.configure({ webClientId, iosClientId, offlineAccess: false });
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      await logActivityEvent({
        activityType: 'google_sign_in_token_received',
        description: userInfo.data?.idToken ? 'ID token received' : 'No ID token in response',
      });

      if (userInfo.data?.idToken) {
        const { data: signInData, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });
        if (error) throw error;

        const session = signInData.session ?? (await supabase.auth.getSession()).data.session;
        await applySession(session);
        await logActivityEvent({
          userId: session?.user?.id,
          activityType: 'google_sign_in_success',
          description: 'Supabase session created via Google',
        });
      } else {
        await logActivityEvent({
          activityType: 'google_sign_in_no_token',
          description: 'Google sign-in succeeded but no ID token returned',
        });
        setLoading(false);
      }
    } catch (error: any) {
      setLoading(false);

      // Enhanced error diagnostics for DEVELOPER_ERROR (Android)
      const errorDescription = error?.message || String(error);
      const isDeveloperError = errorDescription.includes('DEVELOPER_ERROR') || errorDescription.includes('error 10');
      const isSimulatorKeychainError = Platform.OS === 'ios' && errorDescription.toLowerCase().includes('keychain');

      console.warn('Google Sign In Error', errorDescription);

      if (isDeveloperError) {
        await logErrorEvent('google_sign_in_developer_error_android', error, {
          userId: user?.id
        });
      } else {
        await logErrorEvent('google_sign_in_error', error);
      }

      Alert.alert(
        'Unable to sign in with Google',
        isSimulatorKeychainError
          ? 'Google Sign-In cannot access the keychain in this simulator build. Use Apple Sign-In or try again on a physical device.'
          : 'Please try again. If the problem continues, use another sign-in method.',
      );
    }
  };

  const signOut = async () => {
    const currentUserId = user?.id ?? profile?.user_id ?? null;
    if (currentUserId) {
      try {await discoveryStore.sync(currentUserId,discoverySessionId,events => sendDiscoveryCompletions(currentUserId,events));} catch { /* Offline completions remain persisted until the user chooses. */ }
      let pending=0, unreadable=false;
      try {pending=Object.keys((await discoveryStore.progress(currentUserId)).pending).length;} catch {unreadable=true;}
      if (pending || unreadable) {
        const notice=unreadable ? 'Local discovery progress could not be read. Signing out removes it from this device. Your synced discoveries remain saved to your account.' : `${pending} ${pending===1 ? 'discovery is' : 'discoveries are'} saved only on this device. Signing out removes this unsynced progress.`;
        const confirmed = await new Promise<boolean>(resolve => Alert.alert('Discoveries haven’t synced',notice,[
          {text:'Stay signed in',style:'cancel',onPress:() => resolve(false)},
          {text:'Sign out',style:'destructive',onPress:() => resolve(true)},
        ],{cancelable:true,onDismiss:() => resolve(false)}));
        if (!confirmed) return;
      }
    }
    await logActivityEvent({ userId: currentUserId, activityType: 'sign_out_started' });
    try {
      await supabase.auth.signOut();
      if (currentUserId) await discoveryStore.clearAccount(currentUserId);
      await logActivityEvent({ userId: currentUserId, activityType: 'sign_out_success' });
    } catch (error) {
      await logErrorEvent('sign_out_error', error, { userId: currentUserId });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, profileLoadError, userCongregationId, setUserCongregationId, loading, signInWithApple, signInWithGoogle, signOut, refreshProfile}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
