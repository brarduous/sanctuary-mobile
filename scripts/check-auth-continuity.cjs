const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
let authListener;
let resolveProfile;
let token;
const profilePromise = new Promise(resolve => { resolveProfile = resolve; });
const auth = {
 async getSession() { return { data: { session: { user: { id: 'first' }, access_token: 'test-first' } } }; },
 onAuthStateChange(fn) { authListener = fn; return { data: { subscription: { unsubscribe() {} } } }; },
 async signOut() { authListener('SIGNED_OUT', null); return {}; },
};
const exportsObject = {};
const source = ts.transpileModule(fs.readFileSync('context/AuthContext.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
vm.runInNewContext(source, { exports: exportsObject, console, setTimeout, setInterval, clearInterval, require(name) {
 if (name === '@/lib/activityLogger') return { logActivityEvent: async () => {}, logErrorEvent: async () => {} };
 if (name === '@/lib/api') return { fetchUserProfile: async () => profilePromise, fetchUserCongregation: async () => 42, setAuthToken: value => { token = value; } };
 if (name === '@/lib/supabase') return { supabase: { auth } };
 if (name === '@react-native-google-signin/google-signin') return { GoogleSignin: {} };
 if (name === 'expo-apple-authentication') return {};
 if (name === 'react-native') return { Alert: {}, Platform: { OS: 'ios' }, AppState: { addEventListener: () => ({ remove() {} }) } };
 return require(name);
}});
let value;
function Probe() { value = exportsObject.useAuth(); return null; }
(async () => {
 let renderer;
 await act(async () => { renderer = create(React.createElement(exportsObject.AuthProvider, null, React.createElement(Probe))); });
 assert.equal(value.user.id, 'first');
 await act(async () => { authListener('SIGNED_OUT', null); });
 assert.equal(value.user, null);
 assert.equal(token, null);
 await act(async () => { resolveProfile({ user_id: 'first', subscription_tier: 'pro' }); await new Promise(resolve => setImmediate(resolve)); });
 assert.equal(value.profile, null, 'pending profile cannot repopulate signed-out content');
 assert.equal(value.userCongregationId, null, 'pending membership cannot repopulate signed-out church');
 assert.equal(value.loading, false);
 await act(async () => { renderer.unmount(); });
 console.log('Verified sign-out clears token and stale profile/membership responses cannot restore protected content.');
})().catch(error => { console.error(error); process.exitCode = 1; });
