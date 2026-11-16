import { get } from '@/services/http.js';

const RECENT_KEY = 'pawspace.recentSearches';

function readRecent() {
  try {
    const value = localStorage.getItem(RECENT_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeRecent(items) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, 6)));
  } catch {
    // Sin almacenamiento, las búsquedas duran lo que la pestaña.
  }
}

export async function loadExplore() {
  const data = await get('/explorar');
  const stored = readRecent();

  return {
    ...data,
    busquedasRecientes: stored ?? data.busquedasRecientes ?? [],
  };
}

export async function search({ q = '', especie = '', raza = '', orden = 'relevancia' } = {}) {
  const params = new URLSearchParams();

  if (q) {
    params.set('q', q);
  }

  if (especie) {
    params.set('especie', especie);
  }

  if (raza) {
    params.set('raza', raza);
  }

  if (orden) {
    params.set('orden', orden);
  }

  return get(`/buscar?${params.toString()}`);
}

export function addRecentSearch(term) {
  const clean = String(term || '').trim();

  if (clean.length < 2) {
    return [];
  }

  const current = readRecent() || [];
  const next = [clean, ...current.filter((item) => item.toLowerCase() !== clean.toLowerCase())];
  writeRecent(next);
  return next.slice(0, 6);
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // Nada que limpiar.
  }

  return [];
}
