import {AppState, Platform} from 'react-native';
import * as Device from 'expo-device';
import {getAdvertisingId, getTrackingPermissionsAsync, requestTrackingPermissionsAsync} from 'expo-tracking-transparency';

type MetaSdk = typeof import('react-native-fbsdk-next');
let sdk: MetaSdk | undefined;
let initialized = false;
let running: Promise<boolean> | undefined;

// Do not import or initialize Meta before consent. First-party install-referrer
// reporting is independent and contains no advertising identifiers.
export async function syncMetaAttribution({requestPermission = false} = {}): Promise<boolean> {
  if (__DEV__ || process.env.EXPO_PUBLIC_META_APP_EVENTS_ENABLED !== 'true' || !Device.isDevice || !['ios', 'android'].includes(Platform.OS) || AppState.currentState !== 'active') return false;
  if (running) return running;
  running = (async () => {
    let allowed = false;
    if (Platform.OS === 'ios') {
      let permission = await getTrackingPermissionsAsync();
      if (permission.status === 'undetermined' && permission.canAskAgain && requestPermission) permission = await requestTrackingPermissionsAsync();
      allowed = permission.status === 'granted';
    } else {
      // A deleted or limited Android advertising ID is an opt-out. The value
      // is checked transiently and is never retained or sent by our own API.
      allowed = Boolean(getAdvertisingId());
    }
    if (!allowed) {
      if (sdk && initialized) {
        sdk.Settings.setAutoLogAppEventsEnabled(false);
        sdk.Settings.setAdvertiserIDCollectionEnabled(false);
        if (Platform.OS === 'ios') await sdk.Settings.setAdvertiserTrackingEnabled(false);
      }
      return false;
    }
    sdk ||= await import('react-native-fbsdk-next');
    if (!initialized) {
      sdk.Settings.initializeSDK();
      initialized = true;
    }
    if (Platform.OS === 'ios') await sdk.Settings.setAdvertiserTrackingEnabled(true);
    sdk.Settings.setAdvertiserIDCollectionEnabled(true);
    sdk.Settings.setAutoLogAppEventsEnabled(true);
    return true;
  })().finally(() => {running = undefined;});
  return running;
}
