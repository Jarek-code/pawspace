import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

const ESTADOS = {
  PENDIENTE: { label: 'Pendiente', tone: 'warning' },
  EN_REVISION: { label: 'En revisión', tone: 'warning' },
  RESUELTO: { label: 'Resuelto', tone: 'success' },
  RECHAZADO: { label: 'Rechazado', tone: 'neutral' },
  APELADO: { label: 'Apelado', tone: 'info' },
};

const FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'EN_REVISION', label: 'En revisión' },
  { value: 'RESUELTO', label: 'Resueltos' },
  { value: 'RECHAZADO', label: 'Rechazados' },
  { value: 'APELADO', label: 'Apelados' },
];

/**
 * CMP-88 — ReportList.
 * Cada fila indica qué se reportó, dónde y cuándo. El estado nunca depende
 * solo del color: la píldora lleva texto. El detalle abre la cronología.
 */
export function createReportList({ reports = [], onOpen = null } = {}) {
  let filter = 'todos';

  const select = h(
    'select',
    {
      class: 'ps-settings-select',
      attrs: { 'aria-label': 'Filtrar reportes por estado' },
    },
    FILTERS.map((item) => h('option', { value: item.value, text: item.label })),
  );

  const host = h('div', { class: 'ps-report-list__host' });
  const element = h(
    'div',
    { class: 'ps-report-list' },
    h('div', { class: 'ps-report-list__toolbar' }, select),
    host,
  );

  function render() {
    const visible = reports.filter((report) => filter === 'todos' || report.estado === filter);

    if (!visible.length) {
      host.replaceChildren(
        createEmptyState({
          icon: 'shield',
          title: reports.length ? 'Sin reportes en este estado' : 'No has enviado reportes',
          body: reports.length
            ? 'Prueba con otro filtro para ver el resto de tus reportes.'
            : 'Cuando reportes contenido, aquí podrás seguir su estado.',
        }),
      );
      return;
    }

    host.replaceChildren(
      h(
        'ul',
        { class: 'ps-report-list__items', attrs: { 'aria-label': 'Reportes enviados' } },
        visible.map((report) => {
          const estado = ESTADOS[report.estado] || ESTADOS.PENDIENTE;

          return h(
            'li',
            { class: 'ps-report' },
            h(
              'span',
              { class: 'ps-report__icon', 'aria-hidden': 'true' },
              createIcon('warning', { size: 20 }),
            ),
            h(
              'span',
              { class: 'ps-report__text' },
              h('span', { class: 'ps-report__title', text: report.titulo }),
              h('span', { class: 'ps-report__target', text: report.objetivo }),
              h('span', { class: 'ps-report__date', text: report.fecha }),
            ),
            h('span', {
              class: `ps-status-pill ps-status-pill--${estado.tone}`,
              text: estado.label,
            }),
            h(
              'button',
              {
                class: 'ps-report__open',
                type: 'button',
                attrs: { 'aria-label': `Ver detalle del reporte ${report.titulo}` },
                onClick: () => onOpen?.(report),
              },
              'Ver detalle',
            ),
          );
        }),
      ),
    );
  }

  select.addEventListener('change', () => {
    filter = select.value;
    render();
  });

  render();

  return {
    element,
    setReports(next) {
      reports = next;
      render();
    },
  };
}
