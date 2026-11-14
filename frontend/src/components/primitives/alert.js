import { h } from '@/lib/dom.js';
import { createIcon } from './icon.js';

const ICON_BY_VARIANT = {
  info: 'alert',
  success: 'check',
  warning: 'warning',
  error: 'alert',
};

/**
 * CMP-25 — Alert.
 * Los errores y advertencias usan role="alert"; info y éxito usan role="status".
 */
export function createAlert({ variant = 'error', title = '', body = '' } = {}) {
  const titleElement = h('p', { class: 'ps-alert__title' });
  const bodyElement = h('p', { class: 'ps-alert__body' });
  const isAssertive = variant === 'error' || variant === 'warning';

  const element = h(
    'div',
    {
      class: `ps-alert ps-alert--${variant}`,
      attrs: {
        role: isAssertive ? 'alert' : 'status',
        'aria-live': isAssertive ? 'assertive' : 'polite',
      },
    },
    h(
      'span',
      { class: 'ps-alert__icon', 'aria-hidden': 'true' },
      createIcon(ICON_BY_VARIANT[variant] || 'alert', { size: 20 }),
    ),
    h('div', { class: 'ps-alert__content' }, titleElement, bodyElement),
  );

  element.hidden = true;

  function show(nextTitle = title, nextBody = body) {
    title = nextTitle;
    body = nextBody;
    titleElement.textContent = title;
    bodyElement.textContent = body;
    element.hidden = false;
  }

  function hide() {
    element.hidden = true;
    titleElement.textContent = '';
    bodyElement.textContent = '';
  }

  function focus() {
    element.setAttribute('tabindex', '-1');
    element.focus();
  }

  if (title || body) {
    show(title, body);
  }

  return { element, show, hide, focus };
}
