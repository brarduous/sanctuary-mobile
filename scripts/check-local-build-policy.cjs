const test = require('node:test');
const assert = require('node:assert/strict');
const {validateEasArgs, localBuildEnvironment} = require('./eas-local-only.cjs');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {scripts} = require('../package.json');

test('cloud builds and boolean overrides are rejected before invoking EAS', () => {
  for (const args of [[], ['--platform','ios'], ['--platform','all'], ['--local=false'], ['--no-local'], ['--local','--no-local'], ['--local','--no-local=true'], ['--local','--local=false'], ['--','--local']]) {
    assert.ok(validateEasArgs(['build', ...args]));
  }
});
test('explicit local builds and repository defaults are accepted', () => {
  for (const platform of ['ios','android']) {
    assert.equal(validateEasArgs(['build','--local','--platform',platform,'--profile','production']), null);
    assert.equal(scripts[`build:${platform}`], `node scripts/eas-local-only.cjs build --local --platform ${platform} --profile production`);
  }
});
test('alternate cloud execution paths and unknown commands fail closed', () => {
  for (const command of ['build:dev','build:resign','workflow:run','env:exec','update','deploy','unknown-command']) assert.ok(validateEasArgs([command]));
});
test('build status, cancellation, credentials and store submission remain available', () => {
  for (const command of ['whoami','build:list','build:view','build:cancel','credentials','env:list','submit']) assert.equal(validateEasArgs([command]), null);
});
test('local builds import public app configuration without server secrets or overriding shell values', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sanctuary-local-env-'));
  try {
    fs.writeFileSync(path.join(root,'.env.local'),'EXPO_PUBLIC_SUPABASE_URL=https://example.supabase.co\nEXPO_PUBLIC_SUPABASE_ANON_KEY=test-public-key\nEXPO_PUBLIC_ATTRIBUTION_TEST=true\nMETA_APP_CLIENT_TOKEN=test-client-token\nSUPABASE_SERVICE_ROLE_KEY=must-not-be-imported\n');
    const inherited={EXPO_PUBLIC_ATTRIBUTION_TEST:'false'};
    const env=localBuildEnvironment(['build','--local','--platform','ios'],inherited,root);
    assert.equal(env.EXPO_PUBLIC_SUPABASE_URL,'https://example.supabase.co');
    assert.equal(env.META_APP_CLIENT_TOKEN,'test-client-token');
    assert.equal(env.SUPABASE_SERVICE_ROLE_KEY,undefined);
    assert.equal(env.EXPO_PUBLIC_ATTRIBUTION_TEST,'false');
    assert.equal(inherited.META_APP_CLIENT_TOKEN,undefined);
    assert.equal(env.EAS_LOCAL_BUILD_WORKINGDIR,path.join(root,'.local-builds','ios-work'));
    assert.equal(env.EAS_LOCAL_BUILD_ARTIFACTS_DIR,path.join(root,'.local-builds','artifacts'));
    assert.equal(env.FASTLANE_XCODEBUILD_SETTINGS_TIMEOUT,'120');
    assert.equal(env.FASTLANE_XCODEBUILD_SETTINGS_RETRIES,'2');
    assert.equal(localBuildEnvironment(['build','--local','--platform','ios'],{FASTLANE_XCODEBUILD_SETTINGS_TIMEOUT:'45'},root).FASTLANE_XCODEBUILD_SETTINGS_TIMEOUT,'45');
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('missing required local app configuration stops before an external build can start', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sanctuary-missing-env-'));
  try {assert.throws(()=>localBuildEnvironment(['build','--local'],{},root),/Set EXPO_PUBLIC_SUPABASE_URL/);}
  finally {fs.rmSync(root,{recursive:true,force:true});}
});
