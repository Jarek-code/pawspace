import { h } from '@/lib/dom.js';

/**
 * CMP-27 — Spinner.
 * Si no recibe label se considera decorativo y queda fuera del árbol de
 * accesibilidad; el texto de carga debe anunciarse en el contenedor.
 */
export function createSpinner({ size = 'md', label = '' } = {}) {
  const attrs = label ? { role: 'status', 'aria-label': label } : { 'aria-hidden': 'true' };

  return h('span', {
    class: `ps-spinner ps-spinner--${size}`,
    attrs,
  });
}
