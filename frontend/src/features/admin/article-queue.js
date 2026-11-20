import { createAdminStatus } from '@/components/admin/admin-status.js';
import { createDataTable } from '@/components/admin/data-table.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createField } from '@/components/primitives/field.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createTabs } from '@/components/primitives/tabs.js';
import { h } from '@/lib/dom.js';
import { loadAdminArticles } from '@/services/admin.js';

const TABS = [
  { value: '', label: 'Todos', countKey: null },
  { value: 'PUBLICADO', label: 'Publicados', countKey: 'publicados' },
  { value: 'BORRADOR', label: 'Borradores', countKey: 'borradores' },
  { value: 'RETIRADO', label: 'Retirados', countKey: 'retirados' },
];

/**
 * CMP-104 — ArticleTable (D42 / M32).
 * Lista de artículos con estado, lectura, orden y última actualización.
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
  const tabsHost = h('div', { class: 'ps-report-queue__tabs' });
  const tableHost = h('div', { class: 'ps-report-queue__table' });

  const search = createField({
    placeholder: 'Buscar por título o slug',
    icon: 'search',
    onInput: () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        state.q = search.getValue().trim();
        state.page = 1;
        load();
      }, 300);
    },
  });
  search.input.setAttribute('aria-label', 'Buscar por título o slug');

  const filters = h(
    'div',
    { class: 'ps-report-queue__filters ps-report-queue__filters--single' },
    search.element,
  );

  root.append(toolbar, tabsHost, filters, tableHost);

  function renderTabs() {
    const tabs = TABS.map((tab) => {
      const count = tab.countKey
        ? state.conteos?.[tab.countKey]
        : state.conteos
          ? state.conteos.publicados + state.conteos.borradores + state.conteos.retirados
          : null;
      const label = count === null ? tab.label : `${tab.label} (${count})`;

      return { value: tab.value, label, active: tab.value === state.estado };
    });

    tabsHost.replaceChildren(
      createTabs({
        tabs,
        onChange: (value) => {
          state.estado = value;
          state.page = 1;
          load();
        },
      }).element,
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
                onClick: () => resetFilters(),
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

  function resetFilters() {
    state.estado = '';
    state.q = '';
    state.page = 1;
    search.setValue('');
    load();
  }

  function load() {
    tableHost.replaceChildren(
      h('div', {
        class: 'ps-report-queue__loading',
        attrs: { role: 'status', 'aria-live': 'polite' },
      }),
    );

    loadAdminArticles(state)
      .then((payload) => {
        state.conteos = payload.conteos;
        renderTabs();
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

  load();

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
