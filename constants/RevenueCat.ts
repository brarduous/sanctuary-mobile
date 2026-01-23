import { Platform } from 'react-native';

const appleKey = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY;
const googleKey = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY;

if (!appleKey && Platform.OS === 'ios') {
  console.warn("⚠️ RevenueCat Apple Key is missing! Payments will fail.");
}

if (!googleKey && Platform.OS === 'android') {
  console.warn("⚠️ RevenueCat Google Key is missing! Payments will fail.");
}

const API_KEYS = {
  apple: appleKey || '',
  google: googleKey || ''
};

export default API_KEYS;