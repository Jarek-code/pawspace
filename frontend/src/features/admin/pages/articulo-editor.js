import { mountAdminPage } from '@/features/admin/admin-page.js';
import { createArticleEditor } from '@/features/admin/article-editor.js';

/**
 * D43 — Crear o editar un artículo de ayuda.
 * Campos + textarea + vista previa de lectura.
 */
export function createPage({ router, params }) {
  return mountAdminPage({
    active: 'ayuda',
    title: 'Artículos de ayuda',
    subtitle: params.id ? 'Editar artículo' : 'Nuevo artículo',
    router,
    createContent: ({ refresh }) => createArticleEditor({ router, id: params.id || null, refresh }),
  });
}
