import { h } from '@/lib/dom.js';
import { createSpinner } from './spinner.js';

/**
 * CMP-08 — Button.
 * Variantes primary, secondary, ghost y danger; tamaños sm, md y lg.
 * Loading conserva el ancho, deshabilita la interacción y anuncia aria-busy.
 */
export function createButton({
  label = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  fullWidth = false,
  loading = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  ariaLabel = '',
  name = '',
  value = '',
  loadingLabel = 'Espera…',
  onClick = null,
} = {}) {
  const labelElement = h('span', { class: 'ps-button__label', text: label });
  const spinner = createSpinner({ size: 'sm' });
  spinner.hidden = true;

  const element = h(
    'button',
    {
      class: [
        'ps-button',
        `ps-button--${variant}`,
        `ps-button--${size}`,
        fullWidth ? 'ps-button--full' : '',
      ]
        .filter(Boolean)
        .join(' '),
      type,
      attrs: {
        'aria-label': ariaLabel || null,
        name: name || null,
        value: value || null,
      },
    },
    iconLeft ? h('span', { class: 'ps-button__icon', 'aria-hidden': 'true' }, iconLeft) : null,
    spinner,
    labelElement,
    iconRight ? h('span', { class: 'ps-button__icon', 'aria-hidden': 'true' }, iconRight) : null,
  );

  let isLoading = false;
  let isDisabled = disabled;

  function syncDisabled() {
    element.disabled = isLoading || isDisabled;
  }

  function setLoading(next) {
    isLoading = next;
    element.classList.toggle('is-loading', next);
    element.setAttribute('aria-busy', String(next));
    spinner.hidden = !next;
    labelElement.textContent = next ? loadingLabel : label;
    syncDisabled();
  }

  function setDisabled(next) {
    isDisabled = next;
    syncDisabled();
  }

  function setLabel(next) {
    label = next;

    if (!isLoading) {
      labelElement.textContent = next;
    }
  }

  element.disabled = disabled;

  if (onClick) {
    element.addEventListener('click', onClick);
  }

  if (loading) {
    setLoading(true);
  }

  return {
    element,
    setLoading,
    setDisabled,
    setLabel,
    focus: () => element.focus(),
  };
}
