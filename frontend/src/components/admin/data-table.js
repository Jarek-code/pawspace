import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

/**
 * CMP-97 — DataTable.
 * Tabla densa de administración (fila de 56 px) que en móvil se convierte en
 * tarjetas de una columna. Encapsula cabecera, cuerpo, vacío y paginación; cada
 * pantalla aporta columnas y el render de celda/tarjeta.
 */
export function createDataTable({
  columns = [],
  rows = [],
  cell = () => '',
  card = null,
  caption = '',
  currentPage = 1,
  total = rows.length,
  pageSize = 8,
  onPageChange = null,
  empty = null,
} = {}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, currentPage), totalPages);
  const inicio = (page - 1) * pageSize;
  const fin = Math.min(inicio + rows.length, total);
  const rango = total ? `${inicio + 1}–${fin} de ${total}` : '0 de 0';

  const head = h(
    'thead',
    { class: 'ps-data-table__head' },
    h(
      'tr',
      {},
      columns.map((column) =>
        h('th', {
          class: column.hideOnMobile ? 'ps-data-table__cell--mobile-hide' : '',
          text: column.label,
        }),
      ),
    ),
  );

  const body = h(
    'tbody',
    { class: 'ps-data-table__body' },
    rows.map((row) =>
      h(
        'tr',
        { class: 'ps-data-table__row' },
        columns.map((column) => h('td', { class: 'ps-data-table__cell' }, cell(column, row))),
      ),
    ),
  );

  const table = h(
    'div',
    { class: 'ps-data-table__scroll' },
    h(
      'table',
      { class: 'ps-data-table__table' },
      caption ? h('caption', { class: 'ps-sr-only', text: caption }) : null,
      head,
      body,
    ),
  );

  const cards = card
    ? h(
        'ul',
        { class: 'ps-data-table__cards' },
        rows.map((row) => h('li', { class: 'ps-data-table__card' }, card(row))),
      )
    : null;

  const prev = h(
    'button',
    {
      class: 'ps-data-table__page',
      type: 'button',
      attrs: { 'aria-label': 'Página anterior', disabled: page <= 1 ? '' : null },
    },
    createIcon('chevron-left', { size: 18 }),
  );
  const next = h(
    'button',
    {
      class: 'ps-data-table__page',
      type: 'button',
      attrs: { 'aria-label': 'Página siguiente', disabled: page >= totalPages ? '' : null },
    },
    createIcon('chevron-right', { size: 18 }),
  );

  prev.disabled = page <= 1;
  next.disabled = page >= totalPages;

  prev.addEventListener('click', () => {
    if (page > 1 && onPageChange) {
      onPageChange(page - 1);
    }
  });

  next.addEventListener('click', () => {
    if (page < totalPages && onPageChange) {
      onPageChange(page + 1);
    }
  });

  const footer = h(
    'div',
    { class: 'ps-data-table__footer' },
    h('p', { class: 'ps-data-table__range', text: rango }),
    h('div', { class: 'ps-data-table__pagination' }, prev, next),
  );

  const emptyNode = empty
    ? createEmptyState({
        icon: empty.icon || 'paw-print',
        title: empty.title || '',
        body: empty.body || '',
        action: empty.action || null,
      })
    : null;

  const element = h(
    'div',
    { class: 'ps-data-table' },
    table,
    cards,
    rows.length ? null : emptyNode,
    footer,
  );

  return element;
}
