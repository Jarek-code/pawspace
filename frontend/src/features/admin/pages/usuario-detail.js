import { mountAdminPage } from '@/features/admin/admin-page.js';
import { createUserDetail } from '@/features/admin/user-detail.js';

/**
 * D46 — Detalle de usuario.
 * Ficha, mascotas, actividad y suspensión o reactivación.
 */
export function createPage({ router, params }) {
  return mountAdminPage({
    active: 'usuarios',
    title: 'Usuarios',
    subtitle: 'Detalle de la cuenta',
    router,
    createContent: ({ refresh }) => createUserDetail({ router, id: params.id, refresh }),
  });
}
