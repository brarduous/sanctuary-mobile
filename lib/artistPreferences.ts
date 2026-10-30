import type { SpotifyArtist } from './api';

export function isSameArtist(first: SpotifyArtist, second: SpotifyArtist): boolean {
  if (first.id && second.id) return first.id === second.id;
  return first.name === second.name;
}

export function toggleArtistPreference(current: SpotifyArtist[], artist: SpotifyArtist): SpotifyArtist[] {
  if (current.some(item => isSameArtist(item, artist))) {
    return current.filter(item => !isSameArtist(item, artist));
  }
  return current.length < 5 ? [...current, artist] : current;
}
