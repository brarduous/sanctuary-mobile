const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withAndroidPhoneOnly(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults.manifest['supports-screens'] = [
      {
        $: {
          'android:smallScreens': 'true',
          'android:normalScreens': 'true',
          'android:largeScreens': 'false',
          'android:xlargeScreens': 'false',
        },
      },
    ];

    return config;
  });
};
