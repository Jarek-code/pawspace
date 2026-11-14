import { h } from '@/lib/dom.js';
import { createIcon } from './icon.js';

let cardCounter = 0;

/**
 * CMP-42 — SelectableCard y CMP-43 — PrivacyOption.
 * La tarjeta completa es la etiqueta de un radio nativo, así que conserva
 * teclado, lector de pantalla y selección exclusiva sin JavaScript extra.
 */
export function createSelectableCard({
  id = '',
  name = 'choice',
  value = '',
  title = '',
  description = '',
  icon = '',
  checked = false,
  onChange = null,
} = {}) {
  cardCounter += 1;
  const inputId = id || `ps-choice-${cardCounter}`;

  const input = h('input', {
    class: 'ps-selectable-card__input',
    type: 'radio',
    id: inputId,
    name,
    value,
    checked,
  });
  input.checked = checked;

  const element = h(
    'label',
    { class: 'ps-selectable-card', for: inputId },
    input,
    icon
      ? h(
          'span',
          { class: 'ps-selectable-card__icon', 'aria-hidden': 'true' },
          createIcon(icon, { size: 24 }),
        )
      : null,
    h(
      'span',
      { class: 'ps-selectable-card__content' },
      h('span', { class: 'ps-selectable-card__title', text: title }),
      description
        ? h('span', { class: 'ps-selectable-card__description', text: description })
        : null,
    ),
    h(
      'span',
      { class: 'ps-selectable-card__check', 'aria-hidden': 'true' },
      createIcon('check', { size: 16 }),
    ),
  );

  if (onChange) {
    input.addEventListener('change', onChange);
  }

  return {
    element,
    input,
    getValue: () => input.value,
    isChecked: () => input.checked,
    setChecked: (next) => {
      input.checked = next;
    },
    focus: () => input.focus(),
  };
}
