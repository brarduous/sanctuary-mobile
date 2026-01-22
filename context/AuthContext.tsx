import { fetchUserProfile, setAuthToken } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
// Safe import for Google Signin to support running in Expo Go (UI only)
let GoogleSignin: any;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {
  console.warn('Google Signin not available - running in Expo Go?');
}

// Necessary for Google Auth to work properly on web/native
WebBrowser.maybeCompleteAuthSession();

// Configure Google Signin if available
if (GoogleSignin) {
    GoogleSignin.configure({
        scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Use backend web client id
        offlineAccess: true,
    });
}

interface AuthContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token) {
        setAuthToken(session.access_token);
      }
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log(`[Auth] Event: ${_event}`);
      setSession(session);
      setUser(session?.user ?? null);
      
      const token = session?.access_token;
      if (token) {
        setAuthToken(token);
      } else {
        setAuthToken(null);
      }

      if (session?.user) {
        // Fetch profile
        try {
          const profileData = await fetchUserProfile(session.user.id);
          setProfile(profileData);
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Listen for realtime profile updates (for webhook changes)
  useEffect(() => {
    if (!user) return;

    console.log(`[Auth] Subscribing to profile changes for ${user.id}`);
    const channel = supabase.channel(`public:user_profiles:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Auth] Profile updated via realtime:', payload.new);
          setProfile((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchUserProfile(user.id);
      setProfile(profileData);
    }
  }

  const signOut = async () => {
    if (Platform.OS === 'web') {
        await supabase.auth.signOut();
    } else {
        try {
            if (GoogleSignin) {
                await GoogleSignin.signOut();
            }
        } catch (e) {
            // Ignore if wasn't signed in via Google
        }
        await supabase.auth.signOut();
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
            }
        });
        if (error) throw error;
      } else {
        // Native Google Sign In
        if (!GoogleSignin) {
          Alert.alert("Configuration Error", "Google Sign-In is not available in Expo Go. Please create a development build.");
          return;
        }

        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            
            if (userInfo.data?.idToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                });
                if (error) throw error;
            } else {
                throw new Error('No ID token present!');
            }
        } catch (error: any) {
            if (error.code === 'SIGN_IN_CANCELLED') {
                // user cancelled the login flow
            } else if (error.code === 'IN_PROGRESS') {
                // operation (e.g. sign in) is in progress already
            } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
                // play services not available or outdated
                Alert.alert("Error", "Google Play Services not available.");
            } else {
                // some other error happened
                throw error;
            }
        }
      }
    } catch (e: any) {
        console.error("Google Sign In Error:", e);
        Alert.alert("Sign In Error", e.message);
    }
  };

  const signInWithApple = async () => {
    try {
        if (Platform.OS === 'ios') {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                  AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                  AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
    
            if (credential.identityToken) {
                const { error } = await supabase.auth.signInWithIdToken({
                  provider: 'apple',
                  token: credential.identityToken,
                });
                if (error) throw error;
            }
        } else {
            // Fallback for Web/Android
            const redirectUrl = Linking.createURL('/auth/callback');
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'apple',
                options: {
                    redirectTo: Platform.OS === 'web' ? window.location.origin : redirectUrl,
                     skipBrowserRedirect: Platform.OS !== 'web'
                }
            });
            if (error) throw error;

            if (Platform.OS !== 'web' && data?.url) {
                await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
            }
        }
    } catch (e: any) {
        if (e.code === 'ERR_CANCELED') {
             // User canceled
        } else {
             console.error("Apple Sign In Error:", e);
             Alert.alert("Sign In Error", e.message);
        }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signInWithGoogle,
      signInWithApple,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
