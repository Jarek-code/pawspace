import { h } from '@/lib/dom.js';
import { createIcon } from './icon.js';

/**
 * CMP-29 — EmptyState.
 * Mensaje centrado con icono o ilustración, titular, texto y una acción.
 * Se usa para el feed vacío y para listas sin resultados.
 */
export function createEmptyState({
  icon = 'paw-print',
  title = '',
  body = '',
  action = null,
} = {}) {
  return h(
    'section',
    { class: 'ps-empty-state', attrs: { role: 'status' } },
    h('span', { class: 'ps-empty-state__icon', 'aria-hidden': 'true' }, createIcon(icon, { size: 40 })),
    h('h2', { class: 'ps-empty-state__title', text: title }),
    body ? h('p', { class: 'ps-empty-state__body', text: body }) : null,
    action ? h('div', { class: 'ps-empty-state__action' }, action) : null,
  );
}
