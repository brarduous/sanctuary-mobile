import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from './supabase';

// 1. Setup notification handler logic 
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// 2. Register for push notifications function
async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      handleRegistrationError('Permission not granted to get push token for push notification!');
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError('Project ID not found');
    }
    try {
      // Fetch the native APNs/FCM token explicitly. Besides making failures easier
      // to diagnose, this ensures Expo refreshes its mapping after a reinstall.
      const devicePushToken = await Notifications.getDevicePushTokenAsync();
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
          devicePushToken,
        })
      ).data;
      console.log('Push notification registration succeeded');
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError('Must use physical device for push notifications');
  }
}

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

const isExpoPushToken = (value: string) => value.startsWith('ExponentPushToken[') || value.startsWith('ExpoPushToken[');

// 3. Hook to use in the app
export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(
      undefined
    );
    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);
    const tokenListener = useRef<Notifications.EventSubscription | null>(null);
    const registrationInProgress = useRef(false);

    const refreshPushToken = useCallback(async () => {
      if (registrationInProgress.current) return;
      registrationInProgress.current = true;

      try {
        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token ?? '');
      } catch (error: unknown) {
        console.error('Push notification registration failed:', error);
        setExpoPushToken('');
      } finally {
        registrationInProgress.current = false;
      }
    }, []);
  
    useEffect(() => {
      void refreshPushToken();

      const appStateListener = AppState.addEventListener('change', state => {
        if (state === 'active') void refreshPushToken();
      });

      tokenListener.current = Notifications.addPushTokenListener(() => {
        void refreshPushToken();
      });
  
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
      });
  
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const url = response.notification.request.content.data?.url;
        if (typeof url === 'string' && url.startsWith('/')) {
          router.push(url as never);
        }
      });
  
      return () => {
        appStateListener.remove();
        tokenListener.current?.remove();
        notificationListener.current &&
          notificationListener.current.remove();
        responseListener.current &&
          responseListener.current.remove();
      };
    }, [refreshPushToken]);
  
    return {
      expoPushToken,
      notification,
    };
  };

  export const savePushTokenToProfile = async (userId: string, token: string) => {
    if (!userId || !token || !isExpoPushToken(token)) return;

    const { data, error } = await supabase
        .from('user_profiles')
        .update({ expo_push_token: token })
        .eq('user_id', userId)
        .select('user_id')
        .single();

    if (error) {
        console.error('Error saving push token to profile:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return;
    }

    console.log('Push token saved to profile:', data.user_id);
  };
