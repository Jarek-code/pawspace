import { mountAdminPage } from '@/features/admin/admin-page.js';
import { createReportQueue } from '@/features/admin/report-queue.js';

/**
 * D35 / D35b / M28 — Reportes.
 * Bandeja con pestañas por estado, filtros y tabla densa (tarjetas en móvil).
 */
export function createPage({ router, query }) {
  return mountAdminPage({
    active: 'reportes',
    title: 'Reportes',
    subtitle: 'Revisa lo que la comunidad reportó.',
    router,
    createContent: () => createReportQueue({ initialQ: query.get('q') || '' }),
  });
}
