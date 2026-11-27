import { getSession } from '@/lib/storage.js';
import { adminActivity, adminSystem } from '../fixtures/admin/system.js';
import { ACTIVE_TICKET_STATES, clone } from './shared.js';
import { reportsState, resetReportsState } from './reports.js';
import { appealsState, resetAppealsState } from './appeals.js';
import { allTickets, resetTicketsState } from './tickets.js';
import { resetUsersState } from './users.js';
import { resetArticlesState } from './articles.js';

export function resetAdminState() {
  resetReportsState();
  resetAppealsState();
  resetTicketsState();
  resetUsersState();
  resetArticlesState();
}

export function adminSummaryPayload() {
  const reports = clone(reportsState.reports);
  const tickets = allTickets();
  const appeals = clone(appealsState.appeals);
  const session = getSession();

  const pendingReports = reports.filter((report) => report.estado === 'PENDIENTE');
  const reviewReports = reports.filter((report) => report.estado === 'EN_REVISION');
  const activeTickets = tickets.filter((ticket) => ACTIVE_TICKET_STATES.has(ticket.estado));
  const openTickets = activeTickets.filter((ticket) => ticket.estado === 'ABIERTA');
  const pendingAppeals = appeals.filter((appeal) => appeal.estado === 'PENDIENTE');
  const total =
    pendingReports.length + reviewReports.length + activeTickets.length + pendingAppeals.length;
  const nuevasHoy =
    pendingReports.filter((report) => report.minutos < 1440).length +
    pendingAppeals.filter((appeal) => appeal.nueva).length +
    openTickets.length;
  const vencen24h =
    pendingReports.filter((report) => report.minutos >= 1440).length +
    reviewReports.filter((report) => report.minutos >= 1440).length;

  return {
    cuenta: {
      nombre: 'Mariana Ortega',
      email: session.email || 'mariana.ortega@pawspace.com',
      rol: 'Administradora',
    },
    resumen: { total, nuevasHoy, vencen24h },
    metricas: {
      reportesPendientes: {
        valor: pendingReports.length,
        nota: `${pendingReports.filter((report) => report.minutos < 1440).length} nuevas hoy`,
      },
      enRevision: {
        valor: reviewReports.length,
        nota: `${reviewReports.filter((report) => report.minutos >= 1440).length} con más de 24 h`,
      },
      ticketsAbiertos: {
        valor: activeTickets.length,
        nota: `${openTickets.length} esperan respuesta`,
      },
      apelacionesPendientes: {
        valor: pendingAppeals.length,
        nota: `${pendingAppeals.filter((appeal) => appeal.nueva).length} nuevas hoy`,
      },
    },
    reportesRecientes: reports
      .slice()
      .sort((a, b) => a.minutos - b.minutos)
      .slice(0, 4),
    ticketsRecientes: tickets
      .slice()
      .sort((a, b) => b.recencia - a.recencia || Number(b.id) - Number(a.id))
      .slice(0, 4)
      .map(({ recencia: _recencia, ...ticket }) => ticket),
    apelacionesRecientes: pendingAppeals.slice(0, 3),
    actividad: clone(adminActivity),
    sistema: clone(adminSystem),
  };
}
