import { mountAdminPage } from '@/features/admin/admin-page.js';
import { createReportDetail } from '@/features/admin/report-detail.js';

/**
 * D36 / D37 / M29 — Detalle de reporte.
 * Evidencia, cronología, relacionados y decisiones con motivo obligatorio.
 */
export function createPage({ router, params }) {
  return mountAdminPage({
    active: 'reportes',
    title: 'Reportes',
    subtitle: 'Detalle del reporte',
    router,
    createContent: ({ refresh }) => createReportDetail({ router, id: params.id, refresh }),
  });
}
