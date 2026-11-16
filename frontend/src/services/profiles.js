import { get, patch, post } from '@/services/http.js';

/**
 * Servicio de perfiles de mascota.
 *
 * El backend estable todavía no expone estos endpoints; el adaptador de mocks
 * devuelve la misma forma que espera la UI (ver docs/API.md).
 */
export async function loadOwnProfile() {
  return get('/perfiles/mios');
}

export async function loadProfile(handle) {
  const clean = String(handle || '').replace(/^@/, '');
  return get(`/perfiles/${encodeURIComponent(clean)}`);
}

export async function updateOwnProfile(data) {
  return patch('/perfiles/mios', data);
}

export async function toggleFollow(handle) {
  const clean = String(handle || '').replace(/^@/, '');
  return post(`/perfiles/${encodeURIComponent(clean)}/seguir`);
}

export async function reportProfile(handle) {
  const clean = String(handle || '').replace(/^@/, '');
  return post(`/perfiles/${encodeURIComponent(clean)}/reportar`);
}

export async function toggleBlock(handle) {
  const clean = String(handle || '').replace(/^@/, '');
  return post(`/perfiles/${encodeURIComponent(clean)}/bloquear`);
}
