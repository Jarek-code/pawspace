import { h } from '@/lib/dom.js';
import { createIcon } from './icon.js';

let region = null;

function ensureRegion() {
  if (region && region.isConnected) {
    return region;
  }

  region = h('div', {
    class: 'ps-toast-region',
    attrs: { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' },
  });
  document.body.append(region);
  return region;
}

/**
 * CMP-26 — Toast. Aviso breve, no modal y con cierre accesible.
 */
export function showToast(message, { variant = 'success', duration = 4000 } = {}) {
  const host = ensureRegion();
  const icon = variant === 'error' ? 'alert' : 'circle-check';
  const element = h(
    'div',
    { class: `ps-toast ps-toast--${variant}` },
    h('span', { class: 'ps-toast__icon', 'aria-hidden': 'true' }, createIcon(icon, { size: 18 })),
    h('p', { class: 'ps-toast__message', text: message }),
  );

  const close = h(
    'button',
    {
      class: 'ps-toast__close',
      type: 'button',
      attrs: { 'aria-label': 'Cerrar aviso' },
      onClick: () => element.remove(),
    },
    createIcon('x', { size: 16 }),
  );

  element.append(close);
  host.append(element);

  if (duration > 0) {
    window.setTimeout(() => element.remove(), duration);
  }

  return element;
}
