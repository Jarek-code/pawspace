import { h } from '@/lib/dom.js';

let switchCounter = 0;

/**
 * CMP-19 — Switch.
 * Botón con role="switch"; el estado nunca depende solo del color porque
 * aria-checked y la posición del pulgar lo comunican. Admite guardado
 * optimista: si onChange devuelve una promesa rechazada, el control revierte.
 */
export function createSwitch({
  id = '',
  label = '',
  checked = false,
  disabled = false,
  description = '',
  onChange = null,
} = {}) {
  switchCounter += 1;
  const switchId = id || `ps-switch-${switchCounter}`;
  const labelId = `${switchId}-label`;
  const descriptionId = description ? `${switchId}-description` : '';

  const element = h('button', {
    class: 'ps-switch',
    type: 'button',
    role: 'switch',
    id: switchId,
    disabled,
    attrs: {
      'aria-checked': String(Boolean(checked)),
      'aria-labelledby': label ? labelId : null,
      'aria-describedby': descriptionId || null,
    },
  });
  element.setAttribute('aria-checked', String(Boolean(checked)));
  element.dataset.checked = String(Boolean(checked));

  const thumb = h('span', { class: 'ps-switch__thumb', 'aria-hidden': 'true' });
  element.append(thumb);

  const labelElement = label
    ? h('span', { class: 'ps-switch-field__label', id: labelId, text: label })
    : null;
  const descriptionElement = description
    ? h('span', {
        class: 'ps-switch-field__description',
        id: descriptionId,
        text: description,
      })
    : null;

  const field = h(
    'div',
    { class: ['ps-switch-field', disabled ? 'is-disabled' : ''].filter(Boolean).join(' ') },
    h('span', { class: 'ps-switch-field__text' }, labelElement, descriptionElement),
    element,
  );

  let current = Boolean(checked);
  let busy = false;

  function paint(next) {
    current = Boolean(next);
    element.setAttribute('aria-checked', String(current));
    element.dataset.checked = String(current);
    element.classList.toggle('is-checked', current);
  }

  paint(current);

  async function toggle() {
    if (busy || disabled) {
      return;
    }

    const next = !current;
    busy = true;
    element.classList.add('is-busy');
    paint(next);

    try {
      await onChange?.(next);
    } catch {
      paint(!next);
    } finally {
      busy = false;
      element.classList.remove('is-busy');
    }
  }

  element.addEventListener('click', toggle);

  return {
    element: field,
    control: element,
    label: labelElement,
    getValue: () => current,
    setChecked: (next) => paint(next),
    setDisabled: (next) => {
      disabled = Boolean(next);
      element.disabled = disabled;
      field.classList.toggle('is-disabled', disabled);
    },
  };
}
