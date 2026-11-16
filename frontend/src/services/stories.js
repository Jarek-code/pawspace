import { del, get, post } from '@/services/http.js';

/**
 * Servicio de historias.
 *
 * Sin texto superpuesto, audiencia ni respuestas: database/schema.sql solo
 * define HISTORIA, HISTORIA_ADJUNTO, HISTORIA_VISTA y ME_GUSTA_HISTORIA.
 */
export async function loadStoryViewer(handle) {
  const clean = String(handle || '').replace(/^@/, '');
  return get(`/historias/${encodeURIComponent(clean)}`);
}

export async function loadStoryArchive() {
  return get('/historias/archivo');
}

export async function createStory({ media, mascota }) {
  return post('/historias', { media, mascota });
}

export async function markStoryView(id) {
  return post(`/historias/${encodeURIComponent(id)}/vista`);
}

export async function toggleStoryLike(id) {
  return post(`/historias/${encodeURIComponent(id)}/me-gusta`);
}

export async function deleteStory(id) {
  return del(`/historias/${encodeURIComponent(id)}`);
}
