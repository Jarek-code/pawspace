import { mountAdminPage } from '@/features/admin/admin-page.js';
import { createTicketQueue } from '@/features/admin/ticket-queue.js';

/**
 * D40 / M30 — Soporte.
 * Bandeja de tickets con pestañas por estado, filtro de tema y búsqueda.
 */
export function createPage({ router }) {
  return mountAdminPage({
    active: 'soporte',
    title: 'Soporte',
    subtitle: 'Responde las solicitudes de la comunidad.',
    router,
    createContent: () => createTicketQueue(),
  });
}
