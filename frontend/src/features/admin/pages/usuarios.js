import { mountAdminPage } from '@/features/admin/admin-page.js';
import { createUserQueue } from '@/features/admin/user-queue.js';

/**
 * D45 / M33 — Usuarios.
 * Lista de cuentas con filtros y búsqueda.
 */
export function createPage({ router }) {
  return mountAdminPage({
    active: 'usuarios',
    title: 'Usuarios',
    subtitle: 'Consulta cuentas y suspende accesos.',
    router,
    createContent: () => createUserQueue(),
  });
}
