import { get, post } from '@/services/http.js';

/**
 * Servicio de avisos.
 *
 * Sin endpoints en el backend estable: el adaptador de mocks devuelve la
 * forma provisional documentada en docs/API.md.
 */
export async function loadNotifications() {
  return get('/notificaciones');
}

export async function markNotificationRead(id) {
  return post(`/notificaciones/${encodeURIComponent(id)}/leer`);
}

export async function markAllNotificationsRead() {
  return post('/notificaciones/leer-todas');
}
