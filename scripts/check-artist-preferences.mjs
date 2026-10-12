import assert from 'node:assert/strict';
import { isSameArtist, toggleArtistPreference } from '../lib/artistPreferences.ts';

const first = { name: 'CeCe Winans' };
const second = { name: 'Kirk Franklin' };
assert.equal(isSameArtist(first, second), false, 'missing IDs must not select unrelated rows');
assert.deepEqual(toggleArtistPreference([first], second), [first, second], 'adding a name-only artist preserves existing choices');
assert.deepEqual(toggleArtistPreference([first, second], first), [second], 'removal affects only the chosen name-only artist');
assert.equal(isSameArtist(first, { id: 'spotify-cece', name: first.name }), true, 'saved name-only preference matches loaded artist');
assert.equal(isSameArtist({ id: 'same', name: 'Old name' }, { id: 'same', name: 'New name' }), true, 'stable ID survives a renamed artist');
assert.equal(isSameArtist({ id: 'first', name: 'Same name' }, { id: 'second', name: 'Same name' }), false, 'different Spotify IDs identify separate artists even with identical names');
const five = Array.from({ length: 5 }, (_, index) => ({ id: String(index), name: `Artist ${index}` }));
assert.deepEqual(toggleArtistPreference(five, second), five, 'sixth selection does not replace a saved choice');
const four = toggleArtistPreference(five, five[2]);
assert.equal(four.length, 4, 'selected artists remain removable at the limit');
assert.equal(toggleArtistPreference(four, second).length, 5, 'removal makes room for another choice');
console.log('Verified name-only artist identity, selective removal and five-choice recovery.');
