import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

/**
 * CMP-90 — FAQList.
 * Acordeón accesible: varias preguntas abiertas en escritorio y una sola en
 * móvil. El enlace directo #pregunta abre la fila correspondiente.
 */
export function createFaqList({ faqs = [] } = {}) {
  const items = new Map();

  const element = h(
    'div',
    { class: 'ps-faq-list' },
    faqs.map((faq) => {
      const triggerId = `ps-faq-trigger-${faq.id}`;
      const panelId = `ps-faq-panel-${faq.id}`;

      const trigger = h(
        'button',
        {
          class: 'ps-faq__trigger',
          type: 'button',
          id: triggerId,
          attrs: {
            'aria-expanded': 'false',
            'aria-controls': panelId,
          },
          onClick: () => toggle(faq.id),
        },
        h('span', { class: 'ps-faq__question', text: faq.question }),
        h(
          'span',
          { class: 'ps-faq__chevron', 'aria-hidden': 'true' },
          createIcon('chevron-down', { size: 20 }),
        ),
      );

      const panel = h(
        'div',
        {
          class: 'ps-faq__panel',
          id: panelId,
          attrs: {
            role: 'region',
            'aria-labelledby': triggerId,
            hidden: true,
          },
        },
        h('p', { class: 'ps-faq__answer', text: faq.answer }),
        faq.slug
          ? h(
              'a',
              { class: 'ps-faq__link', href: `/ayuda/${encodeURIComponent(faq.slug)}` },
              'Leer el artículo completo',
            )
          : null,
      );

      const item = h(
        'div',
        { class: 'ps-faq__item', id: faq.id, dataset: { faq: faq.id } },
        trigger,
        panel,
      );

      items.set(faq.id, { item, trigger, panel });
      return item;
    }),
  );

  function setOpen(id, open) {
    const target = items.get(id);

    if (!target) {
      return;
    }

    target.trigger.setAttribute('aria-expanded', String(open));
    target.panel.hidden = !open;
    target.item.classList.toggle('is-open', open);
  }

  function closeOthers(id) {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    if (!window.matchMedia('(max-width: 767px)').matches) {
      return;
    }

    for (const key of items.keys()) {
      if (key !== id) {
        setOpen(key, false);
      }
    }
  }

  function toggle(id) {
    const target = items.get(id);

    if (!target) {
      return;
    }

    const open = target.trigger.getAttribute('aria-expanded') !== 'true';

    if (open) {
      closeOthers(id);
    }

    setOpen(id, open);
  }

  function openFromHash() {
    const hash = window.location.hash.replace(/^#/, '');

    if (hash && items.has(hash)) {
      closeOthers(hash);
      setOpen(hash, true);
    }
  }

  window.addEventListener('hashchange', openFromHash);
  openFromHash();

  return {
    element,
    open: (id) => {
      closeOthers(id);
      setOpen(id, true);
    },
    close: (id) => setOpen(id, false),
  };
}
