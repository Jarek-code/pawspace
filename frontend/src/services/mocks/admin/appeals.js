import { ApiError } from '@/lib/errors.js';
import { adminAppeals } from '../fixtures/admin/appeals.js';
import { clone } from './shared.js';
import { reportsState } from './reports.js';

export const appealsState = { appeals: clone(adminAppeals) };

export function resetAppealsState() {
  appealsState.appeals = clone(adminAppeals);
}

const APPEAL_RANK = { PENDIENTE: 0, ACEPTADA: 1, RECHAZADA: 2 };

function appealEstadoFiltro(value) {
  switch (value) {
    case 'pendientes':
      return 'PENDIENTE';
    case 'aceptadas':
      return 'ACEPTADA';
    case 'rechazadas':
      return 'RECHAZADA';
    default:
      return null;
  }
}

function matchAppealQuery(appeal, q) {
  if (!q) {
    return true;
  }

  const needle = q.toLowerCase();
  return [appeal.id, appeal.nombre, appeal.handle, appeal.reporteId, appeal.motivo]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

export function adminAppealsPayload({ estado = 'todos', q = '', page = 1, pageSize = 8 } = {}) {
  const appeals = clone(appealsState.appeals);
  const estadoValue = appealEstadoFiltro(estado);

  const conteos = {
    pendientes: appeals.filter((appeal) => appeal.estado === 'PENDIENTE').length,
    aceptadas: appeals.filter((appeal) => appeal.estado === 'ACEPTADA').length,
    rechazadas: appeals.filter((appeal) => appeal.estado === 'RECHAZADA').length,
  };

  const filtered = appeals
    .filter((appeal) => (estadoValue ? appeal.estado === estadoValue : true))
    .filter((appeal) => matchAppealQuery(appeal, q));

  const total = filtered.length;
  const pagina = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || 8);
  const inicio = (pagina - 1) * size;

  const apelaciones = filtered
    .slice()
    .sort((a, b) => (APPEAL_RANK[a.estado] ?? 9) - (APPEAL_RANK[b.estado] ?? 9))
    .slice(inicio, inicio + size);

  return { apelaciones, total, pagina, paginaSize: size, conteos };
}

function findAdminAppeal(id) {
  const appeal = appealsState.appeals.find((item) => item.id === String(id));

  if (!appeal) {
    throw new ApiError('No encontramos esa apelación.', 404, { detail: 'Apelación inexistente' });
  }

  return appeal;
}

function requireResolucion(value) {
  const resolucion = String(value || '').trim();

  if (resolucion.length < 10 || resolucion.length > 500) {
    throw new ApiError('Escribe una resolución de al menos 10 caracteres.', 422, {
      detail: 'Resolución inválida',
    });
  }

  return resolucion;
}

export function adminAppealDetail(id) {
  const appeal = findAdminAppeal(id);
  const reporteOriginal = reportsState.reports.find((report) => report.id === appeal.reporteId);

  return {
    ...clone(appeal),
    reporteOriginal: reporteOriginal
      ? {
          id: reporteOriginal.id,
          titulo: reporteOriginal.titulo,
          categoriaLabel: reporteOriginal.categoriaLabel,
        }
      : null,
    resolucion: appeal.resolucion || null,
  };
}

export function acceptAdminAppeal(id, resolucion) {
  const appeal = findAdminAppeal(id);
  appeal.estado = 'ACEPTADA';
  appeal.resolucion = requireResolucion(resolucion);

  return clone(appeal);
}

export function rejectAdminAppeal(id, resolucion) {
  const appeal = findAdminAppeal(id);
  appeal.estado = 'RECHAZADA';
  appeal.resolucion = requireResolucion(resolucion);

  return clone(appeal);
}
