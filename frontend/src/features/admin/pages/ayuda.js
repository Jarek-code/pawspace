import { mountAdminPage } from '@/features/admin/admin-page.js';
import { createArticleQueue } from '@/features/admin/article-queue.js';

/**
 * D42 / M32 — Artículos de ayuda.
 * Lista de artículos con estado, lectura, orden y actualización.
 */
export function createPage({ router }) {
  return mountAdminPage({
    active: 'ayuda',
    title: 'Artículos de ayuda',
    subtitle: 'Administra el centro de ayuda.',
    router,
    createContent: () => createArticleQueue({ router }),
  });
}
