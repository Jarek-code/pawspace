import { h } from '@/lib/dom.js';
import { createIcon } from './icon.js';

let region = null;

const MAX_TOASTS = 5;
const timers = new WeakMap();

function scheduleRemoval(element, duration) {
  const current = timers.get(element);
  if (current) {
    window.clearTimeout(current);
  }

  if (duration > 0) {
    timers.set(
      element,
      window.setTimeout(() => {
        timers.delete(element);
        element.remove();
      }, duration),
    );
  } else {
    timers.delete(element);
  }
}

function removeToast(element) {
  const current = timers.get(element);
  if (current) {
    window.clearTimeout(current);
    timers.delete(element);
  }
  element.remove();
}

function trimToasts(host) {
  while (host.children.length > MAX_TOASTS) {
    removeToast(host.firstElementChild);
  }
}

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
  const existing = Array.from(host.children).find(
    (child) => child.dataset.psToastMessage === message,
  );

  if (existing) {
    host.append(existing);
    scheduleRemoval(existing, duration);
    return existing;
  }

  const icon = variant === 'error' ? 'alert' : 'circle-check';
  const element = h(
    'div',
    { class: `ps-toast ps-toast--${variant}`, attrs: { 'data-ps-toast-message': message } },
    h('span', { class: 'ps-toast__icon', 'aria-hidden': 'true' }, createIcon(icon, { size: 18 })),
    h('p', { class: 'ps-toast__message', text: message }),
  );

  const close = h(
    'button',
    {
      class: 'ps-toast__close',
      type: 'button',
      attrs: { 'aria-label': 'Cerrar aviso' },
      onClick: () => removeToast(element),
    },
    createIcon('x', { size: 16 }),
  );

  element.append(close);
  host.append(element);
  trimToasts(host);
  scheduleRemoval(element, duration);

  return element;
}
