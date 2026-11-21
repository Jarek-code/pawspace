import { createAdminStatus } from '@/components/admin/admin-status.js';
import { createDataTable } from '@/components/admin/data-table.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createBadge } from '@/components/primitives/badge.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createField } from '@/components/primitives/field.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createQueueStatusFilter } from '@/features/admin/queue-status.js';
import { h } from '@/lib/dom.js';
import { loadAdminUsers } from '@/services/admin.js';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos', countKey: null },
  { value: 'activos', label: 'Activos', countKey: 'activos' },
  { value: 'suspendidos', label: 'Suspendidos', countKey: 'suspendidos' },
  { value: 'administradores', label: 'Administradores', countKey: 'administradores' },
];

/**
 * CMP-107 — UserTable (D45 / M33).
 * Lista de cuentas con filtro desplegable y búsqueda por nombre, correo o
 * mascota. La tabla permanece oculta hasta elegir un filtro.
 */
export function createUserQueue() {
  const state = { filtro: '', q: '', page: 1, conteos: null };
  let searchTimer = null;

  const root = h('div', { class: 'ps-report-queue' });
  const tableHost = h('div', { class: 'ps-report-queue__table' });

  const search = createField({
    placeholder: 'Buscar por nombre, correo o mascota',
    icon: 'search',
    onInput: () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        state.q = search.getValue().trim();
        state.page = 1;

        if (state.filtro) {
          load();
        }
      }, 300);
    },
  });
  search.input.setAttribute('aria-label', 'Buscar por nombre, correo o mascota');

  const statusFilter = createQueueStatusFilter({
    label: 'Filtro',
    placeholder: 'Selecciona un filtro',
    options: STATUS_OPTIONS,
    total: (conteos) =>
      conteos.activos + conteos.suspendidos + conteos.administradores + conteos.eliminadas,
    onChange: () => {
      state.filtro = statusFilter.getValue();
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

  root.append(filters, tableHost);

  function renderGuide() {
    tableHost.replaceChildren(
      createEmptyState({
        icon: 'users',
        title: 'Selecciona un filtro',
        body: 'Elige todos, activos, suspendidos o administradores para ver las cuentas.',
      }),
    );
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
                onClick: () => showAll(),
              }).element
            : null,
      },
    });

    tableHost.replaceChildren(table);
  }

  function showAll() {
    state.filtro = 'todos';
    state.q = '';
    state.page = 1;
    statusFilter.setValue('todos');
    search.setValue('');
    load();
  }

  function load({ silent = false } = {}) {
    if (silent) {
      loadAdminUsers({ ...state, filtro: '', q: '' })
        .then((payload) => {
          state.conteos = payload.conteos;
          statusFilter.setCounts(state.conteos);
        })
        .catch(() => {});

      return;
    }

    if (!state.filtro) {
      renderGuide();
      return;
    }

    tableHost.replaceChildren(
      h('div', {
        class: 'ps-report-queue__loading',
        attrs: { role: 'status', 'aria-live': 'polite' },
      }),
    );

    loadAdminUsers(state)
      .then((payload) => {
        state.conteos = payload.conteos;
        statusFilter.setCounts(state.conteos);
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

  renderGuide();
  load({ silent: true });

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
