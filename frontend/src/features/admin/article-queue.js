import { createAdminStatus } from '@/components/admin/admin-status.js';
import { createDataTable } from '@/components/admin/data-table.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createField } from '@/components/primitives/field.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createQueueStatusFilter } from '@/features/admin/queue-status.js';
import { h } from '@/lib/dom.js';
import { loadAdminArticles } from '@/services/admin.js';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos', countKey: null },
  { value: 'PUBLICADO', label: 'Publicados', countKey: 'publicados' },
  { value: 'BORRADOR', label: 'Borradores', countKey: 'borradores' },
  { value: 'RETIRADO', label: 'Retirados', countKey: 'retirados' },
];

/**
 * CMP-104 — ArticleTable (D42 / M32).
 * Lista de artículos con estado, lectura, orden y última actualización. La
 * tabla permanece oculta hasta elegir un estado.
 */
export function createArticleQueue({ router }) {
  const state = { q: '', estado: '', page: 1, conteos: null };
  let searchTimer = null;

  const root = h('div', { class: 'ps-report-queue' });
  const toolbar = h(
    'div',
    { class: 'ps-admin-toolbar' },
    createButton({
      label: 'Nuevo artículo',
      variant: 'primary',
      onClick: () => router.navigate('/admin/ayuda/nuevo'),
    }).element,
  );
  const tableHost = h('div', { class: 'ps-report-queue__table' });

  const search = createField({
    placeholder: 'Buscar por título o slug',
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
  search.input.setAttribute('aria-label', 'Buscar por título o slug');

  const statusFilter = createQueueStatusFilter({
    options: STATUS_OPTIONS,
    total: (conteos) => conteos.publicados + conteos.borradores + conteos.retirados,
    onChange: () => {
      state.estado = statusFilter.getValue();
      state.page = 1;
      load();
    },
  });

  const filters = h(
    'div',
    { class: 'ps-report-queue__filters ps-report-queue__filters--single' },
    search.element,
    statusFilter.element,
  );

  root.append(toolbar, filters, tableHost);

  function renderGuide() {
    tableHost.replaceChildren(
      createEmptyState({
        icon: 'book-open',
        title: 'Selecciona un estado',
        body: 'Elige todos, publicados, borradores o retirados para ver los artículos.',
      }),
    );
  }

  function renderTable(payload) {
    const columns = [
      { key: 'titulo', label: 'Título' },
      { key: 'categoria', label: 'Categoría' },
      { key: 'estado', label: 'Estado' },
      { key: 'lectura', label: 'Lectura' },
      { key: 'orden', label: 'Orden' },
      { key: 'actualizado', label: 'Actualizado' },
    ];

    const table = createDataTable({
      columns,
      rows: payload.articulos,
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
        icon: 'book-open',
        title: 'Aún no hay artículos.',
        body: '',
        action:
          state.estado || state.q
            ? createButton({
                label: 'Ver todos los artículos',
                variant: 'secondary',
                onClick: () => showAll(),
              }).element
            : createButton({
                label: 'Nuevo artículo',
                variant: 'primary',
                onClick: () => router.navigate('/admin/ayuda/nuevo'),
              }).element,
      },
    });

    tableHost.replaceChildren(table);
  }

  function showAll() {
    state.estado = 'todos';
    state.q = '';
    state.page = 1;
    statusFilter.setValue('todos');
    search.setValue('');
    load();
  }

  function load({ silent = false } = {}) {
    if (silent) {
      loadAdminArticles({ ...state, estado: '', q: '' })
        .then((payload) => {
          state.conteos = payload.conteos;
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

    loadAdminArticles({
      ...state,
      estado: state.estado === 'todos' ? '' : state.estado,
    })
      .then((payload) => {
        state.conteos = payload.conteos;
        statusFilter.setCounts(state.conteos);
        renderTable(payload);
      })
      .catch(() => {
        tableHost.replaceChildren(
          createEmptyState({
            icon: 'alert',
            title: 'No pudimos cargar los artículos',
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
    case 'titulo':
      return h('a', {
        class: 'ps-report-cell__title',
        href: `/admin/ayuda/${row.id}`,
        text: row.titulo,
      });
    case 'categoria':
      return h('span', { class: 'ps-data-table__text', text: row.categoriaNombre });
    case 'estado':
      return createAdminStatus(row.estado);
    case 'lectura':
      return h('span', { class: 'ps-data-table__text', text: `${row.minutos} min` });
    case 'orden':
      return h('span', { class: 'ps-data-table__text', text: String(row.orden) });
    case 'actualizado':
      return h('span', { class: 'ps-data-table__text', text: row.actualizado });
    default:
      return '';
  }
}

function renderCard(row) {
  return h(
    'a',
    { class: 'ps-report-card', href: `/admin/ayuda/${row.id}` },
    h(
      'div',
      { class: 'ps-report-card__head' },
      h('span', { class: 'ps-report-card__handle', text: row.categoriaNombre }),
      createAdminStatus(row.estado),
    ),
    h('span', { class: 'ps-report-card__title', text: row.titulo }),
    h('span', { class: 'ps-report-card__meta', text: `${row.minutos} min · orden ${row.orden}` }),
    h(
      'span',
      { class: 'ps-report-card__chevron', 'aria-hidden': 'true' },
      createIcon('chevron-right', { size: 18 }),
    ),
  );
}
