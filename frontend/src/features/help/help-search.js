import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

let searchCounter = 0;

/**
 * CMP-70 — SearchHero aplicado al centro de ayuda.
 * Enter o el botón Buscan; con menos de 2 caracteres muestra una ayuda en
 * lugar de navegar.
 */
export function createHelpSearch({ value = '', onSubmit = null } = {}) {
  searchCounter += 1;
  const inputId = `ps-help-search-${searchCounter}`;
  const errorId = `${inputId}-error`;

  const input = h('input', {
    class: 'ps-help-search__input',
    type: 'search',
    id: inputId,
    value,
    placeholder: 'Busca “cambiar contraseña”…',
    autocomplete: 'off',
    attrs: {
      'aria-describedby': errorId,
    },
  });

  const error = h('p', {
    class: 'ps-help-search__error',
    id: errorId,
    attrs: { role: 'alert' },
  });

  const form = h(
    'form',
    { class: 'ps-help-search', attrs: { role: 'search' } },
    h('label', { class: 'ps-sr-only', for: inputId }, 'Buscar en el centro de ayuda'),
    h(
      'span',
      { class: 'ps-help-search__icon', 'aria-hidden': 'true' },
      createIcon('search', { size: 20 }),
    ),
    input,
    createButton({ label: 'Buscar', type: 'submit' }).element,
    error,
  );

  function submit() {
    const query = input.value.trim();

    if (query.length < 2) {
      error.textContent = 'Escribe al menos 2 caracteres para buscar.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }

    error.textContent = '';
    input.removeAttribute('aria-invalid');

    if (onSubmit) {
      onSubmit(query);
      return;
    }

    window.location.assign(`/ayuda?q=${encodeURIComponent(query)}`);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submit();
  });

  input.addEventListener('input', () => {
    error.textContent = '';
    input.removeAttribute('aria-invalid');
  });

  return {
    element: form,
    input,
    error,
    setValue: (next) => {
      input.value = next;
    },
    focus: () => input.focus(),
  };
}
