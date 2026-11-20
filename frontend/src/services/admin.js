import { get, post } from '@/services/http.js';

/**
 * Servicio del panel de administración.
 *
 * El backend estable todavía no expone estos endpoints. Las rutas y formas son
 * provisionales y viven en frontend/docs/API.md hasta que exista el contrato
 * real. El guard local solo oculta la interfaz; el backend valida el permiso.
 */
export function loadAdminSummary() {
  return get('/admin/resumen');
}

export function loadAdminReports({
  estado = 'todos',
  categoria = '',
  tipo = '',
  fecha = '',
  q = '',
  page = 1,
} = {}) {
  const params = new URLSearchParams();

  if (estado && estado !== 'todos') {
    params.set('estado', estado);
  }

  if (categoria) {
    params.set('categoria', categoria);
  }

  if (tipo) {
    params.set('tipo', tipo);
  }

  if (fecha) {
    params.set('fecha', fecha);
  }

  if (q) {
    params.set('q', q);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();
  return get(`/admin/reportes${query ? `?${query}` : ''}`);
}

export function loadAdminReport(id) {
  return get(`/admin/reportes/${encodeURIComponent(id)}`);
}

export function markAdminReportReview(id) {
  return post(`/admin/reportes/${encodeURIComponent(id)}/en-revision`);
}

export function resolveAdminReport(id, nota) {
  return post(`/admin/reportes/${encodeURIComponent(id)}/resolver`, { nota });
}

export function rejectAdminReport(id, motivo) {
  return post(`/admin/reportes/${encodeURIComponent(id)}/rechazar`, { motivo });
}

export function moderateAdminContent(id, payload) {
  return post(`/admin/reportes/${encodeURIComponent(id)}/moderar`, payload);
}

export function loadAdminAppeals({ estado = 'todos', q = '', page = 1 } = {}) {
  const params = new URLSearchParams();

  if (estado && estado !== 'todos') {
    params.set('estado', estado);
  }

  if (q) {
    params.set('q', q);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();
  return get(`/admin/apelaciones${query ? `?${query}` : ''}`);
}

export function loadAdminAppeal(id) {
  return get(`/admin/apelaciones/${encodeURIComponent(id)}`);
}

export function acceptAdminAppeal(id, resolucion) {
  return post(`/admin/apelaciones/${encodeURIComponent(id)}/aceptar`, { resolucion });
}

export function rejectAdminAppeal(id, resolucion) {
  return post(`/admin/apelaciones/${encodeURIComponent(id)}/rechazar`, { resolucion });
}

export function loadAdminTickets({ estado = '', tema = '', q = '', page = 1 } = {}) {
  const params = new URLSearchParams();

  if (estado) {
    params.set('estado', estado);
  }

  if (tema) {
    params.set('tema', tema);
  }

  if (q) {
    params.set('q', q);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();
  return get(`/admin/soporte${query ? `?${query}` : ''}`);
}

export function loadAdminTicket(id) {
  return get(`/admin/soporte/${encodeURIComponent(id)}`);
}

export function respondAdminTicket(id, mensaje) {
  return post(`/admin/soporte/${encodeURIComponent(id)}/responder`, { mensaje });
}

export function setAdminTicketState(id, estado) {
  return post(`/admin/soporte/${encodeURIComponent(id)}/estado`, { estado });
}

export function loadAdminUsers({ filtro = 'todos', q = '', page = 1 } = {}) {
  const params = new URLSearchParams();

  if (filtro && filtro !== 'todos') {
    params.set('filtro', filtro);
  }

  if (q) {
    params.set('q', q);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();
  return get(`/admin/usuarios${query ? `?${query}` : ''}`);
}

export function loadAdminUser(id) {
  return get(`/admin/usuarios/${encodeURIComponent(id)}`);
}

export function suspendAdminUser(id, motivo) {
  return post(`/admin/usuarios/${encodeURIComponent(id)}/suspender`, { motivo });
}

export function reactivateAdminUser(id) {
  return post(`/admin/usuarios/${encodeURIComponent(id)}/reactivar`);
}

export function loadAdminArticles({ q = '', categoria = '', estado = '', page = 1 } = {}) {
  const params = new URLSearchParams();

  if (q) params.set('q', q);
  if (categoria) params.set('categoria', categoria);
  if (estado) params.set('estado', estado);
  if (page > 1) params.set('page', String(page));

  const query = params.toString();
  return get(`/admin/ayuda${query ? `?${query}` : ''}`);
}

export function loadAdminArticle(id) {
  return get(`/admin/ayuda/${encodeURIComponent(id)}`);
}

export function saveAdminArticle(payload) {
  return post('/admin/ayuda', payload);
}

export function setAdminArticleStatus(id, estado) {
  return post(`/admin/ayuda/${encodeURIComponent(id)}/estado`, { estado });
}

export function loadAdminCategories() {
  return get('/admin/ayuda/categorias');
}

export function saveAdminCategory(payload) {
  return post('/admin/ayuda/categorias', payload);
}

export function toggleAdminCategory(id) {
  return post(`/admin/ayuda/categorias/${encodeURIComponent(id)}/alternar`);
}

export function moveAdminCategory(id, direction) {
  return post(`/admin/ayuda/categorias/${encodeURIComponent(id)}/mover`, { direction });
}
