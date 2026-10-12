const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
const native = Object.fromEntries(['View','Text','Pressable','TouchableOpacity','TextInput','ScrollView','KeyboardAvoidingView','InputAccessoryView','ActivityIndicator'].map(name => [name, name]));
native.Platform = { OS: 'ios' }; native.StyleSheet = { create: value => value }; native.Keyboard = { dismiss() {} }; native.Linking = {};
let alerts = []; native.Alert = { alert: (...args) => { alerts.push(args); } };
let focused = true;
let joins = 0, checkouts = 0;
let resolveJoin, resolveBrowser;
let membership;
const auth = { user: { id: 'qa' }, userCongregationId: 3, loading: false, setUserCongregationId: id => { membership = id; } };
const router = { replace() {}, canGoBack: () => true, back() {} };
const api = {
 joinCongregation: async () => { joins += 1; return new Promise(resolve => { resolveJoin = resolve; }); },
 fetchGivingStatus: async () => true,
 createGivingCheckout: async () => { checkouts += 1; return 'https://checkout.stripe.com/test-only'; },
};
const browser = { WebBrowserPresentationStyle: { FULL_SCREEN: 'full' }, openBrowserAsync: async () => new Promise(resolve => { resolveBrowser = resolve; }) };
const palette = { background: 'white', text: 'black', border: 'gray', mutedForeground: 'gray' };
function load(file) {
 const exports = {};
 const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
 vm.runInNewContext(source, { exports, console, require(name) {
  if (name === 'react-native') return native;
  if (name === '@/context/AuthContext') return { useAuth: () => auth };
  if (name === '@/lib/api') return api;
  if (name === '@/lib/inviteToken') return { extractInviteToken: value => value === 'valid-qa-invite' ? value : null };
  if (name === '@/constants/Layout') return { Layout: { actionHeight: 48, controlRadius: 14 }, Typography: { helper: {}, action: {} } };
  if (name === '@/constants/Colors') return { light: palette, dark: palette };
  if (name === '@/components/useColorScheme') return { useColorScheme: () => 'light' };
  if (name === '@/components/ScreenState') return 'ScreenState';
  if (name === '@react-navigation/native') return { useIsFocused: () => focused };
  if (name === '@react-navigation/elements') return { useHeaderHeight: () => 44 };
  if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ bottom: 0 }) };
  if (name === 'expo-router') return { Stack: { Screen: 'StackScreen' }, useRouter: () => router };
  if (name === 'expo-camera') return { CameraView: 'CameraView', useCameraPermissions: () => [{ granted: true }, async () => {}] };
  if (name === 'expo-web-browser') return browser;
  if (name === 'lucide-react-native') return Object.fromEntries(['QrCode','X','Building','Globe','Heart','Lock'].map(key => [key, key]));
  return require(name);
 }});
 return exports.default;
}
(async () => {
 const Scan = load('app/scan.tsx');
 let scanner;
 await act(async () => { scanner = create(React.createElement(Scan)); });
 const scan = scanner.root.findByType('CameraView').props.onBarcodeScanned;
 let joining;
 await act(async () => { joining = scan({ data: 'valid-qa-invite' }); void scan({ data: 'valid-qa-invite' }); });
 assert.equal(joins, 1, 'two detections in the same render cause one join');
 await act(async () => { resolveJoin(3); await joining; });
 assert.equal(membership, 3);
 focused = false;
 await act(async () => { scanner.update(React.createElement(Scan)); });
 assert.equal(scanner.root.findAllByType('CameraView').length, 0, 'camera unmounted when route loses focus');
 await act(async () => { scanner.unmount(); });
 const Give = load('app/give/index.tsx');
 let giving;
 await act(async () => { giving = create(React.createElement(Give)); });
 await act(async () => { giving.root.findByType('TextInput').props.onChangeText('5.00'); });
 const checkout = giving.root.findAllByType('TouchableOpacity').find(node => node.props.accessibilityState?.busy !== undefined).props.onPress;
 let action;
 await act(async () => { action = checkout(); void checkout(); });
 assert.equal(checkouts, 1, 'rapid taps create one checkout');
 await act(async () => { resolveBrowser({ type: 'dismiss' }); await action; });
 assert.equal(giving.root.findByType('TextInput').props.value, '5.00', 'closing browser preserves entered amount');
 assert.equal(giving.root.findAllByType('TouchableOpacity').find(node => node.props.accessibilityState?.busy !== undefined).props.disabled, false, 'cancellation restores usable action');
 assert.equal(alerts.filter(args => /success|recorded/i.test(args[0])).length, 0, 'browser close never implies donation success');
 await act(async () => { giving.unmount(); });
 console.log('Verified duplicate scan/checkout guards, camera focus cleanup and canceled checkout form recovery.');
})().catch(error => { console.error(error); process.exitCode = 1; });
