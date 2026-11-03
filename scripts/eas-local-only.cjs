#!/usr/bin/env node
const {spawnSync} = require('node:child_process');

function validateEasArgs(args) {
  const [command] = args;
  if (!command) return 'Choose a command. Signed local builds: npm run build:ios or npm run build:android.';
  if (command === 'build') {
    if (!args.includes('--local') || args.some(arg => arg === '--' || arg.startsWith('--no-local') || arg.startsWith('--local='))) {
      return 'EAS cloud builds are disabled by repository policy. Use npm run build:ios or npm run build:android (both force --local).';
    }
    return null;
  }
  const account = new Set(['whoami', 'login', 'logout', 'credentials', 'credentials:configure-build', '--help', '--version']);
  const buildSupport = new Set(['build:list', 'build:view', 'build:cancel', 'build:download', 'build:run', 'build:inspect', 'build:configure', 'build:version:get', 'build:version:set', 'build:version:sync']);
  const envSupport = new Set(['env:list', 'env:get', 'env:pull', 'env:push', 'env:create', 'env:update', 'env:delete']);
  if (account.has(command) || buildSupport.has(command) || envSupport.has(command) || command === 'submit' || command === 'submission:view' || command === 'submission:list') return null;
  return `EAS command "${command}" is not permitted by the no-credit repository policy. Use local Xcode/Gradle for builds; do not start cloud execution or publication.`;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const error = validateEasArgs(args);
  if (error) {
    console.error(error);
    process.exitCode = 1;
  } else {
    const result = spawnSync('eas', args, {stdio: 'inherit', shell: false});
    if (result.error) console.error(result.error.message);
    process.exitCode = result.status ?? 1;
  }
}

module.exports = {validateEasArgs};
