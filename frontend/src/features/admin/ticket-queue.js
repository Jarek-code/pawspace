import { createAdminStatus } from '@/components/admin/admin-status.js';
import { createDataTable } from '@/components/admin/data-table.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createField, createSelectField } from '@/components/primitives/field.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createQueueStatusFilter } from '@/features/admin/queue-status.js';
import { h } from '@/lib/dom.js';
import { loadAdminTickets } from '@/services/admin.js';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todas', countKey: null },
  { value: 'ABIERTA', label: 'Abiertas', countKey: 'abiertas' },
  { value: 'EN_REVISION', label: 'En revisión', countKey: 'enRevision' },
  { value: 'ESPERANDO_USUARIO', label: 'Esperando', countKey: 'esperando' },
  { value: 'RESUELTA', label: 'Resueltas', countKey: 'resueltas' },
  { value: 'CERRADA', label: 'Cerradas', countKey: 'cerradas' },
];

/**
 * CMP-102 — TicketQueue (D40 / M30).
 * Bandeja de soporte con filtro desplegable por estado, filtro de tema y
 * búsqueda. La tabla permanece oculta hasta elegir un estado.
 */
export function createTicketQueue() {
  const state = { estado: '', tema: '', q: '', page: 1, conteos: null, temas: [] };
  let searchTimer = null;

  const root = h('div', { class: 'ps-report-queue' });
  const tableHost = h('div', { class: 'ps-report-queue__table' });

  const search = createField({
    placeholder: 'Buscar por número, asunto o correo',
    icon: 'search',
    onInput: () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        state.q = search.getValue().trim();
        state.page = 1;

        if (state.estado) {
          load();
        }
      }, 300);
    },
  });
  search.input.setAttribute('aria-label', 'Buscar por número, asunto o correo');

  const statusFilter = createQueueStatusFilter({
    options: STATUS_OPTIONS,
    total: (conteos) => Object.values(conteos).reduce((sum, value) => sum + value, 0),
    onChange: () => {
      state.estado = statusFilter.getValue();
      state.page = 1;
      load();
    },
  });

  const temaSelect = createSelectField({
    label: 'Tema',
    placeholder: 'Todos',
    options: [],
    onChange: () => {
      state.tema = temaSelect.getValue();
      state.page = 1;
      load();
    },
  });

  const filters = h(
    'div',
    { class: 'ps-report-queue__filters ps-report-queue__filters--soporte' },
    search.element,
    statusFilter.element,
    temaSelect.element,
  );

  root.append(filters, tableHost);

  function renderGuide() {
    tableHost.replaceChildren(
      createEmptyState({
        icon: 'headset',
        title: 'Selecciona un estado',
        body: 'Elige todas, abiertas, en revisión, esperando, resueltas o cerradas para ver los tickets.',
      }),
    );
  }

  function syncTemas(temas) {
    state.temas = temas;
    const select = temaSelect.select;
    const current = select.value;

    select.replaceChildren(
      h('option', { value: '', text: 'Todos' }),
      ...temas.map((tema) => h('option', { value: tema.value, text: tema.label })),
    );
    select.value = current || '';
  }

  function renderTable(payload) {
    const columns = [
      { key: 'id', label: '#' },
      { key: 'asunto', label: 'Asunto' },
      { key: 'persona', label: 'Persona' },
      { key: 'tema', label: 'Tema' },
      { key: 'movimiento', label: 'Último movimiento' },
      { key: 'estado', label: 'Estado' },
    ];

    const table = createDataTable({
      columns,
      rows: payload.tickets,
      cell: (column, row) => renderCell(column, row),
      card: (row) => renderCard(row),
      currentPage: payload.pagina,
      total: payload.total,
      pageSize: payload.paginaSize,
      onPageChange: (page) => {
        state.page = page;
        load();
      },
      empty: {
        icon: 'headset',
        title: state.estado ? 'No hay tickets en este estado.' : 'No hay tickets.',
        body: '',
        action:
          state.estado || state.tema || state.q
            ? createButton({
                label: 'Ver todos los tickets',
                variant: 'secondary',
                onClick: () => showAll(),
              }).element
            : null,
      },
    });

    tableHost.replaceChildren(table);
  }

  function showAll() {
    state.estado = 'todos';
    state.tema = '';
    state.q = '';
    state.page = 1;
    statusFilter.setValue('todos');
    search.setValue('');
    temaSelect.setValue('');
    load();
  }

  function load({ silent = false } = {}) {
    if (silent) {
      loadAdminTickets({ ...state, estado: '', tema: '', q: '' })
        .then((payload) => {
          state.conteos = payload.conteos;
          syncTemas(payload.temas);
          statusFilter.setCounts(state.conteos);
        })
        .catch(() => {});

      return;
    }

    if (!state.estado) {
      renderGuide();
      return;
    }

    tableHost.replaceChildren(
      h('div', {
        class: 'ps-report-queue__loading',
        attrs: { role: 'status', 'aria-live': 'polite' },
      }),
    );

    loadAdminTickets({
      ...state,
      estado: state.estado === 'todos' ? '' : state.estado,
    })
      .then((payload) => {
        state.conteos = payload.conteos;
        syncTemas(payload.temas);
        statusFilter.setCounts(state.conteos);
        renderTable(payload);
      })
      .catch(() => {
        tableHost.replaceChildren(
          createEmptyState({
            icon: 'alert',
            title: 'No pudimos cargar los tickets',
            body: 'Revisa tu conexión e intenta de nuevo.',
            action: createButton({
              label: 'Reintentar',
              variant: 'secondary',
              onClick: () => load(),
            }).element,
          }),
        );
      });
  }

  renderGuide();
  load({ silent: true });

  return root;
}

function renderCell(column, row) {
  switch (column.key) {
    case 'id':
      return h('span', { class: 'ps-data-table__id', text: `#${row.id}` });
    case 'asunto':
      return h(
        'div',
        { class: 'ps-report-cell__stacked' },
        h('a', {
          class: 'ps-report-cell__title',
          href: `/admin/soporte/${row.id}`,
          text: row.asunto,
        }),
        h('span', { class: 'ps-report-cell__meta', text: row.persona }),
      );
    case 'persona':
      return h('span', { class: 'ps-data-table__text', text: row.persona });
    case 'tema':
      return h('span', { class: 'ps-data-table__text', text: row.temaLabel || row.tema });
    case 'movimiento':
      return h('span', { class: 'ps-report-cell__meta', text: row.ultimoMovimiento });
    case 'estado':
      return createAdminStatus(row.estado);
    default:
      return '';
  }
}

function renderCard(row) {
  return h(
    'a',
    { class: 'ps-report-card', href: `/admin/soporte/${row.id}` },
    h(
      'div',
      { class: 'ps-report-card__head' },
      h('span', { class: 'ps-report-card__handle', text: `#${row.id}` }),
      h('span', { class: 'ps-report-card__time', text: row.hace }),
      createAdminStatus(row.estado),
    ),
    h('span', { class: 'ps-report-card__title', text: row.asunto }),
    h('span', {
      class: 'ps-report-card__meta',
      text: `${row.persona} · ${row.temaLabel || row.tema}`,
    }),
    h(
      'span',
      { class: 'ps-report-card__chevron', 'aria-hidden': 'true' },
      createIcon('chevron-right', { size: 18 }),
    ),
  );
}
