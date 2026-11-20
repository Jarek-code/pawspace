import { ApiError } from '@/lib/errors.js';
import { adminExtraTickets } from '../fixtures/admin/tickets.js';
import { supportFixture } from '../fixtures/help.js';
import { listSupportTickets, respondUserTicket, setUserTicketState } from '../help.slice.js';
import { clone, userTicketToAdmin } from './shared.js';

export const ticketsState = { tickets: clone(adminExtraTickets) };

export function resetTicketsState() {
  ticketsState.tickets = clone(adminExtraTickets);
}

/**
 * Bandeja compartida: los tickets creados en /soporte se suman a los casos de
 * demostración del panel. La persona de los tickets propios es la cuenta demo.
 * Los recién creados van primero, luego los casos de demostración y al final
 * los tickets anteriores de la cuenta.
 */
export function allTickets() {
  const userTickets = listSupportTickets().map(userTicketToAdmin);
  const demo = clone(ticketsState.tickets).map((ticket) => ({ ...ticket, recencia: 1 }));
  return [...demo, ...userTickets];
}

const TICKET_STATES = ['ABIERTA', 'EN_REVISION', 'ESPERANDO_USUARIO', 'RESUELTA', 'CERRADA'];

function ticketEstadoFiltro(value) {
  return TICKET_STATES.includes(value) ? value : null;
}

function matchTicketQuery(ticket, q) {
  if (!q) {
    return true;
  }

  const needle = q.toLowerCase();
  return [ticket.id, ticket.asunto, ticket.persona, ticket.correo]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

const TICKET_RANK = { ABIERTA: 0, EN_REVISION: 1, ESPERANDO_USUARIO: 2, RESUELTA: 3, CERRADA: 4 };

export function adminTicketsPayload({
  estado = '',
  tema = '',
  q = '',
  page = 1,
  pageSize = 8,
} = {}) {
  const tickets = allTickets();
  const estadoValue = ticketEstadoFiltro(estado);

  const conteos = {
    abiertas: tickets.filter((ticket) => ticket.estado === 'ABIERTA').length,
    enRevision: tickets.filter((ticket) => ticket.estado === 'EN_REVISION').length,
    esperando: tickets.filter((ticket) => ticket.estado === 'ESPERANDO_USUARIO').length,
    resueltas: tickets.filter((ticket) => ticket.estado === 'RESUELTA').length,
    cerradas: tickets.filter((ticket) => ticket.estado === 'CERRADA').length,
  };

  const filtered = tickets
    .filter((ticket) => (estadoValue ? ticket.estado === estadoValue : true))
    .filter((ticket) => (tema ? ticket.tema === tema : true))
    .filter((ticket) => matchTicketQuery(ticket, q));

  const total = filtered.length;
  const pagina = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || 8);
  const inicio = (pagina - 1) * size;

  const lista = filtered
    .slice()
    .sort((a, b) => (TICKET_RANK[a.estado] ?? 9) - (TICKET_RANK[b.estado] ?? 9))
    .slice(inicio, inicio + size)
    .map(({ recencia: _recencia, ...ticket }) => ticket);

  return { tickets: lista, total, pagina, paginaSize: size, conteos, temas: adminTemas() };
}

export function adminTemas() {
  const temas = new Map();

  for (const topic of supportFixture.topics) {
    temas.set(topic.value, topic.label);
  }

  for (const ticket of allTickets()) {
    if (!temas.has(ticket.tema)) {
      temas.set(ticket.tema, ticket.temaLabel || ticket.tema);
    }
  }

  return [...temas.entries()].map(([value, label]) => ({ value, label }));
}

function findTicketAny(id) {
  const demo = ticketsState.tickets.find((ticket) => ticket.id === String(id));

  if (demo) {
    return { ticket: demo, store: 'demo' };
  }

  const user = listSupportTickets().find((ticket) => ticket.id === String(id));

  if (user) {
    return { ticket: user, store: 'user' };
  }

  throw new ApiError('No encontramos esa solicitud.', 404, { detail: 'Solicitud inexistente' });
}

export function adminTicketDetail(id) {
  const { ticket } = findTicketAny(id);
  const normalizado = ticket.persona ? ticket : userTicketToAdmin(ticket);

  return {
    ...clone(normalizado),
    hilo: normalizado.cronologia || [],
    contacto: {
      persona: normalizado.persona || 'Sofía Ramírez',
      correo: normalizado.correo || 'sofia.ramirez@example.com',
    },
  };
}

export function respondAdminTicket(id, mensaje) {
  const texto = String(mensaje || '').trim();

  if (!texto) {
    throw new ApiError('Escribe una respuesta antes de enviarla.', 422, {
      detail: 'Respuesta vacía',
    });
  }

  const { ticket, store } = findTicketAny(id);

  if (store === 'demo') {
    ticket.ultimoMovimiento = texto;
    ticket.cronologia = [...(ticket.cronologia || []), { fecha: 'Ahora', texto, propio: true }];
    return clone(ticket);
  }

  return respondUserTicket(id, texto);
}

export function setAdminTicketState(id, estado) {
  if (!TICKET_STATES.includes(estado)) {
    throw new ApiError('Elige un estado válido.', 422, { detail: 'Estado inválido' });
  }

  const { ticket, store } = findTicketAny(id);

  if (store === 'demo') {
    ticket.estado = estado;
    ticket.ultimoMovimiento = `Estado: ${estado}`;
    ticket.cronologia = [
      ...(ticket.cronologia || []),
      { fecha: 'Ahora', texto: `Estado: ${estado}`, propio: true },
    ];
    return clone(ticket);
  }

  return setUserTicketState(id, estado);
}
