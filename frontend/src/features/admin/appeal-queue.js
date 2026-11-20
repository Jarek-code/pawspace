import { createAdminStatus } from '@/components/admin/admin-status.js';
import { createDataTable } from '@/components/admin/data-table.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createField } from '@/components/primitives/field.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createTabs } from '@/components/primitives/tabs.js';
import { h } from '@/lib/dom.js';
import { loadAdminAppeals } from '@/services/admin.js';

const TABS = [
  { value: 'todos', label: 'Todas', countKey: null },
  { value: 'pendientes', label: 'Pendientes', countKey: 'pendientes' },
  { value: 'aceptadas', label: 'Aceptadas', countKey: 'aceptadas' },
  { value: 'rechazadas', label: 'Rechazadas', countKey: 'rechazadas' },
];

/**
 * CMP-101 — AppealQueue (lista de D38 / M28b).
 * Apelaciones con pestañas por estado y búsqueda; la resolución ocurre en el
 * detalle (D39).
 */
export function createAppealQueue() {
  const state = { estado: 'todos', q: '', page: 1, conteos: null };
  let searchTimer = null;

  const root = h('div', { class: 'ps-report-queue' });
  const tabsHost = h('div', { class: 'ps-report-queue__tabs' });
  const tableHost = h('div', { class: 'ps-report-queue__table' });

  const search = createField({
    placeholder: 'Buscar por número o mascota',
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
  search.input.setAttribute('aria-label', 'Buscar por número o mascota');

  const filters = h(
    'div',
    { class: 'ps-report-queue__filters ps-report-queue__filters--single' },
    search.element,
  );

  root.append(tabsHost, filters, tableHost);

  function renderTabs() {
    const tabs = TABS.map((tab) => {
      const count = tab.countKey
        ? state.conteos?.[tab.countKey]
        : state.conteos
          ? state.conteos.pendientes + state.conteos.aceptadas + state.conteos.rechazadas
          : null;
      const label = count === null ? tab.label : `${tab.label} (${count})`;

      return { value: tab.value, label, active: tab.value === state.estado };
    });

    const tabsComponent = createTabs({
      tabs,
      onChange: (value) => {
        state.estado = value;
        state.page = 1;
        load();
      },
    });

    tabsHost.replaceChildren(tabsComponent.element);
  }

  function renderTable(payload) {
    const columns = [
      { key: 'id', label: '#' },
      { key: 'mascota', label: 'Mascota' },
      { key: 'reporte', label: 'Reporte' },
      { key: 'motivo', label: 'Motivo' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'estado', label: 'Estado' },
    ];

    const table = createDataTable({
      columns,
      rows: payload.apelaciones,
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
        icon: 'scale',
        title:
          state.estado === 'todos' ? 'No hay apelaciones' : 'No hay apelaciones en este estado.',
        body: '',
        action:
          state.estado !== 'todos' || state.q
            ? createButton({
                label: 'Ver todas las apelaciones',
                variant: 'secondary',
                onClick: () => resetFilters(),
              }).element
            : null,
      },
    });

    tableHost.replaceChildren(table);
  }

  function resetFilters() {
    state.estado = 'todos';
    state.q = '';
    state.page = 1;
    search.setValue('');
    load();
  }

  function load() {
    tableHost.replaceChildren(
      h(
        'div',
        { class: 'ps-report-queue__loading', attrs: { role: 'status', 'aria-live': 'polite' } },
        h('span', { class: 'ps-sr-only', text: 'Cargando apelaciones…' }),
      ),
    );

    loadAdminAppeals(state)
      .then((payload) => {
        state.conteos = payload.conteos;
        renderTabs();
        renderTable(payload);
      })
      .catch(() => {
        tableHost.replaceChildren(
          createEmptyState({
            icon: 'alert',
            title: 'No pudimos cargar las apelaciones',
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
    case 'id':
      return h('span', { class: 'ps-data-table__id', text: `#${row.id}` });
    case 'mascota':
      return h(
        'div',
        { class: 'ps-report-cell' },
        createAvatar({ name: row.nombre, size: 'sm' }),
        h(
          'div',
          { class: 'ps-report-cell__main' },
          h('a', {
            class: 'ps-report-cell__title',
            href: `/admin/apelaciones/${row.id}`,
            text: row.handle,
          }),
        ),
      );
    case 'reporte':
      return h('span', { class: 'ps-data-table__text', text: `#${row.reporteId}` });
    case 'motivo':
      return h('span', { class: 'ps-report-cell__meta', text: row.motivo });
    case 'fecha':
      return h('span', { class: 'ps-data-table__text', text: row.hace });
    case 'estado':
      return createAdminStatus(row.estado);
    default:
      return '';
  }
}

function renderCard(row) {
  return h(
    'a',
    { class: 'ps-report-card', href: `/admin/apelaciones/${row.id}` },
    h(
      'div',
      { class: 'ps-report-card__head' },
      createAvatar({ name: row.nombre, size: 'sm' }),
      h('span', { class: 'ps-report-card__handle', text: row.handle }),
      h('span', { class: 'ps-report-card__time', text: row.hace }),
      createAdminStatus(row.estado),
    ),
    h('span', { class: 'ps-report-card__title', text: `Apelación del reporte #${row.reporteId}` }),
    h('span', { class: 'ps-report-card__meta', text: row.motivo }),
    h(
      'span',
      { class: 'ps-report-card__chevron', 'aria-hidden': 'true' },
      createIcon('chevron-right', { size: 18 }),
    ),
  );
}
