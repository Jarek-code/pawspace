import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

/**
 * CMP-96 — MetricCard.
 * Métrica del panel con icono tonal, valor grande y una nota de contexto. El
 * tono nunca es la única señal: la etiqueta y la nota llevan el significado.
 */
export function createMetricCard({
  label = '',
  value = 0,
  note = '',
  icon = 'flag',
  tone = 'forest',
} = {}) {
  return h(
    'article',
    { class: `ps-metric-card ps-metric-card--${tone}` },
    h(
      'div',
      { class: 'ps-metric-card__top' },
      h('h2', { class: 'ps-metric-card__label', text: label }),
      h(
        'span',
        { class: 'ps-metric-card__icon', 'aria-hidden': 'true' },
        createIcon(icon, { size: 22 }),
      ),
    ),
    h('p', { class: 'ps-metric-card__value', text: String(value) }),
    note ? h('p', { class: 'ps-metric-card__note', text: note }) : null,
  );
}
