import { mountAdminPage } from '@/features/admin/admin-page.js';
import { createAppealQueue } from '@/features/admin/appeal-queue.js';

/**
 * D38 — Apelaciones.
 * Lista de solicitudes de revisión con pestañas por estado y búsqueda.
 */
export function createPage({ router }) {
  return mountAdminPage({
    active: 'apelaciones',
    title: 'Apelaciones',
    subtitle: 'Revisa las solicitudes de revisión.',
    router,
    createContent: () => createAppealQueue(),
  });
}
