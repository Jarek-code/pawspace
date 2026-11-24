import { ApiError } from '@/lib/errors.js';
import { adminReports } from '../fixtures/admin/reports.js';
import { adminUserIdByHandle } from './users.js';
import { clone, requireMotivo, tipoLabel } from './shared.js';

const ESTADO_RANK = { PENDIENTE: 0, EN_REVISION: 1, RESUELTO: 2, RECHAZADO: 3 };

export const reportsState = { reports: clone(adminReports) };

export function resetReportsState() {
  reportsState.reports = clone(adminReports);
}

function reportConteos(reports) {
  return {
    pendientes: reports.filter((report) => report.estado === 'PENDIENTE').length,
    enRevision: reports.filter((report) => report.estado === 'EN_REVISION').length,
    resueltos: reports.filter((report) => report.estado === 'RESUELTO').length,
    rechazados: reports.filter((report) => report.estado === 'RECHAZADO').length,
  };
}

function estadoFiltro(value) {
  switch (value) {
    case 'pendientes':
      return 'PENDIENTE';
    case 'en-revision':
      return 'EN_REVISION';
    case 'resueltos':
      return 'RESUELTO';
    case 'rechazados':
      return 'RECHAZADO';
    default:
      return null;
  }
}

function matchReportQuery(report, q) {
  if (!q) {
    return true;
  }

  const needle = q.toLowerCase();
  return [
    report.id,
    report.titulo,
    report.nombre,
    report.handle,
    report.reportadoPor,
    report.contenido,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

function sortReports(reports) {
  return reports
    .slice()
    .sort(
      (a, b) =>
        (ESTADO_RANK[a.estado] ?? 9) - (ESTADO_RANK[b.estado] ?? 9) || b.minutos - a.minutos,
    );
}

function fechaFiltro(value) {
  switch (value) {
    case 'hoy':
      return (minutos) => minutos < 1440;
    case 'semana':
      return (minutos) => minutos >= 1440 && minutos < 10080;
    case 'anteriores':
      return (minutos) => minutos >= 10080;
    default:
      return null;
  }
}

export function adminReportsPayload({
  estado = 'todos',
  categoria = '',
  tipo = '',
  fecha = '',
  q = '',
  page = 1,
  pageSize = 8,
} = {}) {
  const reports = clone(reportsState.reports);
  const conteos = reportConteos(reports);
  const estadoValue = estadoFiltro(estado);
  const fechaFn = fechaFiltro(fecha);

  const filtered = reports
    .filter((report) => (estadoValue ? report.estado === estadoValue : true))
    .filter((report) => (categoria ? report.categoria === categoria : true))
    .filter((report) => (tipo ? report.tipo === tipo : true))
    .filter((report) => (fechaFn ? fechaFn(report.minutos) : true))
    .filter((report) => matchReportQuery(report, q));

  const total = filtered.length;
  const pagina = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || 8);
  const inicio = (pagina - 1) * size;
  const reportes = sortReports(filtered)
    .slice(inicio, inicio + size)
    .map((report) => ({ ...report, tipoLabel: tipoLabel(report.tipo) }));

  return {
    reportes,
    total,
    pagina,
    paginaSize: size,
    abiertos: conteos.pendientes + conteos.enRevision,
    conteos,
  };
}

function findAdminReport(id) {
  const report = reportsState.reports.find((item) => item.id === String(id));

  if (!report) {
    throw new ApiError('No encontramos ese reporte.', 404, { detail: 'Reporte inexistente' });
  }

  return report;
}

function formattedDate(minutos) {
  const date = new Date(Date.now() - minutos * 60_000);
  return date.toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function countBy(reports, key, value) {
  return reports.filter((report) => report[key] === value).length;
}

export function adminReportDetail(id) {
  const report = findAdminReport(id);
  const reports = reportsState.reports;

  const relacionados = reports
    .filter((item) => item.id !== report.id && item.handle === report.handle)
    .slice(0, 2);

  return {
    ...clone(report),
    tipoLabel: tipoLabel(report.tipo),
    denunciante: {
      id: adminUserIdByHandle(report.reportadoPor),
      handle: report.reportadoPor,
      nombre: report.reportadoPor?.replace('@', '') || 'Persona',
      reportes: countBy(reports, 'reportadoPor', report.reportadoPor),
    },
    denunciado: {
      id: adminUserIdByHandle(report.handle),
      handle: report.handle,
      nombre: report.nombre,
      reportes: countBy(reports, 'objetivo', report.handle),
    },
    relacionados,
    metadatos: {
      id: report.id,
      creado: formattedDate(report.minutos),
      categoria: report.categoriaLabel,
      origen: 'Web',
    },
    contenidoNoDisponible: Boolean(
      report.accion && ['ocultar', 'eliminar'].includes(report.accion),
    ),
    accion: report.accion || null,
    suspension: report.suspension || null,
    resolucion: report.resolucion || null,
    motivo: report.motivo || null,
  };
}

function pushEvent(report, texto) {
  report.cronologia = report.cronologia || [];
  report.cronologia.push({ fecha: 'Ahora', texto });
}

export function markAdminReportReview(id) {
  const report = findAdminReport(id);

  if (report.estado !== 'PENDIENTE') {
    throw new ApiError('Solo puedes revisar reportes pendientes.', 409, {
      detail: 'Estado no modificable',
    });
  }

  report.estado = 'EN_REVISION';
  pushEvent(report, 'La administradora marcó el reporte en revisión.');

  return clone(report);
}

export function resolveAdminReport(id, nota) {
  const report = findAdminReport(id);
  const motivo = requireMotivo(nota);

  report.estado = 'RESUELTO';
  report.resolucion = motivo;
  pushEvent(report, `Reporte resuelto: ${motivo}`);

  return clone(report);
}

export function rejectAdminReport(id, motivo) {
  const report = findAdminReport(id);
  const razon = requireMotivo(motivo);

  report.estado = 'RECHAZADO';
  report.motivo = razon;
  pushEvent(report, `Reporte rechazado: ${razon}`);

  return clone(report);
}

export function moderateAdminContent(id, { accion, motivo }) {
  const report = findAdminReport(id);

  if (!['ocultar', 'eliminar', 'suspender'].includes(accion)) {
    throw new ApiError('Elige una acción de moderación.', 422, { detail: 'Acción inválida' });
  }

  const razon = requireMotivo(motivo);

  report.accion = accion;
  report.estado = 'RESUELTO';

  if (accion === 'suspender') {
    report.suspension = { handle: report.handle, motivo: razon, indefinida: true };
    pushEvent(report, `Se suspendió la cuenta ${report.handle}: ${razon}`);
  } else {
    pushEvent(report, `Contenido ${accion === 'ocultar' ? 'oculto' : 'eliminado'}: ${razon}`);
  }

  return clone(report);
}
