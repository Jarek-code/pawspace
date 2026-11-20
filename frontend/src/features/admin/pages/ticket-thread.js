import { mountAdminPage } from '@/features/admin/admin-page.js';
import { createTicketThread } from '@/features/admin/ticket-thread.js';

/**
 * D41 / M31 — Conversación de soporte.
 * Hilo, contacto y compositor de respuesta.
 */
export function createPage({ router, params }) {
  return mountAdminPage({
    active: 'soporte',
    title: 'Soporte',
    subtitle: 'Conversación de soporte',
    router,
    createContent: ({ refresh }) => createTicketThread({ router, id: params.id, refresh }),
  });
}
