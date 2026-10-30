import test from 'node:test';
import assert from 'node:assert/strict';
import { newsShareText, devotionalShareText, adviceShareText } from '../lib/contentShare.ts';

test('news shares whole factual copy, a separate reflection, and a source', () => {
  const summary = 'Officials proposed a change; the council has not voted. The reported cost remains uncertain.';
  const result = newsShareText({ title: 'Council weighs housing proposal', summary, reflection: 'Care for neighbors starts with attention.', sourceUrl: 'https://example.com/report' });
  assert.ok(result.includes(summary));
  assert.ok(result.includes('Faith reflection: Care for neighbors'));
  assert.ok(result.includes('Source: https://example.com/report'));
  assert.equal((result.match(/Council weighs/g) || []).length, 1);
  assert.ok(!newsShareText({ title: 'Story', sourceUrl: 'javascript:alert(1)' }).includes('javascript:'));
  assert.equal(newsShareText({ title: 'Story' }), 'Story\n\nShared via Sanctuary');
});

test('devotional quick sharing uses all three slides and keeps full-text and legacy paths', () => {
  const input = { title: 'Listen Before You Reply', scripture: 'James 1:19', content: 'Complete reflection', slides: [{ text: 'Notice' }, { text: 'Ground' }, { text: 'Practice' }] };
  const quick = devotionalShareText(input);
  assert.ok(quick.includes('Notice\n\nGround\n\nPractice'));
  assert.ok(quick.includes('James 1:19'));
  assert.ok(!quick.includes('Complete reflection'));
  assert.ok(devotionalShareText(input, true).includes('Complete reflection'));
  assert.ok(devotionalShareText({ ...input, slides: [] }).includes('Complete reflection'));
});

test('guidance shares action steps and reading without appending private situation or growth notes', () => {
  const privateAdvice = { situation: 'Sensitive private details', acknowledgment: 'Personal acknowledgment', suggested_growth_area: 'Private growth theme', steps: ['Pause before replying.', 'Ask to talk tomorrow.', 'Speak with someone you trust.'], scripture_reading: { reference: 'James 1:19' } };
  const result = adviceShareText(privateAdvice.steps, privateAdvice.scripture_reading.reference);
  assert.ok(result.includes('1. Pause before replying.'));
  assert.ok(result.includes('3. Speak with someone you trust.'));
  assert.ok(result.includes('Read: James 1:19'));
  for (const field of ['situation', 'acknowledgment', 'suggested_growth_area']) assert.ok(!result.includes(privateAdvice[field]));
});
