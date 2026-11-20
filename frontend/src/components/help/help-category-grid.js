import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

/**
 * CMP-89 — HelpCategoryGrid.
 * Rejilla 2×2 de categorías; toda la tarjeta es un enlace. Alterna el tono
 * del icono para separar visualmente las categorías sin depender del color.
 */
export function createHelpCategoryGrid({ categories = [] } = {}) {
  const visible = categories.filter((category) => category.count > 0);

  return h(
    'div',
    { class: 'ps-help-categories' },
    visible.map((category, index) =>
      h(
        'a',
        {
          class: 'ps-help-category',
          href: `/ayuda?categoria=${encodeURIComponent(category.id)}`,
        },
        h(
          'span',
          {
            class: `ps-help-category__icon ps-help-category__icon--${index % 2 === 0 ? 'forest' : 'coral'}`,
            'aria-hidden': 'true',
          },
          createIcon(category.icon || 'circle-help', { size: 22 }),
        ),
        h(
          'span',
          { class: 'ps-help-category__content' },
          h('span', { class: 'ps-help-category__title', text: category.title }),
          h('span', { class: 'ps-help-category__description', text: category.description }),
          h('span', {
            class: 'ps-help-category__count',
            text: `${category.count} ${category.count === 1 ? 'artículo' : 'artículos'}`,
          }),
        ),
      ),
    ),
  );
}
