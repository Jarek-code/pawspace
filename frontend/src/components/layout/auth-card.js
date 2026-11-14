import { h } from '@/lib/dom.js';

/**
 * CMP-46 — AuthCard.
 * Superficie, título h1, subtítulo, contenido y pie auxiliar.
 */
export function createAuthCard({ title = '', subtitle = '', children = null, footer = null } = {}) {
  return h(
    'section',
    {
      class: 'ps-auth-card',
      attrs: { 'aria-label': title ? `Formulario: ${title}` : null },
    },
    h(
      'header',
      { class: 'ps-auth-card__header' },
      h('h1', { class: 'ps-auth-card__title', text: title }),
      subtitle ? h('p', { class: 'ps-auth-card__subtitle', text: subtitle }) : null,
    ),
    children,
    footer ? h('div', { class: 'ps-auth-card__footer' }, footer) : null,
  );
}
