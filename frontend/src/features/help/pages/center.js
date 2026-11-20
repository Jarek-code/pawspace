import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createHelpCategoryGrid } from '@/components/help/help-category-grid.js';
import { createFaqList } from '@/components/help/faq-list.js';
import { createHelpCenterRail } from '@/components/help/help-rail.js';
import { h } from '@/lib/dom.js';
import { loadHelpCenter } from '@/services/help.js';
import {
  createHelpBack,
  createHelpError,
  mountHelpShell,
  openStatusHistory,
} from '@/features/help/help-shell.js';
import { createHelpSearch } from '@/features/help/help-search.js';

/**
 * D31 / M24 — Centro de ayuda.
 * Buscador principal, temas populares, categorías y preguntas frecuentes.
 * También resuelve los resultados de búsqueda (D31b) y el filtro por categoría.
 */
export function createPage({ router, query } = {}) {
  const initialQuery = String(query?.get('q') || '').trim();
  const initialCategory = String(query?.get('categoria') || '').trim();

  const shell = mountHelpShell({
    router,
    title: 'Centro de ayuda',
    mobileTitle: 'Ayuda',
    subtitle: 'Respuestas rápidas y contacto con soporte',
    backTo: '/ajustes/cuenta',
  });

  loadHelpCenter({ q: initialQuery, categoria: initialCategory })
    .then((data) => paint(data))
    .catch(() =>
      shell.content.replaceChildren(
        createHelpError({
          title: 'No pudimos cargar el centro de ayuda',
          body: 'Revisa tu conexión e intenta de nuevo.',
          onRetry: () => router.navigate('/ayuda', { replace: true }),
        }),
      ),
    );

  function paint(data) {
    if (data.categoriaActiva) {
      shell.subtitle.textContent = data.categoriaActiva.title;
    }

    shell.rail.replaceChildren(
      ...createHelpCenterRail({
        pet: shell.pet,
        data,
        onChangePet: () => router.navigate('/elegir-mascota'),
        onContact: () => router.navigate('/soporte'),
        onStatusHistory: () => openStatusHistory(data.estado),
      }),
    );

    if (data.resultados) {
      shell.content.replaceChildren(createSearchResults(data, router));
      return;
    }

    if (data.categoriaActiva) {
      shell.content.replaceChildren(createCategoryView(data));
      return;
    }

    shell.content.replaceChildren(createCenterView(data, router));
  }

  return shell.shell;
}

function createCenterView(data, router) {
  const search = createHelpSearch({
    value: '',
    onSubmit: (value) => router.navigate(`/ayuda?q=${encodeURIComponent(value)}`),
  });

  return h(
    'div',
    { class: 'ps-help-center' },
    h(
      'section',
      { class: 'ps-help-hero' },
      h('h2', { class: 'ps-help-hero__title', text: '¿En qué podemos ayudarte?' }),
      h('p', {
        class: 'ps-help-hero__body',
        text: 'Busca una duda o explora los temas más consultados.',
      }),
      search.element,
      h(
        'div',
        { class: 'ps-help-topics' },
        h('span', { class: 'ps-help-topics__label', text: 'Temas populares' }),
        h(
          'div',
          { class: 'ps-help-topics__list' },
          data.populares.map((topic) =>
            h('a', {
              class: 'ps-help-chip',
              href: `/ayuda?q=${encodeURIComponent(topic.query)}`,
              text: topic.label,
            }),
          ),
        ),
      ),
    ),
    h(
      'section',
      { class: 'ps-help-section-block', attrs: { 'aria-labelledby': 'ps-help-categories-title' } },
      h('h2', {
        class: 'ps-help-section-title',
        id: 'ps-help-categories-title',
        text: 'Explora por categoría',
      }),
      createHelpCategoryGrid({ categories: data.categorias }),
    ),
    h(
      'section',
      { class: 'ps-help-section-block', attrs: { 'aria-labelledby': 'ps-help-faq-title' } },
      h('h2', {
        class: 'ps-help-section-title',
        id: 'ps-help-faq-title',
        text: 'Preguntas frecuentes',
      }),
      createFaqList({ faqs: data.preguntasFrecuentes }).element,
    ),
    h(
      'section',
      { class: 'ps-help-contact-mobile' },
      h('h2', { class: 'ps-help-section-title', text: '¿Necesitas ayuda?' }),
      h('p', {
        class: 'ps-help-contact-mobile__body',
        text: 'Cuéntanos qué ocurre y te responderemos en 48 horas.',
      }),
      createButton({
        label: 'Contactar con soporte',
        fullWidth: true,
        onClick: () => router.navigate('/soporte'),
      }).element,
    ),
  );
}

function createSearchResults(data, router) {
  const { resultados } = data;
  const search = createHelpSearch({
    value: resultados.query,
    onSubmit: (value) => router.navigate(`/ayuda?q=${encodeURIComponent(value)}`),
  });

  const head = h(
    'div',
    { class: 'ps-help-results__head' },
    createHelpBack({ href: '/ayuda' }),
    h('h2', {
      class: 'ps-help-section-title',
      text: `Resultados para “${resultados.query}”`,
    }),
    h('p', {
      class: 'ps-help-results__count',
      text: `${resultados.total} ${resultados.total === 1 ? 'resultado' : 'resultados'}`,
    }),
    search.element,
  );

  if (!resultados.total) {
    const suggestions = h(
      'section',
      { class: 'ps-help-suggestions', attrs: { 'aria-labelledby': 'ps-help-suggestions-title' } },
      h('h3', {
        class: 'ps-help-results__group-title',
        id: 'ps-help-suggestions-title',
        text: 'Sugerencias',
      }),
      h(
        'div',
        { class: 'ps-help-topics__list' },
        data.sugerencias.map((suggestion) =>
          h('a', {
            class: 'ps-help-chip',
            href: `/ayuda?q=${encodeURIComponent(suggestion)}`,
            text: suggestion,
          }),
        ),
      ),
    );

    return h(
      'div',
      { class: 'ps-help-results' },
      head,
      createEmptyState({
        icon: 'search',
        title: 'Sin resultados',
        body: 'No encontramos artículos para esa búsqueda. Revisa la ortografía o prueba con palabras más generales.',
        action: createButton({
          label: 'Contactar con soporte',
          variant: 'secondary',
          onClick: () => router.navigate('/soporte'),
        }).element,
      }),
      suggestions,
    );
  }

  return h(
    'div',
    { class: 'ps-help-results' },
    head,
    resultados.articulos.length
      ? resultGroup(
          'Artículos',
          resultados.articulos.map((article) =>
            articleResult(article, `/ayuda?q=${encodeURIComponent(resultados.query)}`),
          ),
        )
      : null,
    resultados.categorias.length
      ? resultGroup(
          'Categorías',
          resultados.categorias.map((category) =>
            h(
              'li',
              { class: 'ps-help-result' },
              h(
                'a',
                {
                  class: 'ps-help-result__link',
                  href: `/ayuda?categoria=${encodeURIComponent(category.id)}`,
                },
                h(
                  'span',
                  { class: 'ps-help-result__icon', 'aria-hidden': 'true' },
                  createIcon(category.icon || 'circle-help', { size: 20 }),
                ),
                h(
                  'span',
                  { class: 'ps-help-result__text' },
                  h('span', { class: 'ps-help-result__title', text: category.title }),
                  h('span', { class: 'ps-help-result__meta', text: category.description }),
                ),
              ),
            ),
          ),
        )
      : null,
    resultados.preguntas.length
      ? resultGroup(
          'Preguntas',
          resultados.preguntas.map((faq) =>
            h(
              'li',
              { class: 'ps-help-result' },
              h(
                'a',
                {
                  class: 'ps-help-result__link',
                  href: `/ayuda/${encodeURIComponent(faq.slug)}?desde=${encodeURIComponent(
                    `/ayuda?q=${resultados.query}`,
                  )}`,
                },
                h(
                  'span',
                  { class: 'ps-help-result__text' },
                  h('span', { class: 'ps-help-result__title', text: faq.question }),
                  h('span', { class: 'ps-help-result__meta', text: faq.answer }),
                ),
              ),
            ),
          ),
        )
      : null,
  );
}

function createCategoryView(data) {
  const { categoriaActiva, articulos } = data;

  return h(
    'div',
    { class: 'ps-help-results' },
    h(
      'div',
      { class: 'ps-help-results__head' },
      createHelpBack({ href: '/ayuda', label: 'Todos los temas' }),
      h('h2', { class: 'ps-help-section-title', text: categoriaActiva.title }),
      h('p', { class: 'ps-help-results__count', text: categoriaActiva.description }),
    ),
    resultGroup(
      `${articulos.length} ${articulos.length === 1 ? 'artículo' : 'artículos'}`,
      articulos.map((article) =>
        articleResult(article, `/ayuda?categoria=${encodeURIComponent(categoriaActiva.id)}`),
      ),
    ),
  );
}

function resultGroup(title, items) {
  return h(
    'section',
    { class: 'ps-help-results__group' },
    h('h3', { class: 'ps-help-results__group-title', text: title }),
    h('ul', { class: 'ps-help-results__list' }, items),
  );
}

function articleResult(article, backTo) {
  return h(
    'li',
    { class: 'ps-help-result' },
    h(
      'a',
      {
        class: 'ps-help-result__link',
        href: `/ayuda/${encodeURIComponent(article.slug)}?desde=${encodeURIComponent(backTo)}`,
      },
      h(
        'span',
        { class: 'ps-help-result__text' },
        h('span', { class: 'ps-help-result__title', text: article.title }),
        h('span', { class: 'ps-help-result__meta', text: article.summary }),
      ),
      h('span', {
        class: 'ps-help-result__time',
        text: `${article.readingTime} min`,
      }),
    ),
  );
}
