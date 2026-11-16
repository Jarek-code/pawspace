import { createButton } from '@/components/primitives/button.js';
import { createField } from '@/components/primitives/field.js';
import { h } from '@/lib/dom.js';

const SPECIES = ['Perro', 'Gato', 'Ave', 'Conejo', 'Pez', 'Tortuga'];

/**
 * CMP-72 — FilterPanel. Solo especie, raza y orden: no hay filtros
 * geográficos porque el esquema no guarda ubicación.
 */
export function createSearchFilters({
  especie = '',
  raza = '',
  orden = 'relevancia',
  onApply = null,
} = {}) {
  const razaField = createField({
    name: 'raza',
    label: 'Raza',
    value: raza,
    placeholder: 'Ej. Siamés',
    optional: true,
    onKeyDown: (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onApply?.({ raza: razaField.getValue().trim() });
      }
    },
  });

  const applyRaza = createButton({
    label: 'Aplicar raza',
    variant: 'secondary',
    size: 'sm',
    fullWidth: true,
    onClick: () => onApply?.({ raza: razaField.getValue().trim() }),
  });

  const order = h(
    'select',
    { class: 'ps-field__input ps-field__select', attrs: { 'aria-label': 'Ordenar resultados' } },
    h('option', { value: 'relevancia', text: 'Relevancia' }),
    h('option', { value: 'recientes', text: 'Más recientes' }),
  );
  order.value = orden;
  order.addEventListener('change', () => onApply?.({ orden: order.value }));

  const hasFilters = Boolean(especie || raza || (orden && orden !== 'relevancia'));

  const clear = hasFilters
    ? createButton({
        label: 'Limpiar filtros',
        variant: 'ghost',
        size: 'sm',
        onClick: () => onApply?.({ especie: '', raza: '', orden: 'relevancia' }),
      }).element
    : null;

  return h(
    'div',
    { class: 'ps-filters' },
    h(
      'fieldset',
      { class: 'ps-filters__group' },
      h('legend', { class: 'ps-filters__legend', text: 'Especie' }),
      h(
        'div',
        { class: 'ps-chip-row' },
        h(
          'button',
          {
            class: `ps-chip${!especie ? ' is-active' : ''}`,
            type: 'button',
            attrs: { 'aria-pressed': String(!especie) },
            onClick: () => onApply?.({ especie: '' }),
          },
          'Todas',
        ),
        SPECIES.map((value) =>
          h(
            'button',
            {
              class: `ps-chip${especie === value ? ' is-active' : ''}`,
              type: 'button',
              attrs: { 'aria-pressed': String(especie === value) },
              onClick: () => onApply?.({ especie: value }),
            },
            value,
          ),
        ),
      ),
    ),
    razaField.element,
    applyRaza.element,
    h(
      'label',
      { class: 'ps-field' },
      h('span', { class: 'ps-field__label', text: 'Ordenar por' }),
      h('div', { class: 'ps-field__control ps-field__control--with-chevron' }, order),
    ),
    clear ? h('div', { class: 'ps-filters__clear' }, clear) : null,
  );
}
