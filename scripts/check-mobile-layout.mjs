import assert from 'node:assert/strict';
import { scriptureCardHeight } from '../lib/scriptureCardLayout.ts';
import { improvementReminderKey, isImprovementCheckInDue, nextImprovementCheckInAt } from '../lib/improvementCheckIn.ts';
for (const width of [280, 350, 390, 430]) {
  assert.equal(scriptureCardHeight(width, 40), width, 'short passage is square');
  for (const text of [80, 240, 500, 3000]) {
    const height = scriptureCardHeight(width, text);
    assert.ok(height >= width && height <= width * 4 / 3, 'bounded 1:1 to 3:4 card');
  }
  assert.equal(scriptureCardHeight(width, 3000), width * 4 / 3, 'long passage hits height cap');
}
const now = new Date('2026-10-11T12:00:00Z');
const overdue = '2026-09-01T12:00:00Z';
const deferred = nextImprovementCheckInAt(now);
assert.equal(deferred, '2026-11-10T12:00:00.000Z');
assert.equal(isImprovementCheckInDue(overdue, null, +now), true);
assert.equal(isImprovementCheckInDue(overdue, deferred, +now), false, 'Later survives another login with stale server date');
assert.equal(isImprovementCheckInDue(overdue, deferred, Date.parse(deferred)), true, 'reminder returns after full interval');
assert.equal(isImprovementCheckInDue(deferred, overdue, +now), false, 'new profile check-in wins');
assert.equal(isImprovementCheckInDue('invalid', null, +now), false);
assert.notEqual(improvementReminderKey('first-user'), improvementReminderKey('second-user'));
console.log('Verified scripture aspect bounds and persistent 30-day reminder timing.');
