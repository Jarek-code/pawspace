import { h } from '@/lib/dom.js';

/**
 * CMP-22 — PasswordStrength.
 * Tres niveles acompañados de texto; el color nunca es la única señal.
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

  function score(nextValue) {
    const text = String(nextValue || '');
    const checks = [text.length >= 8, /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(text), /\d/.test(text)];
    return checks.filter(Boolean).length;
  }

  function update(nextValue = value) {
    value = nextValue;
    const level = score(value);
    element.dataset.level = String(level);

    if (!value) {
      label.textContent = '';
      element.classList.remove('is-visible');
      return;
    }

    element.classList.add('is-visible');

    if (level <= 1) {
      label.textContent = 'Débil';
      element.dataset.level = 'weak';
    } else if (level === 2) {
      label.textContent = 'Media';
      element.dataset.level = 'medium';
    } else {
      label.textContent = 'Segura';
      element.dataset.level = 'strong';
    }
  }

  update(value);

  return {
    element,
    update,
    isValid: () => {
      const text = String(value || '');
      return text.length >= 8 && /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(text) && /\d/.test(text);
    },
  };
}
