import { h } from '@/lib/dom.js';
import { createIcon } from './icon.js';

let comboboxCounter = 0;

/**
 * CMP-16 — Combobox.
 * Búsqueda dentro de una lista cerrada. La persona elige del catálogo; no
 * escribe especies libres.
 */
export function createCombobox({
  id = '',
  label = '',
  placeholder = 'Busca una opción',
  options = [],
  value = '',
  emptyText = 'Sin resultados.',
  optional = false,
  toggleLabel = 'Mostrar opciones',
  onChange = null,
} = {}) {
  comboboxCounter += 1;
  const baseId = id || `ps-combobox-${comboboxCounter}`;
  const listId = `${baseId}-list`;
  let selectedValue = value;
  let filtered = options;
  let activeIndex = -1;
  let open = false;

  const input = h('input', {
    class: 'ps-field__input ps-combobox__input',
    id: baseId,
    type: 'text',
    placeholder,
    autocomplete: 'off',
    role: 'combobox',
    attrs: {
      'aria-expanded': 'false',
      'aria-controls': listId,
      'aria-autocomplete': 'list',
    },
  });

  const list = h('ul', {
    class: 'ps-combobox__list',
    id: listId,
    role: 'listbox',
    attrs: { 'aria-label': label || 'Opciones' },
  });
  list.hidden = true;

  const control = h(
    'div',
    { class: 'ps-field__control ps-field__control--with-icon ps-field__control--with-chevron' },
    h(
      'span',
      { class: 'ps-field__icon', 'aria-hidden': 'true' },
      createIcon('search', { size: 20 }),
    ),
    input,
    h(
      'button',
      {
        class: 'ps-combobox__toggle',
        type: 'button',
        tabindex: '-1',
        attrs: { 'aria-label': toggleLabel, 'aria-controls': listId },
        onClick: () => (open ? close() : openList()),
      },
      createIcon('chevron-down', { size: 18 }),
    ),
  );

  const element = h(
    'div',
    { class: 'ps-field ps-combobox' },
    label
      ? h(
          'label',
          { class: 'ps-field__label', for: baseId },
          label,
          optional ? h('span', { class: 'ps-field__optional', text: ' (opcional)' }) : null,
        )
      : null,
    control,
    list,
  );

  function selectedLabel() {
    const match = options.find((option) => option.value === selectedValue);
    return match ? match.label : '';
  }

  function render() {
    list.replaceChildren();

    if (filtered.length === 0) {
      list.append(
        h('li', {
          class: 'ps-combobox__empty',
          role: 'presentation',
          text: emptyText,
        }),
      );
      return;
    }

    filtered.forEach((option, index) => {
      const optionId = `${listId}-${option.value}`;
      const isSelected = option.value === selectedValue;
      const item = h(
        'li',
        {
          class: [
            'ps-combobox__option',
            isSelected ? 'is-selected' : '',
            index === activeIndex ? 'is-active' : '',
          ]
            .filter(Boolean)
            .join(' '),
          id: optionId,
          role: 'option',
          attrs: {
            'aria-selected': String(isSelected),
          },
          onClick: () => select(option),
        },
        h('span', { class: 'ps-combobox__option-label', text: option.label }),
        option.meta ? h('span', { class: 'ps-combobox__option-meta', text: option.meta }) : null,
        isSelected
          ? h(
              'span',
              { class: 'ps-combobox__option-check', 'aria-hidden': 'true' },
              createIcon('check', { size: 16 }),
            )
          : null,
      );

      list.append(item);
    });
  }

  function syncActive() {
    const active = filtered[activeIndex];

    if (active) {
      input.setAttribute('aria-activedescendant', `${listId}-${active.value}`);
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function openList() {
    open = true;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    render();
    syncActive();
  }

  function close() {
    open = false;
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');
  }

  function select(option) {
    selectedValue = option.value;
    input.value = option.label;
    close();

    if (onChange) {
      onChange(option);
    }
  }

  function filter(nextQuery) {
    const query = nextQuery.trim().toLowerCase();
    filtered = query
      ? options.filter((option) => option.label.toLowerCase().includes(query))
      : options;
    activeIndex = -1;
    openList();

    if (selectedValue && input.value !== selectedLabel()) {
      selectedValue = '';

      if (onChange) {
        onChange(null);
      }
    }
  }

  input.addEventListener('focus', () => {
    if (!open) {
      openList();
      input.select();
    }
  });

  input.addEventListener('input', () => {
    filter(input.value);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (!open) {
        openList();
      }

      activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
      syncActive();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      syncActive();
      return;
    }

    if (event.key === 'Enter') {
      if (open && filtered[activeIndex]) {
        event.preventDefault();
        select(filtered[activeIndex]);
      }

      return;
    }

    if (event.key === 'Escape') {
      close();
    }
  });

  const onDocumentClick = (event) => {
    if (!element.isConnected) {
      document.removeEventListener('click', onDocumentClick);
      return;
    }

    if (!element.contains(event.target)) {
      close();
    }
  };
  document.addEventListener('click', onDocumentClick);

  if (selectedValue) {
    input.value = selectedLabel();
  }

  render();

  return {
    element,
    input,
    getValue: () => selectedValue,
    setValue: (nextValue) => {
      selectedValue = nextValue;
      input.value = selectedLabel();
    },
    focus: () => input.focus(),
    close,
  };
}
