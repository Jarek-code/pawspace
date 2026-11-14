import { createButton } from '@/components/primitives/button.js';
import { h } from '@/lib/dom.js';

/**
 * D33 / M26 — Página no encontrada.
 */
export function createPage({ router } = {}) {
  const home = createButton({
    label: 'Volver al inicio',
    onClick: () => router.navigate('/'),
  });

  return h(
    'main',
    { id: 'contenido', class: 'ps-placeholder' },
    h('h1', { class: 'ps-placeholder__title', text: 'No encontramos esta página' }),
    h('p', {
      class: 'ps-placeholder__text',
      text: 'Revisa la dirección o vuelve al inicio para seguir con tu mascota.',
    }),
    h('div', { class: 'ps-placeholder__actions' }, home.element),
  );
}
