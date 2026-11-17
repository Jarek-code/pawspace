import { get, post } from '@/services/http.js';

/**
 * Servicio de mensajería directa.
 *
 * La conversación se identifica por el handle de la otra mascota. Las
 * solicitudes se resuelven aparte para no mezclarlas con la bandeja.
 */
function cleanHandle(handle) {
  return encodeURIComponent(String(handle || '').replace(/^@/, ''));
}

export async function loadInbox() {
  return get('/mensajes');
}

export async function loadConversation(handle) {
  return get(`/mensajes/${cleanHandle(handle)}`);
}

export async function sendMessage(handle, { texto = '', adjunto = null } = {}) {
  return post(`/mensajes/${cleanHandle(handle)}`, { texto, adjunto });
}

export async function acceptRequest(handle) {
  return post(`/mensajes/solicitudes/${cleanHandle(handle)}/aceptar`);
}

export async function ignoreRequest(handle) {
  return post(`/mensajes/solicitudes/${cleanHandle(handle)}/ignorar`);
}

export async function toggleSilence(handle) {
  return post(`/mensajes/${cleanHandle(handle)}/silenciar`);
}

export async function toggleBlock(handle) {
  return post(`/mensajes/${cleanHandle(handle)}/bloquear`);
}

export async function reportConversation(handle, { categoria = 'OTRO', detalle = '' } = {}) {
  return post(`/mensajes/${cleanHandle(handle)}/reportar`, { categoria, detalle });
}
