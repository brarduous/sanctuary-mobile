#!/usr/bin/env node
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {parseEnv} = require('node:util');

function localBuildEnvironment(args, inherited = process.env, root = path.resolve(__dirname, '..')) {
  const env = {...inherited};
  const file = path.join(root, '.env.local');
  if (fs.existsSync(file)) {
    for (const [name, value] of Object.entries(parseEnv(fs.readFileSync(file, 'utf8')))) {
      // Local EAS workers cannot retrieve variables with Secret visibility.
      // Import only bundled app configuration; never copy server credentials.
      if ((name.startsWith('EXPO_PUBLIC_') || ['META_APP_ID', 'META_APP_CLIENT_TOKEN'].includes(name)) && env[name] === undefined) env[name] = value;
    }
  }
  for (const name of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY']) {
    if (!env[name]?.trim()) throw new Error(`Set ${name} in .env.local or the shell before building locally. EAS Secret variables are unavailable to local builds.`);
  }
  const at = args.indexOf('--platform');
  const requested = at >= 0 ? args[at + 1] : args.find(arg => arg.startsWith('--platform='))?.slice('--platform='.length);
  const platform = ['ios', 'android'].includes(requested) ? requested : 'local';
  const folder = path.join(root, '.local-builds');
  const artifacts = path.join(folder, 'artifacts');
  fs.mkdirSync(artifacts, {recursive: true, mode: 0o700});
  env.EAS_LOCAL_BUILD_WORKINGDIR ||= path.join(folder, `${platform}-work`);
  env.EAS_LOCAL_BUILD_ARTIFACTS_DIR ||= artifacts;
  return env;
}

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
    try {
      const env = args[0] === 'build' ? localBuildEnvironment(args) : process.env;
      const result = spawnSync('eas', args, {stdio: 'inherit', shell: false, env});
      if (result.error) console.error(result.error.message);
      process.exitCode = result.status ?? 1;
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}

module.exports = {validateEasArgs, localBuildEnvironment};
