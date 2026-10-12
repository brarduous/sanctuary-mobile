// Behavioral regression: switch accounts while native identity lookup is pending.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
let auth = { user: { id: 'first' }, profile: null, refreshProfile: async () => {} };
let nativeId = null;
let blockFirst;
let unblockFirst;
const listeners = new Set();
const info = (pro = false) => ({ entitlements: { active: pro ? { subscriber: {} } : {} } });
const sdk = {
 configure() {},
 async logIn(id) { nativeId = id; if (id === 'first' && blockFirst) await blockFirst; },
 async isAnonymous() { return nativeId === null; },
 async logOut() { nativeId = null; },
 async getCustomerInfo() { return info(nativeId === 'first'); },
 async getOfferings() { return { current: { availablePackages: [] } }; },
 addCustomerInfoUpdateListener(fn) { listeners.add(fn); },
 removeCustomerInfoUpdateListener(fn) { listeners.delete(fn); },
 async purchasePackage() { return { customerInfo: info(true) }; },
 async restorePurchases() { return info(false); },
};
const exportsObject = {};
const source = ts.transpileModule(fs.readFileSync('context/RevenueCatContext.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
vm.runInNewContext(source, { exports: exportsObject, console, require(name) {
 if (name === '@/constants/RevenueCat') return { apple: 'appl_test_public', google: 'goog_test_public' };
 if (name === 'react-native') return { Platform: { OS: 'ios' } };
 if (name === 'react-native-purchases') return sdk;
 if (name === './AuthContext') return { useAuth: () => auth };
 return require(name);
}});
let value;
function Probe() { value = exportsObject.useRevenueCat(); return null; }
const tree = () => React.createElement(exportsObject.RevenueCatProvider, null, React.createElement(Probe));
const flush = async () => { await act(async () => { await new Promise(resolve => setImmediate(resolve)); }); };
(async () => {
 blockFirst = new Promise(resolve => { unblockFirst = resolve; });
 let renderer;
 await act(async () => { renderer = create(tree()); });
 assert.equal(value.isPro, false);
 auth = { ...auth, user: { id: 'second' }, profile: { user_id: 'first', subscription_tier: 'pro' } };
 await act(async () => { renderer.update(tree()); });
 assert.equal(value.isPro, false, 'previous profile cannot grant access to new account');
 await act(async () => { unblockFirst(); });
 await flush();
 assert.equal(nativeId, 'second', 'SDK identity mutations finish in order');
 assert.equal(value.isPro, false, 'stale first-account completion cannot leak entitlement');
 auth = { ...auth, user: null };
 await act(async () => { renderer.update(tree()); });
 assert.equal(value.isPro, false, 'sign-out immediately removes premium UI');
 await flush();
 assert.equal(nativeId, null);
 await assert.rejects(value.restorePurchases(), /unavailable/, 'guest restore cannot claim another account entitlement');
 await act(async () => { renderer.unmount(); });
 assert.equal(listeners.size, 0, 'native listeners cleaned up');
 console.log('Verified stale entitlement isolation, ordered account changes, sign-out and listener cleanup.');
})().catch(error => { console.error(error); process.exitCode = 1; });
