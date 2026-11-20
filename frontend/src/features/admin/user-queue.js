import { createAdminStatus } from '@/components/admin/admin-status.js';
import { createDataTable } from '@/components/admin/data-table.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createBadge } from '@/components/primitives/badge.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createField } from '@/components/primitives/field.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createTabs } from '@/components/primitives/tabs.js';
import { h } from '@/lib/dom.js';
import { loadAdminUsers } from '@/services/admin.js';

const TABS = [
  { value: 'todos', label: 'Todos', countKey: null },
  { value: 'activos', label: 'Activos', countKey: 'activos' },
  { value: 'suspendidos', label: 'Suspendidos', countKey: 'suspendidos' },
  { value: 'administradores', label: 'Administradores', countKey: 'administradores' },
];

/**
 * CMP-107 — UserTable (D45 / M33).
 * Lista de cuentas con filtros por estado y búsqueda por nombre, correo o
 * mascota.
 */
export function createUserQueue() {
  const state = { filtro: 'todos', q: '', page: 1, conteos: null };
  let searchTimer = null;

  const root = h('div', { class: 'ps-report-queue' });
  const tabsHost = h('div', { class: 'ps-report-queue__tabs' });
  const tableHost = h('div', { class: 'ps-report-queue__table' });

  const search = createField({
    placeholder: 'Buscar por nombre, correo o mascota',
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
  search.input.setAttribute('aria-label', 'Buscar por nombre, correo o mascota');

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
          ? state.conteos.activos +
            state.conteos.suspendidos +
            state.conteos.administradores +
            state.conteos.eliminadas
          : null;
      const label = count === null ? tab.label : `${tab.label} (${count})`;

      return { value: tab.value, label, active: tab.value === state.filtro };
    });

    const tabsComponent = createTabs({
      tabs,
      onChange: (value) => {
        state.filtro = value;
        state.page = 1;
        load();
      },
    });

    tabsHost.replaceChildren(tabsComponent.element);
  }

  function renderTable(payload) {
    const columns = [
      { key: 'persona', label: 'Persona' },
      { key: 'mascota', label: 'Mascota' },
      { key: 'alta', label: 'Alta' },
      { key: 'rol', label: 'Rol' },
      { key: 'estado', label: 'Estado' },
    ];

    const table = createDataTable({
      columns,
      rows: payload.usuarios,
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
        icon: 'users',
        title: 'No encontramos usuarios con esa búsqueda.',
        body: '',
        action:
          state.filtro !== 'todos' || state.q
            ? createButton({
                label: 'Ver todas las cuentas',
                variant: 'secondary',
                onClick: () => resetFilters(),
              }).element
            : null,
      },
    });

    tableHost.replaceChildren(table);
  }

  function resetFilters() {
    state.filtro = 'todos';
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

    loadAdminUsers(state)
      .then((payload) => {
        state.conteos = payload.conteos;
        renderTabs();
        renderTable(payload);
      })
      .catch(() => {
        tableHost.replaceChildren(
          createEmptyState({
            icon: 'alert',
            title: 'No pudimos cargar las cuentas',
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
    case 'persona':
      return h(
        'div',
        { class: 'ps-report-cell' },
        createAvatar({ name: row.nombre, size: 'sm' }),
        h(
          'div',
          { class: 'ps-report-cell__main' },
          h('a', {
            class: 'ps-report-cell__title',
            href: `/admin/usuarios/${row.id}`,
            text: row.nombre,
          }),
          h('span', { class: 'ps-report-cell__meta', text: row.correo }),
        ),
      );
    case 'mascota':
      return h('span', { class: 'ps-data-table__text', text: row.handle });
    case 'alta':
      return h('span', { class: 'ps-data-table__text', text: row.alta });
    case 'rol':
      return row.es_admin
        ? createBadge({ label: 'Administrador', variant: 'primary' })
        : h('span', { class: 'ps-data-table__text', text: '—' });
    case 'estado':
      return createAdminStatus(row.estado);
    default:
      return '';
  }
}

function renderCard(row) {
  return h(
    'a',
    { class: 'ps-report-card', href: `/admin/usuarios/${row.id}` },
    h(
      'div',
      { class: 'ps-report-card__head' },
      createAvatar({ name: row.nombre, size: 'sm' }),
      h('span', { class: 'ps-report-card__handle', text: row.nombre }),
      createAdminStatus(row.estado),
    ),
    h('span', { class: 'ps-report-card__title', text: row.handle }),
    h('span', { class: 'ps-report-card__meta', text: row.correo }),
    row.es_admin
      ? h(
          'span',
          { class: 'ps-report-card__meta' },
          createBadge({ label: 'Administrador', variant: 'primary' }),
        )
      : null,
    h(
      'span',
      { class: 'ps-report-card__chevron', 'aria-hidden': 'true' },
      createIcon('chevron-right', { size: 18 }),
    ),
  );
}
