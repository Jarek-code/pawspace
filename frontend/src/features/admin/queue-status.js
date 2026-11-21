import { createSelectField } from '@/components/primitives/field.js';
import { h } from '@/lib/dom.js';

export function formatQueueCount(count) {
  const value = Number(count);

  if (!Number.isFinite(value) || value < 0) {
    return '';
  }

  return value > 99 ? '99+' : String(value);
}

/**
 * Filtro de estado de las bandejas de administración.
 * Reutiliza CMP-15 Select y coloca el conteo en cada opción (tope 99+).
 * El valor vacío representa "sin selección" y muestra la guía en la bandeja.
 */
export function createQueueStatusFilter({
  label = 'Estado',
  placeholder = 'Selecciona un estado',
  options = [],
  total = null,
  onChange = null,
} = {}) {
  let counts = null;

  const field = createSelectField({ label, options: [], onChange });

  function render() {
    const nodes = [h('option', { value: '', text: placeholder })];

    for (const option of options) {
      const count = option.countKey
        ? counts?.[option.countKey]
        : counts && total
          ? total(counts)
          : null;
      const text =
        count === null || count === undefined
          ? option.label
          : `${option.label} (${formatQueueCount(count)})`;

      nodes.push(h('option', { value: option.value, text }));
    }

    const current = field.getValue();
    field.select.replaceChildren(...nodes);
    field.setValue(current);
  }

  render();

  return {
    element: field.element,
    getValue: field.getValue,
    setValue: field.setValue,
    setCounts(next) {
      counts = next;
      render();
    },
  };
}
