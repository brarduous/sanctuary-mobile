const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { act, create } = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
const tick = () => new Promise(resolve => setImmediate(resolve));
const theme = { text: '#111', mutedForeground: '#555', tint: '#864', card: '#fff', border: '#ddd', readingSurface: '#eee', onAction: '#fff' };
const Button = props => React.createElement('Button', props);
function load(file, overrides = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText, {
    exports, Set, console, setInterval, clearInterval, ...globals, require(name) {
      if (name in overrides) return overrides[name];
      if (name === 'react-native') return { View: 'View', Text: 'Text', Pressable: 'Pressable', ActivityIndicator: 'Spinner', ScrollView: 'ScrollView', RefreshControl: 'RefreshControl' };
      if (name === 'lucide-react-native') return new Proxy({}, { get: (_target, name) => name });
      if (name === '@/constants/Colors') return { light: theme, dark: theme };
      if (name === '@/constants/Layout') return { Layout: { gutter: 20 }, Typography: {} };
      if (name.endsWith('useColorScheme')) return { useColorScheme: () => 'light' };
      if (name === './DiscoveryUI' || name === '@/components/DiscoveryUI') return { DiscoveryButton: Button };
      if (name === './DailySetScore') return 'Score';
      return require(name);
    },
  });
  return exports;
}
const text = renderer => renderer.root.findAllByType('Text').map(node => node.children.filter(child => typeof child === 'string').join('')).join('\n');

test('Home card tracks visible exposure once per session/day/account and opens the overview for each progress state', async () => {
  let account = 'alice', today = '2026-11-02', played = 0, error = null, refreshing = false, available = true;
  const metrics = [], routes = [];
  const daily = await import('../lib/discoveryDailySet.ts');
  const items = [1, 2, 3].map(i => ({ id: `q${i}`, setPosition: i, revision: 1, publicationDate: today, correctOptionId: 'yes' }));
  const context = () => ({ bundle: { enabled: true, items: available ? items : [], withdrawnIds: [] }, today, progress: { completions: Object.fromEntries(items.slice(0, played).map(item => [item.id, { revision: 1, puzzleDate: item.publicationDate, outcome: item.setPosition === 2 ? 'incorrect' : 'correct' }])) }, error, refreshing, refresh: async () => {}, hasGuestProgress: false });
  const Card = load('components/DailyDiscoveryCard.tsx', {
    'expo-router': { useRouter: () => ({ push: route => routes.push(route) }) },
    '@/context/AuthContext': { useAuth: () => ({ user: account ? { id: account } : null }) },
    '@/context/DiscoveryContext': { useDiscoveries: context },
    '@/lib/discoveries': { discoveryMetric: (item, event) => metrics.push([item.id, event]) },
    '@/lib/discoveryDailySet': daily,
  }).default;
  let renderer;
  await act(async () => { renderer = create(React.createElement(Card)); });
  assert.equal(metrics.length, 0, 'mounting below the viewport is not exposure');
  assert.match(text(renderer), /Today’s Bible Trivia/);
  await act(async () => renderer.update(React.createElement(Card, { visible: true })));
  assert.equal(metrics.length, 1);
  await act(async () => { renderer.root.findByType('Button').props.onPress(); });
  assert.equal(routes[0].pathname, '/discoveries', 'entry does not start a timed question');
  assert.equal(routes[0].params.source, 'home');
  played = 1;
  await act(async () => renderer.update(React.createElement(Card, { visible: true })));
  assert.match(text(renderer), /1\/3 played · progress saved/);
  assert.equal(renderer.root.findByType('Button').props.label, 'Continue');
  assert.equal(metrics.length, 1);
  played = 3;
  await act(async () => renderer.update(React.createElement(Card, { visible: true })));
  assert.match(text(renderer), /Today’s Trivia complete/);
  assert.match(text(renderer), /2\/3 correct/);
  assert.equal(renderer.root.findByType('Button').props.variant, 'quiet');
  assert.equal(renderer.root.findByType('Score').props.compact, true);
  error = 'offline';
  await act(async () => renderer.update(React.createElement(Card, { visible: true })));
  assert.match(text(renderer), /Saved on this device/);
  assert.match(text(renderer), /2\/3 correct/);
  today = '2026-11-03';
  await act(async () => renderer.update(React.createElement(Card, { visible: true })));
  assert.doesNotMatch(text(renderer), /2\/3 correct/, 'yesterday’s cache is not shown as today');
  assert.equal(renderer.root.findByType('Button').props.label, 'Try again');
  refreshing = true;
  await act(async () => renderer.update(React.createElement(Card, { visible: true })));
  assert.equal(renderer.root.findAllByType('Button').length, 0);
  assert.equal(renderer.root.findAllByType('Spinner').length, 1);
  today = '2026-11-02'; refreshing = false; error = null; account = 'bob'; played = 0;
  await act(async () => renderer.update(React.createElement(Card, { visible: true })));
  assert.equal(metrics.length, 2, 'another account gets its own on-device exposure boundary');
  await act(async () => renderer.unmount());
  await act(async () => { renderer = create(React.createElement(Card, { visible: true })); });
  assert.equal(metrics.length, 2, 'remount does not inflate the session/day count');
  await act(async () => renderer.unmount());
});

test('More exposes playable Games, Videos, existing News and membership-aware church entry', async () => {
  let member = null;
  const routes = [];
  const More = load('app/(tabs)/more.tsx', {
    'expo-router': { useRouter: () => ({ push: route => routes.push(route), navigate: route => routes.push(route) }) },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '@/context/AuthContext': { useAuth: () => ({ userCongregationId: member }) },
    '@/components/MoreRow': props => React.createElement('Row', props),
  }).default;
  let renderer;
  await act(async () => { renderer = create(React.createElement(More)); });
  const row = title => renderer.root.findAllByType('Row').find(node => node.props.title === title);
  assert.deepEqual(renderer.root.findAllByType('Row').slice(0, 3).map(node => node.props.title), ['Games', 'Videos', 'News']);
  row('Games').props.onPress(); row('News').props.onPress(); row('Join a church').props.onPress(); row('Notifications').props.onPress();
  assert.equal(routes[0].pathname, '/discoveries'); assert.equal(routes[0].params.source, 'games');
  assert.equal(routes[1], '/(tabs)/news'); assert.equal(routes[2], '/join');
  assert.equal(routes[3].params.section, 'notifications');
  member = 123;
  await act(async () => renderer.update(React.createElement(More)));
  assert.equal(row('Join a church'), undefined);
  row('My Church').props.onPress(); assert.equal(routes.at(-1), '/(tabs)/church');
  await act(async () => renderer.unmount());
});

test('Videos discards late account responses, distinguishes errors/empty feeds and keeps guests outside personalized requests', async () => {
  let account = 'alice', resolveAlice, resolveBob, rejectBob;
  const calls = [], navigations = [], cleanups = new Set();
  const useFocusEffect = callback => React.useEffect(() => {
    const cleanup = callback(); cleanups.add(cleanup);
    return () => { cleanup?.(); cleanups.delete(cleanup); };
  }, [callback]);
  const Screen = load('app/videos.tsx', {
    'expo-router': { Stack: { Screen: 'StackScreen' }, useFocusEffect, useRouter: () => ({ push: route => navigations.push(route) }) },
    'expo-image': { Image: 'Image' },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '@/context/AuthContext': { useAuth: () => ({ user: account ? { id: account } : null, loading: false }) },
    '@/components/ScreenState': props => React.createElement('ScreenState', props),
    '@/lib/api': { fetchRecommendedVideos: options => { calls.push([account, options]); return account === 'alice' ? new Promise(resolve => { resolveAlice = resolve; }) : new Promise((resolve, reject) => { resolveBob = resolve; rejectBob = reject; }); } },
  }).default;
  let renderer;
  await act(async () => { renderer = create(React.createElement(Screen)); });
  account = 'bob';
  await act(async () => renderer.update(React.createElement(Screen)));
  await act(async () => { resolveAlice([{ id: 1, title: 'Private Alice recommendation', video_url: 'https://example.com' }]); await tick(); });
  assert.doesNotMatch(text(renderer), /Private Alice/);
  await act(async () => { rejectBob(new Error('offline')); await tick(); });
  assert.equal(renderer.root.findByType('ScreenState').props.title, 'Videos could not load');
  await act(async () => { renderer.root.findByType('ScreenState').props.onRetry(); });
  assert.equal(calls.length, 3);
  await act(async () => { resolveBob([]); await tick(); });
  assert.match(text(renderer), /No recommendations yet/);
  account = null;
  await act(async () => renderer.update(React.createElement(Screen)));
  assert.equal(renderer.root.findByType('ScreenState').props.actionLabel, 'Sign in');
  assert.equal(calls.length, 3, 'guest entry does not request personalized recommendations');
  await act(async () => renderer.unmount());
});


test('visibility requires viewport intersection and remains reachable for enlarged-text cards', async () => {
  const { scrollItemIsVisible: visible } = await import('../lib/scrollVisibility.ts');
  assert.equal(visible(null, 0, 600), false);
  assert.equal(visible({ y: 700, height: 200 }, 0, 600), false);
  assert.equal(visible({ y: 100, height: 200 }, 0, 600), true);
  assert.equal(visible({ y: 100, height: 200 }, 201, 600), false);
  assert.equal(visible({ y: 100, height: 200 }, 200, 600), true);
  assert.equal(visible({ y: 0, height: 1200 }, 400, 300), true);
  assert.equal(visible({ y: 0, height: 200 }, 0, 0), false);
});


test('card visibility is suspended in background and on an unfocused tab', async () => {
  let focused = true, listener, result, removed = false;
  const native = { AppState: { currentState: 'active', addEventListener(_name, fn) { listener = fn; return { remove() { removed = true; } }; } } };
  const useVisibility = load('components/useScrollItemVisibility.ts', {
    'react-native': native,
    '@react-navigation/native': { useIsFocused: () => focused },
    '@/lib/scrollVisibility': await import('../lib/scrollVisibility.ts'),
  }).default;
  function Probe() { result = useVisibility(); return null; }
  let renderer;
  await act(async () => { renderer = create(React.createElement(Probe)); });
  await act(async () => {
    result.onLayout({ nativeEvent: { layout: { height: 500 } } });
    result.onItemLayout({ nativeEvent: { layout: { y: 100, height: 200 } } });
  });
  assert.equal(result.visible, true);
  await act(async () => listener('background')); assert.equal(result.visible, false);
  await act(async () => listener('active')); assert.equal(result.visible, true);
  focused = false;
  await act(async () => renderer.update(React.createElement(Probe))); assert.equal(result.visible, false);
  focused = true;
  await act(async () => renderer.update(React.createElement(Probe)));
  await act(async () => result.onScroll({ nativeEvent: { contentOffset: { y: 350 }, layoutMeasurement: { height: 500 } } }));
  assert.equal(result.visible, false);
  await act(async () => renderer.unmount()); assert.equal(removed, true);
});

test('foreground across local midnight bypasses the 15-minute bundle throttle', async () => {
  let today = '2026-11-02', foreground, value, hold = false, releaseFetch;
  const fetched = [];
  const core = await import('../lib/discoveryCore.ts');
  const progress = { total: 0, completions: {}, pending: {} };
  const api = {
    discoveryStore: { async bundle() { return null; }, async progress() { return progress; }, async installationId() { return 'test-installation'; }, async saveBundle() {} },
    async fetchDiscoveryBundle() { const date = today; fetched.push(date); if (hold) await new Promise(resolve => { releaseFetch = resolve; }); return { schemaVersion: 1, enabled: true, bundleRevision: date, items: [], evergreen: [], withdrawnIds: [] }; },
  };
  const module = load('context/DiscoveryContext.tsx', {
    'react-native': { AppState: { currentState: 'active', addEventListener(_name, fn) { foreground = fn; return { remove() {} }; } } },
    'expo-crypto': {},
    './AuthContext': { useAuth: () => ({ user: null, loading: false }) },
    '@/lib/discoveryCore': { ...core, discoveryLocalDate: () => today },
    '@/lib/discoveryDailySet': await import('../lib/discoveryDailySet.ts'),
    '@/lib/discoveries': api,
    '@/assets/discoveries/approved-fallback.json': null,
  }, { setInterval: () => 1, clearInterval: () => {} });
  function Probe() { value = module.useDiscoveries(); return null; }
  let renderer;
  await act(async () => { renderer = create(React.createElement(module.DiscoveryProvider, null, React.createElement(Probe))); await tick(); });
  assert.deepEqual(fetched, ['2026-11-02']);
  assert.equal(value.refreshing, false);
  await act(async () => { foreground('active'); await tick(); });
  assert.equal(fetched.length, 1, 'same-day foreground respects the throttle');
  today = '2026-11-03';
  await act(async () => { foreground('active'); await tick(); });
  assert.deepEqual(fetched, ['2026-11-02', '2026-11-03']);
  assert.equal(value.today, today);
  assert.equal(value.bundle.bundleRevision, today);
  hold = true;
  await act(async () => { void value.refresh(true); await tick(); });
  assert.equal(value.refreshing, true);
  today = '2026-11-04';
  await act(async () => { foreground('active'); await tick(); });
  assert.equal(value.today, today, 'even an in-flight old request cannot leave yesterday labeled today');
  hold = false;
  await act(async () => { releaseFetch(); await tick(); });
  assert.equal(fetched.at(-1), today, 'old-day response is followed by a fresh current-day request');
  assert.equal(value.bundle.bundleRevision, today);
  await act(async () => renderer.unmount());
});


test('tab configuration exposes four nonmember tabs, five member tabs and keeps News reachable without a tab button', async () => {
  let member = null;
  const Tabs = props => React.createElement('Tabs', props);
  Tabs.Screen = 'TabScreen';
  const Screen = load('app/(tabs)/_layout.tsx', {
    '@react-navigation/bottom-tabs': { BottomTabBar: 'BottomTabBar' },
    'expo-router': { Tabs, useRouter: () => ({ navigate() {}, push() {} }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
    '@/context/AuthContext': { useAuth: () => ({ userCongregationId: member, user: null }) },
  }).default;
  let renderer;
  await act(async () => { renderer = create(React.createElement(Screen)); });
  const visible = () => renderer.root.findAllByType('TabScreen').filter(node => node.props.options.href !== null).map(node => node.props.name);
  assert.deepEqual(visible(), ['index', 'bible', 'advice', 'more']);
  assert.equal(renderer.root.findAllByType('TabScreen').find(node => node.props.name === 'news').props.options.href, null);
  const allRoutes = ['index', 'bible', 'advice', 'church', 'more', 'news'].map(name => ({ key: name, name }));
  const bar = renderer.root.findByType('Tabs').props.tabBar({ state: { routes: allRoutes, routeNames: allRoutes.map(route => route.name), index: 5 } });
  assert.deepEqual(bar.props.state.routes.map(route => route.name), ['index', 'bible', 'advice', 'more']);
  assert.equal(bar.props.state.index, 3, 'legacy News keeps More selected');
  member = 123;
  await act(async () => renderer.update(React.createElement(Screen)));
  assert.deepEqual(visible(), ['index', 'bible', 'advice', 'church', 'more']);
  await act(async () => renderer.unmount());
});

test('recommendation API preserves Home fallback while Videos receives session, network and contract failures', async () => {
  let session = null, body = [], failure = null, requests = 0;
  const client = { interceptors: { request: { use() {} }, response: { use() {} } }, async get(path) { requests++; assert.equal(path, '/recommended'); if (failure) throw failure; return { data: body }; } };
  const { fetchRecommendedVideos } = load('lib/api.ts', {
    axios: { create: () => client },
    './supabase': { supabase: { auth: { async getSession() { return { data: { session } }; } } } },
  }, { process: { env: {} }, console: { error() {} } });
  assert.equal((await fetchRecommendedVideos()).length, 0);
  await assert.rejects(fetchRecommendedVideos({ throwOnError: true }), /sign in again/);
  assert.equal(requests, 0);
  session = { access_token: 'synthetic-token' };
  assert.equal((await fetchRecommendedVideos({ throwOnError: true })).length, 0, 'an empty successful response is an empty feed');
  body = [{ id: 1, title: 'Synthetic video', video_url: 'https://example.com' }];
  assert.equal((await fetchRecommendedVideos({ throwOnError: true }))[0].id, 1);
  failure = new Error('offline');
  assert.equal((await fetchRecommendedVideos()).length, 0, 'Home retains its existing optional-content fallback');
  await assert.rejects(fetchRecommendedVideos({ throwOnError: true }), /offline/);
  failure = null; body = { invalid: true };
  await assert.rejects(fetchRecommendedVideos({ throwOnError: true }), /Invalid video recommendations/);
});
