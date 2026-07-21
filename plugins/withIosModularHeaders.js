const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withIosModularHeaders(config) {
  return withDangerousMod(config, ['ios', async (modConfig) => {
    const podfilePath = path.join(modConfig.modRequest.platformProjectRoot, 'Podfile');
    const podfile = fs.readFileSync(podfilePath, 'utf8');

    if (!podfile.includes('use_modular_headers!')) {
      const updated = podfile.replace(
        /(platform :ios[^\n]*\n)/,
        '$1use_modular_headers!\n'
      );
      fs.writeFileSync(podfilePath, updated);
    }

    return modConfig;
  }]);
};
