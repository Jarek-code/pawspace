import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

/**
 * CMP-91 — HelpArticle.
 * Breadcrumb, categoría, título, meta, contenido, feedback y relacionados.
 * El índice lateral se construye con `createArticleIndex` y comparte los ids
 * de las secciones para resaltar la sección visible.
 */
export function createHelpArticle({
  article,
  category,
  related = [],
  feedback = null,
  onFeedback = null,
  backHref = '/ayuda',
} = {}) {
  let currentFeedback = feedback;

  const feedbackStatus = h('p', {
    class: 'ps-help-article__feedback-status',
    attrs: { role: 'status', 'aria-live': 'polite' },
  });

  const yesButton = createButton({ label: 'Sí', variant: 'secondary', size: 'sm' });
  const noButton = createButton({ label: 'No', variant: 'secondary', size: 'sm' });

  yesButton.element.setAttribute('aria-pressed', 'false');
  noButton.element.setAttribute('aria-pressed', 'false');

  function paintFeedback(value) {
    currentFeedback = value;

    for (const [button, buttonValue] of [
      [yesButton, 'si'],
      [noButton, 'no'],
    ]) {
      const selected = value === buttonValue;
      button.element.classList.toggle('is-selected', selected);
      button.element.setAttribute('aria-pressed', String(selected));
      button.setDisabled(Boolean(value));
    }

    feedbackStatus.textContent = value
      ? 'Gracias por tu respuesta. La usamos para mejorar este artículo.'
      : '';
  }

  function submitFeedback(value) {
    if (currentFeedback) {
      return;
    }

    const clicked = value === 'si' ? yesButton : noButton;
    clicked.setLoading(true);

    Promise.resolve(onFeedback?.(value))
      .then((next) => {
        paintFeedback(next?.feedback || value);
      })
      .catch((error) => {
        feedbackStatus.textContent = error?.message || 'No pudimos guardar tu respuesta.';
      })
      .finally(() => {
        clicked.setLoading(false);
      });
  }

  yesButton.element.addEventListener('click', () => submitFeedback('si'));
  noButton.element.addEventListener('click', () => submitFeedback('no'));

  if (currentFeedback) {
    paintFeedback(currentFeedback);
  }

  const element = h(
    'div',
    { class: 'ps-help-article-page' },
    h(
      'a',
      { class: 'ps-help-back', href: backHref },
      createIcon('arrow-left', { size: 18 }),
      'Centro de ayuda',
    ),
    h(
      'article',
      { class: 'ps-help-article' },
      h(
        'header',
        { class: 'ps-help-article__header' },
        h('span', { class: 'ps-help-badge', text: category?.title || '' }),
        h('h2', { class: 'ps-help-article__title', text: article.title }),
        h(
          'p',
          { class: 'ps-help-article__meta' },
          createIcon('clock', { size: 16 }),
          `Actualizado ${article.updated} · ${article.readingTime} min de lectura`,
        ),
      ),
      h(
        'div',
        { class: 'ps-help-article__body' },
        h('p', {
          class: 'ps-help-article__intro',
          id: 'antes-de-empezar',
          text: article.intro,
        }),
        ...(article.sections || []).map((section) =>
          h(
            'section',
            {
              class: 'ps-help-section',
              id: section.id,
              attrs: { 'aria-labelledby': `${section.id}-title` },
            },
            h('h3', {
              class: 'ps-help-section__title',
              id: `${section.id}-title`,
              text: section.title,
            }),
            section.steps
              ? h(
                  'ol',
                  { class: 'ps-help-steps' },
                  section.steps.map((step) =>
                    h(
                      'li',
                      { class: 'ps-help-step' },
                      h(
                        'span',
                        { class: 'ps-help-step__num', 'aria-hidden': 'true' },
                        String(section.steps.indexOf(step) + 1),
                      ),
                      h(
                        'span',
                        { class: 'ps-help-step__text' },
                        h('span', { class: 'ps-help-step__title', text: step.title }),
                        h('span', { class: 'ps-help-step__body', text: step.body }),
                      ),
                    ),
                  ),
                )
              : null,
            section.callout
              ? createCallout(section.callout, section.steps ? 'is-separated' : '')
              : null,
          ),
        ),
      ),
      h(
        'section',
        {
          class: 'ps-help-article__feedback',
          attrs: { 'aria-labelledby': 'ps-help-feedback-title' },
        },
        h('h3', {
          class: 'ps-help-article__subtitle',
          id: 'ps-help-feedback-title',
          text: '¿Te resultó útil este artículo?',
        }),
        h(
          'div',
          { class: 'ps-help-article__feedback-actions' },
          yesButton.element,
          noButton.element,
        ),
        feedbackStatus,
      ),
      related.length
        ? h(
            'section',
            {
              class: 'ps-help-related',
              attrs: { 'aria-labelledby': 'ps-help-related-title' },
            },
            h('h3', {
              class: 'ps-help-article__subtitle',
              id: 'ps-help-related-title',
              text: 'Artículos relacionados',
            }),
            h(
              'ul',
              { class: 'ps-help-related__list' },
              related.map((item) =>
                h(
                  'li',
                  { class: 'ps-help-related__item' },
                  h(
                    'a',
                    {
                      class: 'ps-help-related__link',
                      href: `/ayuda/${encodeURIComponent(item.slug)}`,
                    },
                    h('span', { class: 'ps-help-related__title', text: item.title }),
                    h('span', {
                      class: 'ps-help-related__time',
                      text: `${item.readingTime} min`,
                    }),
                  ),
                ),
              ),
            ),
          )
        : null,
    ),
  );

  return { element, feedbackStatus, setFeedback: paintFeedback };
}

function createCallout(callout, extraClass = '') {
  return h(
    'aside',
    { class: ['ps-help-callout', extraClass].filter(Boolean).join(' ') },
    h(
      'span',
      { class: 'ps-help-callout__icon', 'aria-hidden': 'true' },
      createIcon(callout.icon || 'shield', { size: 22 }),
    ),
    h(
      'span',
      { class: 'ps-help-callout__text' },
      h('span', { class: 'ps-help-callout__title', text: callout.title }),
      h('span', { class: 'ps-help-callout__body', text: callout.body }),
    ),
  );
}

/**
 * Índice lateral del artículo. Resalta la sección visible con
 * aria-current="location"; el scroll spy vive en la página.
 */
export function createArticleIndex({ sections = [], includeIntro = true } = {}) {
  const entries = [
    ...(includeIntro ? [{ id: 'antes-de-empezar', title: 'Antes de empezar' }] : []),
    ...sections.map((section) => ({ id: section.id, title: section.title })),
  ];

  const links = new Map();

  const element = h(
    'nav',
    { class: 'ps-help-index', attrs: { 'aria-label': 'En este artículo' } },
    h('h2', { class: 'ps-rail__title', text: 'En este artículo' }),
    h(
      'ul',
      { class: 'ps-help-index__list' },
      entries.map((entry) => {
        const link = h(
          'a',
          { class: 'ps-help-index__link', href: `#${entry.id}` },
          h('span', { class: 'ps-help-index__label', text: entry.title }),
        );

        links.set(entry.id, link);
        return h('li', {}, link);
      }),
    ),
  );

  function setActive(id) {
    for (const [entryId, link] of links) {
      const active = entryId === id;
      link.classList.toggle('is-active', active);

      if (active) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  }

  return { element, setActive };
}
