const test = require('node:test');
const assert = require('node:assert/strict');
const {validateEasArgs} = require('./eas-local-only.cjs');
const {scripts} = require('../package.json');

test('cloud builds and boolean overrides are rejected before invoking EAS', () => {
  for (const args of [[], ['--platform','ios'], ['--platform','all'], ['--local=false'], ['--no-local'], ['--local','--no-local'], ['--local','--local=false']]) {
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
  for (const command of ['build:dev','build:resign','workflow:run','update','deploy','unknown-command']) assert.ok(validateEasArgs([command]));
});
test('build status, cancellation, credentials and store submission remain available', () => {
  for (const command of ['whoami','build:list','build:view','build:cancel','credentials','env:list','submit']) assert.equal(validateEasArgs([command]), null);
});
