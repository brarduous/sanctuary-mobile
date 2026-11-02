const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const React = require('react'), { act, create } = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
const tick = () => new Promise(resolve => setImmediate(resolve));
function load(file, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText, {
    exports, console, require(name) {
      if (name in mocks) return mocks[name];
      if (name === 'react-native') return { View: 'View', Text: 'Text', Pressable: 'Pressable', TextInput: 'TextInput', ScrollView: 'ScrollView', Modal: 'Modal', ActivityIndicator: 'Spinner', RefreshControl: 'RefreshControl', FlatList: 'FlatList', useWindowDimensions: () => ({ width: 375, fontScale: 1 }) };
      if (name === 'lucide-react-native') return new Proxy({}, { get: (_target, name) => name });
      if (name === 'expo-image') return { Image: 'Image' };
      if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView' };
      if (name === '@/constants/Colors') return { light: {}, dark: {} };
      if (name === '@/constants/Layout') return { Layout: {}, Typography: {} };
      if (name.endsWith('useColorScheme')) return { useColorScheme: () => 'light' };
      return require(name);
    },
  }); return exports.default;
}
const article = (id, extra = {}) => ({ id, article_title: `Story ${id}`, created_at: '2026-11-02T12:00:00Z', ...extra });

test('news previews handle current/legacy outlooks, broken JSON and real publication dates without fabricated metadata', async () => {
  const { articlePreview, newsPreview, newsRelativeTime } = await import('../lib/newsFeed.ts');
  assert.equal(articlePreview(article(1, { ai_outlook: { tldr: { summary: 'The factual summary.' }, synopsis: 'The older synopsis.' } })), 'The factual summary.');
  assert.equal(articlePreview(article(1, { ai_outlook: JSON.stringify({ synopsis: 'Legacy summary.' }) })), 'Legacy summary.');
  assert.equal(articlePreview(article(1, { ai_outlook: '{broken' })), '');
  assert.equal(newsPreview('First paragraph.\n\nFull reflection.'), 'First paragraph.');
  assert.equal(newsPreview('A long headline with several words', 18), 'A long headline…');
  assert.equal(newsRelativeTime('invalid'), '');
  assert.equal(newsRelativeTime('2026-11-02T12:00:00Z', Date.parse('2026-11-02T13:00:00Z')), '1h ago');
});

test('Home news loads independently, ignores superseded responses and links to the actual story and briefing', async () => {
  const waiting = [], routes = [];
  const HomeNews = load('components/HomeNewsSection.tsx', {
    'expo-router': { useRouter: () => ({ push: route => routes.push(route), navigate: route => routes.push(route) }) },
    '@/lib/api': { fetchNewsArticles: () => new Promise(resolve => waiting.push(resolve)) },
    '@/lib/newsFeed': await import('../lib/newsFeed.ts'),
    './NewsStoryCard': 'StoryCard',
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(HomeNews, { briefing: null })); });
  assert.equal(renderer.root.findAllByType('StoryCard').length, 0, 'Home renders without waiting for optional news');
  await act(async () => renderer.update(React.createElement(HomeNews, { refreshing: true, briefing: null })));
  await act(async () => renderer.update(React.createElement(HomeNews, { refreshing: false, briefing: null })));
  await act(async () => { waiting[0]([article(1)]); await tick(); });
  assert.equal(renderer.root.findAllByType('StoryCard').length, 0, 'old refresh cannot replace the current preview');
  await act(async () => { waiting[1]([article(2)]); await tick(); });
  assert.equal(renderer.root.findByType('StoryCard').props.article.id, 2);
  renderer.root.findByType('StoryCard').props.onPress();
  assert.equal(routes[0].params.id, '2');
  renderer.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Open the daily news briefing').props.onPress();
  assert.equal(routes[1].params.briefing, 'open');
  await act(async () => renderer.unmount());
});

test('story cards keep full headlines and reserve imagery space when an image fails', async () => {
  const headline = 'A complete headline that must remain readable at enlarged text sizes';
  const Card = load('components/NewsStoryCard.tsx', { '@/lib/newsFeed': await import('../lib/newsFeed.ts') });
  let renderer;
  await act(async () => { renderer = create(React.createElement(Card, { article: article(1, { article_title: headline, article_thumbnail_url: 'https://example.com/image.jpg' }), featured: true, onPress() {} })); });
  assert.equal(renderer.root.findAllByType('Text').find(node => node.children.includes(headline)).props.numberOfLines, undefined);
  await act(async () => renderer.root.findByType('Image').props.onError());
  assert.equal(renderer.root.findAllByType('Image').length, 0);
  assert.equal(renderer.root.findAllByType('Newspaper').length, 1);
  assert.ok(renderer.root.findAllByType('View').some(node => node.props.style?.aspectRatio === 2));
  await act(async () => renderer.unmount());
});

test('feed discards stale topic responses, preserves filters on refresh and does not paginate bounded search results', async () => {
  const calls = [], pending = new Map(), routes = [];
  const cats = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `Topic ${i + 1}` }));
  const native = { View: 'View', Text: 'Text', Pressable: 'Pressable', TextInput: 'TextInput', ScrollView: 'ScrollView', Modal: 'Modal', ActivityIndicator: 'Spinner', RefreshControl: 'RefreshControl' };
  native.FlatList = React.forwardRef((props, _ref) => React.createElement('List', props, props.ListHeaderComponent, props.data.map((item, index) => React.createElement(React.Fragment, { key: item.id }, props.renderItem({ item, index }))), props.data.length ? null : props.ListEmptyComponent, props.ListFooterComponent));
  const Screen = load('app/(tabs)/news.tsx', {
    'react-native': native,
    'expo-router': { useRouter: () => ({ push: route => routes.push(route) }), useLocalSearchParams: () => ({}) },
    '@/context/AuthContext': { useAuth: () => ({ user: null }) },
    '@/components/ScreenState': 'ScreenState', '@/components/NewsStoryCard': 'StoryCard', '@/components/NewsBriefingCard': 'Briefing',
    '@/lib/api': {
      async fetchCategories() { return cats; }, async fetchDailyNewsSynopsis() { return { synopsis: 'A real briefing.' }; },
      async fetchUserFollowedCategories() { return []; },
      fetchNewsArticles(options) { calls.push(options); if (options.category_id) return new Promise(resolve => pending.set(options.category_id, resolve)); return Promise.resolve(options.q ? [article(99)] : Array.from({ length: 10 }, (_, i) => article(i + 1))); },
    },
  });
  let renderer;
  await act(async () => { renderer = create(React.createElement(Screen)); await tick(); });
  const feed = () => renderer.root.findAllByType('List').find(node => node.props.onEndReached);
  const button = label => renderer.root.findAllByType('Pressable').find(node => node.findAllByType('Text').some(text => text.children.includes(label)));
  assert.equal(feed().props.data.length, 10);
  await act(async () => button('Topic 1').props.onPress());
  await act(async () => button('Topic 2').props.onPress());
  await act(async () => { pending.get('2')([article(22)]); await tick(); });
  await act(async () => { pending.get('1')([article(11)]); await tick(); });
  assert.equal(feed().props.data[0].id, 22, 'late response from the prior topic is discarded');
  let refresh;
  await act(async () => { refresh = feed().props.refreshControl.props.onRefresh(); });
  assert.equal(calls.at(-1).category_id, '2');
  await act(async () => { pending.get('2')([article(23)]); await refresh; await tick(); });
  assert.equal(feed().props.data[0].id, 23);
  await act(async () => renderer.root.findAllByType('TextInput').find(node => node.props.accessibilityLabel === 'Search news').props.onChangeText('hope'));
  await act(async () => { renderer.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Search articles').props.onPress(); await tick(); });
  assert.equal(calls.at(-1).q, 'hope');
  assert.equal(calls.at(-1).category_id, undefined, 'search is truthfully shown as across all news');
  const count = calls.length;
  await act(async () => feed().props.onEndReached()); assert.equal(calls.length, count);
  renderer.root.findByType('StoryCard').props.onPress(); assert.equal(routes[0].params.id, '99');
  await act(async () => renderer.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Explore all news topics').props.onPress());
  assert.equal(renderer.root.findByType('Modal').props.visible, true);
  await act(async () => renderer.root.findAllByType('TextInput').find(node => node.props.accessibilityLabel === 'Find a news topic').props.onChangeText('Topic 8'));
  const topics = renderer.root.findAllByType('List').find(node => !node.props.onEndReached);
  assert.equal(topics.props.data.length, 1); assert.equal(topics.props.data[0].id, 8);
  await act(async () => button('Topic 8').props.onPress());
  assert.equal(renderer.root.findByType('Modal').props.visible, false);
  assert.equal(calls.at(-1).category_id, '8'); assert.equal(calls.at(-1).q, '');
  await act(async () => { pending.get('8')([article(88)]); await tick(); });
  await act(async () => renderer.unmount());
});
