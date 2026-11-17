import { profiles, profileSuggestions, similarProfiles } from './fixtures/profiles.js';

export const profilesState = Object.fromEntries(
  Object.entries(profiles).map(([handle, profile]) => [
    handle,
    {
      ...profile,
      stats: { ...profile.stats },
      publicaciones: profile.publicaciones.map((post) => ({ ...post })),
    },
  ]),
);

export const followingState = new Set(['@luna', '@kira']);
export const pendingState = new Set();
export const blockedState = new Set(['@toby', '@coco']);
export const reportedState = new Set();

export const suggestionHandles = [...profileSuggestions];

export const similarByHandle = { ...similarProfiles };

export function findProfile(handle) {
  const clean = String(handle || '').toLowerCase();
  const key = clean.startsWith('@') ? clean : `@${clean}`;
  return profilesState[key] || null;
}
