import { del, get, patch, post } from '@/services/http.js';

/**
 * Servicio de configuración de la persona y de su mascota activa.
 *
 * El backend estable todavía no expone estos endpoints. Las rutas y formas
 * son provisionales y viven en docs/API.md hasta que exista el contrato real.
 */
export function loadSettings() {
  return get('/ajustes');
}

export function updateAccount(data) {
  return patch('/ajustes/cuenta', data);
}

export function updatePrivacy(data) {
  return patch('/ajustes/privacidad', data);
}

export function updateFilters(data) {
  return patch('/ajustes/seguridad', data);
}

export function closeSession(id) {
  return del(`/ajustes/sesiones/${encodeURIComponent(id)}`);
}

export function closeAllSessions() {
  return del('/ajustes/sesiones');
}

export function unblockAccount(handle) {
  const clean = String(handle || '').replace(/^@/, '');
  return del(`/ajustes/bloqueos/${encodeURIComponent(clean)}`);
}

export function appealReport(id) {
  return post(`/ajustes/reportes/${encodeURIComponent(id)}/apelar`);
}

export function changePassword(data) {
  return post('/ajustes/contrasena', data);
}

export function requestDataDownload() {
  return post('/ajustes/descargar');
}

export function deleteAccount(handle) {
  return del(`/ajustes/cuenta?handle=${encodeURIComponent(handle)}`);
}
