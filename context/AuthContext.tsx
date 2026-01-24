import { logActivityEvent, logErrorEvent } from '@/lib/activityLogger';
import { fetchUserProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Configure Google Sign-In (Get Web Client ID from Google Cloud Console)
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, 
});

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      void logActivityEvent({
        userId: session?.user?.id,
        activityType: 'auth_session_checked',
        description: session?.user ? 'Active session found' : 'No active session',
      });
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
      void logActivityEvent({
        userId: session?.user?.id,
        activityType: 'auth_state_changed',
        description: session?.user ? 'Signed in' : 'Signed out',
      });
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const data = await fetchUserProfile(userId);
      setProfile(data);
      await logActivityEvent({
        userId,
        activityType: 'profile_loaded',
        description: data ? 'Profile loaded' : 'Profile missing',
      });
    } catch (error) {
      await logErrorEvent('profile_load_error', error, { userId });
    }
  };

  // --- APPLE SIGN IN ---
  const signInWithApple = async () => {
    await logActivityEvent({ activityType: 'apple_sign_in_started', description: 'User tapped Apple sign-in' });
    try {
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
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        if (error) throw error;

        const { data } = await supabase.auth.getSession();
        await logActivityEvent({
          userId: data.session?.user?.id,
          activityType: 'apple_sign_in_success',
          description: 'Supabase session created via Apple',
        });
      } else {
        await logActivityEvent({
          activityType: 'apple_sign_in_no_token',
          description: 'Apple credential did not include identity token',
        });
      }
    } catch (e: any) {
      if (e?.code === 'ERR_REQUEST_CANCELED') {
        await logActivityEvent({ activityType: 'apple_sign_in_cancelled', description: 'User cancelled Apple sign-in' });
        return;
      }

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
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.data?.idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });
        if (error) throw error;

        const { data } = await supabase.auth.getSession();
        await logActivityEvent({
          userId: data.session?.user?.id,
          activityType: 'google_sign_in_success',
          description: 'Supabase session created via Google',
        });
      }
    } catch (error) {
       console.error("Google Sign In Error", error);
       await logErrorEvent('google_sign_in_error', error);
    }
  };

  const signOut = async () => {
    const currentUserId = user?.id ?? profile?.user_id ?? null;
    await logActivityEvent({ userId: currentUserId, activityType: 'sign_out_started' });
    try {
      await supabase.auth.signOut();
      await logActivityEvent({ userId: currentUserId, activityType: 'sign_out_success' });
    } catch (error) {
      await logErrorEvent('sign_out_error', error, { userId: currentUserId });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithApple, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);