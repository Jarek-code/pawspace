import { get, post } from '@/services/http.js';

/**
 * Servicio del centro de ayuda y soporte.
 *
 * Sin endpoints en el backend estable: el adaptador de mocks devuelve la
 * forma provisional documentada en frontend/docs/API.md.
 */
export function loadHelpCenter({ q = '', categoria = '' } = {}) {
  const params = new URLSearchParams();

  if (q) {
    params.set('q', q);
  }

  if (categoria) {
    params.set('categoria', categoria);
  }

  const query = params.toString();
  return get(`/ayuda${query ? `?${query}` : ''}`);
}

export function loadHelpArticle(slug) {
  return get(`/ayuda/${encodeURIComponent(slug)}`);
}

export function sendHelpFeedback(slug, value) {
  return post(`/ayuda/${encodeURIComponent(slug)}/feedback`, { valor: value });
}

export function loadSupport() {
  return get('/soporte');
}

export function createSupportTicket(payload) {
  return post('/soporte', payload);
}

export function reopenSupportTicket(id) {
  return post(`/soporte/${encodeURIComponent(id)}/reabrir`);
}
