import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createIcon } from '@/components/primitives/icon.js';
import { showToast } from '@/components/primitives/toast.js';
import { h } from '@/lib/dom.js';

const STATUS = {
  ABIERTA: { label: 'Abierta', variant: 'warning' },
  EN_REVISION: { label: 'En revisión', variant: 'info' },
  RESUELTA: { label: 'Resuelta', variant: 'success' },
  CERRADA: { label: 'Cerrada', variant: 'neutral' },
};

const FILTERS = [
  { value: 'TODAS', label: 'Todos los estados' },
  { value: 'ABIERTA', label: 'Abierta' },
  { value: 'EN_REVISION', label: 'En revisión' },
  { value: 'RESUELTA', label: 'Resuelta' },
  { value: 'CERRADA', label: 'Cerrada' },
];

export function statusPill(status) {
  const meta = STATUS[status] || STATUS.ABIERTA;

  return h('span', {
    class: `ps-status-pill ps-status-pill--${meta.variant}`,
    text: meta.label,
  });
}

/**
 * CMP-93 — SupportTicketList.
 * Filas con número, asunto, fecha y estado. La fila abre el detalle y las
 * solicitudes resueltas o cerradas se pueden reabrir.
 */
export function createSupportTicketList({
  tickets = [],
  expandedId = '',
  showFilters = false,
  compact = false,
  pageSize = 5,
  onReopen = null,
  onContact = null,
} = {}) {
  let data = [...tickets];
  let filter = 'TODAS';
  let visible = pageSize;
  let openId = expandedId ? String(expandedId) : '';

  if (compact) {
    return { element: renderCompact(data) };
  }

  const listHost = h('div', { class: 'ps-support-tickets__list' });
  const count = h('p', { class: 'ps-support-tickets__count' });

  const filterSelect = h(
    'select',
    {
      class: 'ps-support-tickets__filter',
      id: 'ps-support-filter',
      onChange: () => {
        filter = filterSelect.value;
        visible = pageSize;
        paint();
      },
    },
    FILTERS.map((item) => h('option', { value: item.value, text: item.label })),
  );

  const element = h(
    'section',
    { class: 'ps-support-tickets', attrs: { 'aria-labelledby': 'ps-support-tickets-title' } },
    h(
      'header',
      { class: 'ps-support-tickets__head' },
      h(
        'div',
        {},
        h('h2', {
          class: 'ps-support-tickets__title',
          id: 'ps-support-tickets-title',
          text: 'Tus solicitudes',
        }),
        count,
      ),
      showFilters
        ? h(
            'div',
            { class: 'ps-field ps-support-tickets__filter-field' },
            h('label', { class: 'ps-sr-only', for: 'ps-support-filter' }, 'Filtrar por estado'),
            filterSelect,
          )
        : null,
    ),
    listHost,
  );

  function filtered() {
    return filter === 'TODAS' ? data : data.filter((ticket) => String(ticket.estado) === filter);
  }

  function paint() {
    const items = filtered();
    const shown = items.slice(0, visible);

    count.textContent = items.length
      ? `${items.length} ${items.length === 1 ? 'solicitud' : 'solicitudes'}`
      : 'Sin solicitudes';

    if (!shown.length) {
      listHost.replaceChildren(
        createEmptyState({
          icon: 'circle-help',
          title: data.length ? 'No hay solicitudes con ese estado' : 'Aún no tienes solicitudes',
          body: data.length
            ? 'Prueba con otro filtro para ver tus solicitudes.'
            : 'Si necesitas ayuda, cuéntanos qué ocurrió y te responderemos.',
          action: data.length
            ? null
            : createButton({
                label: 'Contactar con soporte',
                variant: 'secondary',
                onClick: () => onContact?.(),
              }).element,
        }),
      );
      return;
    }

    const nodes = shown.map((ticket) => renderTicket(ticket));

    if (items.length > visible) {
      nodes.push(
        createButton({
          label: 'Ver más solicitudes',
          variant: 'secondary',
          size: 'sm',
          onClick: () => {
            visible += pageSize;
            paint();
          },
        }).element,
      );
    }

    listHost.replaceChildren(...nodes);
  }

  function renderTicket(ticket) {
    const detailId = `ps-ticket-detail-${ticket.id}`;
    const isOpen = openId === String(ticket.id);
    const rowId = `ps-ticket-row-${ticket.id}`;

    const row = h(
      'button',
      {
        class: 'ps-ticket__row',
        type: 'button',
        id: rowId,
        attrs: { 'aria-expanded': String(isOpen), 'aria-controls': detailId },
        onClick: () => {
          openId = isOpen ? '' : String(ticket.id);
          paint();
        },
      },
      h(
        'span',
        { class: 'ps-ticket__main' },
        h('span', {
          class: 'ps-ticket__subject',
          text: `#${ticket.id} · ${ticket.asunto}`,
        }),
        h('span', { class: 'ps-ticket__date', text: ticket.fecha }),
      ),
      statusPill(ticket.estado),
      h(
        'span',
        { class: 'ps-ticket__chevron', 'aria-hidden': 'true' },
        createIcon('chevron-down', { size: 18 }),
      ),
    );

    const reopen =
      ['RESUELTA', 'CERRADA'].includes(ticket.estado) && onReopen
        ? createButton({
            label: 'Reabrir solicitud',
            variant: 'secondary',
            size: 'sm',
            onClick: async () => {
              try {
                const next = await onReopen(ticket.id);
                showToast('Reabrimos tu solicitud.');
                setTickets(next?.tickets || data);
              } catch (error) {
                showToast(error?.message || 'No pudimos reabrir la solicitud.', {
                  variant: 'error',
                });
              }
            },
          })
        : null;

    const detail = h(
      'div',
      {
        class: 'ps-ticket__detail',
        id: detailId,
        attrs: { role: 'region', 'aria-labelledby': rowId, hidden: !isOpen },
      },
      h('p', { class: 'ps-ticket__movement', text: ticket.ultimoMovimiento }),
      ticket.detalle ? h('p', { class: 'ps-ticket__body', text: ticket.detalle }) : null,
      h(
        'div',
        { class: 'ps-ticket__timeline' },
        h('span', { class: 'ps-ticket__timeline-title', text: 'Cronología' }),
        h(
          'ol',
          { class: 'ps-ticket__timeline-list' },
          (ticket.cronologia || []).map((item) =>
            h(
              'li',
              { class: 'ps-ticket__timeline-item' },
              h('span', { class: 'ps-ticket__timeline-date', text: item.fecha }),
              h('span', { class: 'ps-ticket__timeline-text', text: item.texto }),
            ),
          ),
        ),
      ),
      reopen ? h('div', { class: 'ps-ticket__actions' }, reopen.element) : null,
    );

    return h(
      'article',
      { class: `ps-ticket${isOpen ? ' is-open' : ''}`, id: `solicitud-${ticket.id}` },
      row,
      detail,
    );
  }

  function setTickets(next) {
    data = [...next];

    if (filter !== 'TODAS' && !data.some((ticket) => String(ticket.estado) === filter)) {
      filter = 'TODAS';
      filterSelect.value = filter;
    }

    paint();
  }

  paint();

  return {
    element,
    setTickets,
    setExpanded(id) {
      openId = String(id || '');
      paint();
    },
  };
}

function renderCompact(tickets) {
  return h(
    'ul',
    { class: 'ps-support-tickets__compact' },
    tickets.map((ticket) =>
      h(
        'li',
        { class: 'ps-ticket ps-ticket--compact' },
        h(
          'a',
          {
            class: 'ps-ticket__compact-link',
            href: `/soporte?solicitud=${encodeURIComponent(ticket.id)}#solicitudes`,
          },
          h(
            'span',
            { class: 'ps-ticket__main' },
            h('span', {
              class: 'ps-ticket__subject',
              text: `#${ticket.id} · ${ticket.asunto}`,
            }),
            h('span', { class: 'ps-ticket__date', text: ticket.fecha }),
          ),
          statusPill(ticket.estado),
        ),
      ),
    ),
  );
}
