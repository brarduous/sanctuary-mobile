// Client tokens identify a bundled Meta SDK; never use a Meta app secret here.
const base = require('./app.json').expo;
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
module.exports = () => {
  // EAS can evaluate this file before loading remote environment variables.
  // Read only native SDK configuration from the ignored local fallback; do not
  // mutate process.env or override values supplied by the build environment.
  const localPath = path.join(__dirname, '.env.local');
  const local = fs.existsSync(localPath) ? dotenv.parse(fs.readFileSync(localPath)) : {};
  const appID = (process.env.META_APP_ID ?? local.META_APP_ID)?.trim();
  const clientToken = (process.env.META_APP_CLIENT_TOKEN ?? local.META_APP_CLIENT_TOKEN)?.trim();
  if (!appID || !/^\d+$/.test(appID) || !clientToken) {
    throw new Error('Set META_APP_ID and META_APP_CLIENT_TOKEN in local/EAS build configuration before building the native app.');
  }
  const permission = 'Allow Sanctuary to measure which ads lead to app installs. Your prayer, guidance, and quiz answers are not shared with Meta.';
  return {
    ...base,
    plugins: [
      ...(base.plugins || []).filter(plugin => (Array.isArray(plugin) ? plugin[0] : plugin) !== 'expo-tracking-transparency'),
      ['expo-tracking-transparency', {userTrackingPermission: permission}],
      ['react-native-fbsdk-next', {
        appID, clientToken, displayName: 'Sanctuary', scheme: `fb${appID}`,
        isAutoInitEnabled: false,
        // SDK initialization is gated by platform permission in metaAttribution.
        // Purchase/subscription auto-logging is disabled in the Meta dashboard.
        autoLogAppEventsEnabled: true,
        advertiserIDCollectionEnabled: true,
        iosUserTrackingPermission: permission,
      }],
    ],
  };
};
