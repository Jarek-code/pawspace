import { createDataTable } from '@/components/admin/data-table.js';
import { createAdminStatus } from '@/components/admin/admin-status.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createField, createSelectField } from '@/components/primitives/field.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createQueueStatusFilter } from '@/features/admin/queue-status.js';
import { h } from '@/lib/dom.js';
import { loadAdminReports } from '@/services/admin.js';

const TIPO_OPCIONES = [
  { value: 'publicacion', label: 'Publicación' },
  { value: 'historia', label: 'Historia' },
  { value: 'comentario', label: 'Comentario' },
  { value: 'mensaje', label: 'Mensaje' },
];

const MOTIVO_OPCIONES = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'ACOSO', label: 'Acoso' },
  { value: 'CONTENIDO_INAPROPIADO', label: 'Contenido inapropiado' },
  { value: 'VIOLENCIA', label: 'Violencia' },
  { value: 'SUPLANTACION', label: 'Suplantación' },
  { value: 'DERECHOS_AUTOR', label: 'Derechos de autor' },
  { value: 'OTRO', label: 'Otro' },
];

const FECHA_OPCIONES = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'anteriores', label: 'Anteriores' },
];

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos', countKey: null },
  { value: 'pendientes', label: 'Pendientes', countKey: 'pendientes' },
  { value: 'en-revision', label: 'En revisión', countKey: 'enRevision' },
  { value: 'resueltos', label: 'Resueltos', countKey: 'resueltos' },
  { value: 'rechazados', label: 'Rechazados', countKey: 'rechazados' },
];

/**
 * CMP-99 — ReportQueue.
 * Bandeja de reportes con filtro desplegable por estado, filtros y tabla densa
 * (móvil: tarjetas). La tabla permanece oculta hasta elegir un estado.
 */
export function createReportQueue({ initialQ = '' } = {}) {
  const state = {
    estado: '',
    categoria: '',
    tipo: '',
    fecha: '',
    q: initialQ,
    page: 1,
    conteos: null,
  };

  let searchTimer = null;

  const root = h('div', { class: 'ps-report-queue' });
  const tableHost = h('div', { class: 'ps-report-queue__table' });

  const search = createField({
    placeholder: 'Buscar por número, mascota o texto',
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
  search.input.value = initialQ;
  search.input.setAttribute('aria-label', 'Buscar por número, mascota o texto');

  const statusFilter = createQueueStatusFilter({
    options: STATUS_OPTIONS,
    total: (conteos) =>
      conteos.pendientes + conteos.enRevision + conteos.resueltos + conteos.rechazados,
    onChange: () => {
      state.estado = statusFilter.getValue();
      state.page = 1;
      load();
    },
  });

  const tipoSelect = createSelectField({
    label: 'Categoría',
    placeholder: 'Todas',
    options: TIPO_OPCIONES,
    onChange: () => {
      state.tipo = tipoSelect.getValue();
      state.page = 1;
      load();
    },
  });

  const motivoSelect = createSelectField({
    label: 'Motivo',
    placeholder: 'Todos',
    options: MOTIVO_OPCIONES,
    onChange: () => {
      state.categoria = motivoSelect.getValue();
      state.page = 1;
      load();
    },
  });

  const fechaSelect = createSelectField({
    label: 'Fecha',
    placeholder: 'Cualquiera',
    options: FECHA_OPCIONES,
    onChange: () => {
      state.fecha = fechaSelect.getValue();
      state.page = 1;
      load();
    },
  });

  const filters = h(
    'div',
    { class: 'ps-report-queue__filters' },
    search.element,
    statusFilter.element,
    tipoSelect.element,
    motivoSelect.element,
    fechaSelect.element,
  );

  root.append(filters, tableHost);

  function renderGuide() {
    tableHost.replaceChildren(
      createEmptyState({
        icon: 'sliders-horizontal',
        title: 'Selecciona un estado',
        body: 'Elige todos, pendientes, en revisión, resueltos o rechazados para ver los reportes.',
      }),
    );
  }

  function renderTable(payload) {
    const columns = [
      { key: 'id', label: '#' },
      { key: 'contenido', label: 'Contenido' },
      { key: 'motivo', label: 'Motivo' },
      { key: 'denunciante', label: 'Denunciante' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'estado', label: 'Estado' },
    ];

    const table = createDataTable({
      columns,
      rows: payload.reportes,
      rowKey: (row) => row.id,
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
        icon: 'flag',
        title: state.estado === 'todos' ? 'No hay reportes' : 'No hay reportes en este estado.',
        body: '',
        action:
          state.estado !== 'todos' || state.categoria || state.tipo || state.fecha || state.q
            ? createButton({
                label: 'Ver todos los reportes',
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
    state.categoria = '';
    state.tipo = '';
    state.fecha = '';
    state.q = '';
    state.page = 1;
    statusFilter.setValue('todos');
    search.setValue('');
    tipoSelect.setValue('');
    motivoSelect.setValue('');
    fechaSelect.setValue('');
    load();
  }

  function load({ silent = false } = {}) {
    if (silent) {
      loadAdminReports({ ...state, estado: '' })
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

    tableHost.replaceChildren(createLoading());

    loadAdminReports(state)
      .then((payload) => {
        state.conteos = payload.conteos;
        statusFilter.setCounts(state.conteos);
        renderTable(payload);
      })
      .catch(() => {
        tableHost.replaceChildren(
          createEmptyState({
            icon: 'alert',
            title: 'No pudimos cargar los reportes',
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

function createLoading() {
  return h(
    'div',
    { class: 'ps-report-queue__loading', attrs: { role: 'status', 'aria-live': 'polite' } },
    h('span', { class: 'ps-sr-only', text: 'Cargando reportes…' }),
    h(
      'div',
      { class: 'ps-report-queue__loading-rows', 'aria-hidden': 'true' },
      Array.from({ length: 5 }, () => h('div', { class: 'ps-report-queue__loading-row' })),
    ),
  );
}

function renderCell(column, row) {
  switch (column.key) {
    case 'id':
      return h('span', { class: 'ps-data-table__id', text: `#${row.id}` });
    case 'contenido':
      return h(
        'div',
        { class: 'ps-report-cell' },
        createAvatar({ name: row.nombre || row.handle, size: 'sm' }),
        h(
          'div',
          { class: 'ps-report-cell__main' },
          h('a', {
            class: 'ps-report-cell__title',
            href: `/admin/reportes/${row.id}`,
            text: row.titulo,
          }),
          h('span', { class: 'ps-report-cell__meta', text: row.contenido }),
        ),
      );
    case 'motivo':
      return h(
        'div',
        { class: 'ps-report-cell__stacked' },
        h('span', { class: 'ps-report-cell__motive', text: row.categoriaLabel }),
        h('span', { class: 'ps-report-cell__meta', text: row.tipoLabel }),
      );
    case 'denunciante':
      return h('span', { class: 'ps-data-table__text', text: row.reportadoPor });
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
    { class: 'ps-report-card', href: `/admin/reportes/${row.id}` },
    h(
      'div',
      { class: 'ps-report-card__head' },
      createAvatar({ name: row.nombre || row.handle, size: 'sm' }),
      h('span', { class: 'ps-report-card__handle', text: row.handle }),
      h('span', { class: 'ps-report-card__time', text: row.hace }),
      createAdminStatus(row.estado),
    ),
    h('span', { class: 'ps-report-card__title', text: row.titulo }),
    h('span', {
      class: 'ps-report-card__meta',
      text: `${row.categoriaLabel} · reportado por ${row.reportadoPor}`,
    }),
    h(
      'span',
      { class: 'ps-report-card__chevron', 'aria-hidden': 'true' },
      createIcon('chevron-right', { size: 18 }),
    ),
  );
}
