import { h } from '@/lib/dom.js';
import { createIcon } from './icon.js';

let modalCounter = 0;

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * CMP-36 — Modal.
 * Overlay, panel centrado, título, cierre por Esc, X y clic en el overlay.
 * Atrapa el foco, lo devuelve al cerrar y bloquea el scroll del documento.
 */
export function createModal({
  title = '',
  description = '',
  children = null,
  size = 'md',
  variant = 'default',
  closeOnOverlay = true,
  onClose = null,
} = {}) {
  modalCounter += 1;
  const titleId = `ps-modal-title-${modalCounter}`;
  const descriptionId = description ? `ps-modal-description-${modalCounter}` : '';

  const closeButton = h(
    'button',
    {
      class: 'ps-modal__close',
      type: 'button',
      attrs: { 'aria-label': 'Cerrar' },
    },
    createIcon('x', { size: 22 }),
  );

  const header = h(
    'header',
    { class: 'ps-modal__header' },
    h('h2', { class: 'ps-modal__title', id: titleId, text: title }),
    closeButton,
  );

  const body = h(
    'div',
    { class: 'ps-modal__body' },
    description
      ? h('p', { class: 'ps-modal__description', id: descriptionId, text: description })
      : null,
    children,
  );

  const panel = h(
    'div',
    {
      class: `ps-modal__panel ps-modal__panel--${size}`,
      role: 'dialog',
      attrs: {
        'aria-modal': 'true',
        'aria-labelledby': titleId,
        'aria-describedby': descriptionId || null,
      },
    },
    header,
    body,
  );

  const element = h(
    'div',
    {
      class: ['ps-modal', variant === 'sheet' ? 'ps-modal--sheet' : ''].filter(Boolean).join(' '),
      attrs: { hidden: true },
    },
    panel,
  );

  let isOpen = false;
  let previousFocus = null;
  let previousOverflow = '';

  function focusable() {
    return Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
      (node) => node.offsetParent !== null || node === document.activeElement,
    );
  }

  function handlePopState() {
    close({ notify: false });
  }

  function open() {
    if (isOpen) {
      return;
    }

    isOpen = true;
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.hidden = false;
    window.addEventListener('popstate', handlePopState);

    window.requestAnimationFrame(() => {
      const target = panel.querySelector('[data-autofocus]') || focusable()[0] || panel;
      target.focus({ preventScroll: true });
    });
  }

  function close({ notify = true } = {}) {
    if (!isOpen) {
      return;
    }

    isOpen = false;
    element.hidden = true;
    document.body.style.overflow = previousOverflow;
    window.removeEventListener('popstate', handlePopState);

    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus({ preventScroll: true });
    }

    if (notify && onClose) {
      onClose();
    }
  }

  closeButton.addEventListener('click', close);

  element.addEventListener('click', (event) => {
    if (closeOnOverlay && event.target === element) {
      close();
    }
  });

  element.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const nodes = focusable();

    if (!nodes.length) {
      event.preventDefault();
      panel.focus({ preventScroll: true });
      return;
    }

    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    if (
      event.shiftKey &&
      (document.activeElement === first || !panel.contains(document.activeElement))
    ) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  panel.setAttribute('tabindex', '-1');

  return {
    element,
    panel,
    body,
    open,
    close,
    isOpen: () => isOpen,
  };
}
