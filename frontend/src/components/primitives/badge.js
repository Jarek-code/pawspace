import { h } from '@/lib/dom.js';

/**
 * CMP-04 — Badge.
 * Pequeño contador o etiqueta de estado. El color nunca es la única señal:
 * el número o texto viaja en el nombre accesible del elemento que lo contiene.
 */
export function createBadge({ label = '', variant = 'primary', icon = null, className = '' } = {}) {
  return h(
    'span',
    {
      class: [`ps-badge ps-badge--${variant}`, className].filter(Boolean).join(' '),
    },
    icon ? h('span', { class: 'ps-badge__icon', 'aria-hidden': 'true' }, icon) : null,
    label ? h('span', { class: 'ps-badge__label', text: label }) : null,
  );
}
