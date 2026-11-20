import { mountAdminPage } from '@/features/admin/admin-page.js';
import { createCategoryManager } from '@/features/admin/category-manager.js';

/**
 * D44 — Categorías de ayuda.
 * Crea, edita, activa, desactiva y reordena categorías.
 */
export function createPage({ router }) {
  return mountAdminPage({
    active: 'ayuda',
    title: 'Categorías de ayuda',
    subtitle: 'Ordena y activa las categorías del centro de ayuda.',
    router,
    createContent: ({ refresh }) => createCategoryManager({ refresh }),
  });
}
