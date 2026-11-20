import { createActivePetCard } from '@/components/feed/rail.js';
import { createArticleIndex } from '@/components/help/help-article.js';
import { createSupportStatus } from '@/components/help/support-status.js';
import { createSupportTicketList } from '@/components/help/support-ticket-list.js';
import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

export function createHelpCenterRail({ pet, data, onChangePet, onContact, onStatusHistory } = {}) {
  return [
    createActivePetCard(pet, onChangePet),
    helpCard(onContact),
    statusCard(data?.estado, onStatusHistory),
    guidesCard(data?.guias || []),
  ].filter(Boolean);
}

export function createArticleRail({ pet, data, onChangePet, onContact, onStatusHistory } = {}) {
  const index = createArticleIndex({ sections: data?.articulo?.sections || [] });
  const nodes = [
    createActivePetCard(pet, onChangePet),
    h('section', { class: 'ps-rail__card ps-help-rail__index' }, index.element),
    relatedCard(data?.relacionados || []),
    helpCard(onContact),
    statusCard(data?.estado, onStatusHistory),
  ].filter(Boolean);

  nodes.index = index;
  return nodes;
}

export function createSupportRail({ pet, data, onChangePet, onOpenAll, onStatusHistory } = {}) {
  return [
    createActivePetCard(pet, onChangePet),
    beforeWritingCard(data?.beforeWriting || []),
    ticketsCard(data?.tickets || [], onOpenAll),
    responseTimeCard(data?.responseTime),
    statusCard(data?.status, onStatusHistory),
  ].filter(Boolean);
}

function helpCard(onContact) {
  return h(
    'section',
    { class: 'ps-rail__card ps-help-rail__cta' },
    h('h2', { class: 'ps-rail__title', text: '¿Necesitas ayuda?' }),
    h('p', {
      class: 'ps-help-rail__body',
      text: 'Cuéntanos qué ocurre y te responderemos en 48 horas.',
    }),
    createButton({
      label: 'Contactar con soporte',
      fullWidth: true,
      onClick: () => onContact?.(),
    }).element,
  );
}

function statusCard(status, onHistory) {
  if (!status) {
    return null;
  }

  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Estado del servicio' }),
    createSupportStatus({ status, onHistory }),
  );
}

function guidesCard(guides) {
  if (!guides.length) {
    return null;
  }

  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Guías rápidas' }),
    h('p', { class: 'ps-help-rail__eyebrow', text: 'Lo más leído esta semana' }),
    h(
      'ul',
      { class: 'ps-help-rail__list' },
      guides.map((guide) =>
        h(
          'li',
          {},
          h(
            'a',
            { class: 'ps-help-rail__row', href: `/ayuda/${encodeURIComponent(guide.slug)}` },
            h('span', { class: 'ps-help-rail__row-title', text: guide.title }),
            h('span', { class: 'ps-help-rail__row-meta', text: `${guide.readingTime} min` }),
          ),
        ),
      ),
    ),
    h('p', { class: 'ps-help-rail__foot', text: 'Actualizado cada semana.' }),
  );
}

function relatedCard(related) {
  if (!related.length) {
    return null;
  }

  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Artículos relacionados' }),
    h(
      'ul',
      { class: 'ps-help-rail__list' },
      related
        .slice(0, 3)
        .map((item) =>
          h(
            'li',
            {},
            h(
              'a',
              { class: 'ps-help-rail__row', href: `/ayuda/${encodeURIComponent(item.slug)}` },
              h('span', { class: 'ps-help-rail__row-title', text: item.title }),
              h('span', { class: 'ps-help-rail__row-meta', text: `${item.readingTime} min` }),
            ),
          ),
        ),
    ),
  );
}

function beforeWritingCard(tips) {
  if (!tips.length) {
    return null;
  }

  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Antes de escribir' }),
    h(
      'ul',
      { class: 'ps-help-rail__checks' },
      tips.map((tip) =>
        h(
          'li',
          { class: 'ps-help-rail__check' },
          createIcon('circle-check', { size: 18 }),
          h('span', { text: tip }),
        ),
      ),
    ),
  );
}

function ticketsCard(tickets, onOpenAll) {
  return h(
    'section',
    { class: 'ps-rail__card' },
    h(
      'div',
      { class: 'ps-help-rail__head' },
      h('h2', { class: 'ps-rail__title', text: 'Tus solicitudes' }),
      h('a', { class: 'ps-help-rail__link', href: '/soporte#solicitudes' }, 'Ver todas'),
    ),
    tickets.length
      ? h(
          'div',
          { class: 'ps-help-rail__tickets' },
          createSupportTicketList({ tickets: tickets.slice(0, 2), compact: true }).element,
        )
      : h('p', {
          class: 'ps-help-rail__body',
          text: 'Todavía no has enviado solicitudes. Si necesitas ayuda, escríbenos.',
        }),
    tickets.length
      ? h(
          'button',
          {
            class: 'ps-help-rail__link ps-help-rail__link--button',
            type: 'button',
            onClick: onOpenAll,
          },
          'Ver historial',
        )
      : null,
  );
}

function responseTimeCard(responseTime) {
  if (!responseTime) {
    return null;
  }

  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Tiempo de respuesta' }),
    h(
      'p',
      { class: 'ps-help-rail__response' },
      h('strong', { text: responseTime.hours }),
      h('span', { text: responseTime.label }),
    ),
    h('p', { class: 'ps-help-rail__foot', text: responseTime.schedule }),
  );
}
