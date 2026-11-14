import { h } from '@/lib/dom.js';
import { estimatePasswordStrength } from '@/lib/password.js';

const LEVEL_LABELS = {
  weak: 'Débil',
  medium: 'Media',
  strong: 'Segura',
};

/**
 * CMP-22 — PasswordStrength.
 * Tres niveles por entropía, acompañados de texto; el color nunca es la única
 * señal. Es informativo: no bloquea el envío del formulario.
 */
export function createPasswordStrength({ value = '' } = {}) {
  const segments = [0, 1, 2].map(() => h('span', { class: 'ps-password-strength__segment' }));
  const label = h('p', { class: 'ps-password-strength__label' });

  const element = h(
    'div',
    {
      class: 'ps-password-strength',
      attrs: { 'aria-live': 'polite' },
    },
    h('div', { class: 'ps-password-strength__bars', 'aria-hidden': 'true' }, segments),
    label,
  );

  function update(nextValue = value) {
    value = nextValue;
    const { level } = estimatePasswordStrength(value);

    if (!value) {
      label.textContent = '';
      element.classList.remove('is-visible');
      element.removeAttribute('data-level');
      return;
    }

    element.classList.add('is-visible');
    element.dataset.level = level;
    label.textContent = LEVEL_LABELS[level];
  }

  update(value);

  return {
    element,
    update,
  };
}
