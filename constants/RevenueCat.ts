// Placeholder keys - these would typically come from your RevenueCat dashboard
// and environment variables.
const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || "appl_placeholder_key",
  google: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || "goog_placeholder_key"
};

export default API_KEYS;
