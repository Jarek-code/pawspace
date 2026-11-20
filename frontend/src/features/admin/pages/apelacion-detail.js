import { mountAdminPage } from '@/features/admin/admin-page.js';
import { createAppealDetail } from '@/features/admin/appeal-detail.js';

/**
 * D39 — Detalle de apelación.
 * Reporte original y decisión de aceptar o rechazar con resolución.
 */
export function createPage({ router, params }) {
  return mountAdminPage({
    active: 'apelaciones',
    title: 'Apelaciones',
    subtitle: 'Detalle de la apelación',
    router,
    createContent: ({ refresh }) => createAppealDetail({ router, id: params.id, refresh }),
  });
}
