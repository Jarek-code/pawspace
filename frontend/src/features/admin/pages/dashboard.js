import { createAdminStatus } from '@/components/admin/admin-status.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { h } from '@/lib/dom.js';
import { mountAdminPage } from '@/features/admin/admin-page.js';

/**
 * D34 / M27 — Resumen de administración.
 * Masthead editorial, pulso por tipo, cola priorizada y movimiento del día.
 * La acción principal es revisar lo pendiente.
 */
export function createPage({ router } = {}) {
  return mountAdminPage({
    active: 'resumen',
    title: 'Administración',
    subtitle: 'Reportes, soporte y contenido de PawSpace.',
    hidePageHeading: true,
    router,
    createContent: ({ data }) => createDashboard(data),
  });
}

function createDashboard(data) {
  const { metricas } = data;
  const entries = [
    {
      key: 'reporte',
      label: 'Reportes',
      value: metricas.reportesPendientes.valor,
      note: metricas.reportesPendientes.nota,
    },
    {
      key: 'revision',
      label: 'En revisión',
      value: metricas.enRevision.valor,
      note: metricas.enRevision.nota,
    },
    {
      key: 'soporte',
      label: 'Soporte',
      value: metricas.ticketsAbiertos.valor,
      note: metricas.ticketsAbiertos.nota,
    },
    {
      key: 'apelaciones',
      label: 'Apelaciones',
      value: metricas.apelacionesPendientes.valor,
      note: metricas.apelacionesPendientes.nota,
    },
  ];
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  const nuevasHoy = data.resumen?.nuevasHoy ?? 0;
  const vencen24h = data.resumen?.vencen24h ?? 0;
  const queue = buildQueue(data);

  return h(
    'div',
    { class: 'ps-admin-dashboard' },
    createMasthead({ total, nuevasHoy, vencen24h }),
    createPulse(entries),
    createQueue(queue),
    createActivityStrip(data.actividad, data.sistema),
  );
}

function createMasthead({ total, nuevasHoy, vencen24h }) {
  return h(
    'header',
    { class: 'ps-admin-dashboard__masthead' },
    h(
      'div',
      { class: 'ps-admin-dashboard__masthead-copy' },
      h('h2', { class: 'ps-admin-dashboard__today', text: 'Hoy' }),
      h('p', { class: 'ps-admin-dashboard__date', text: todayLabel() }),
    ),
    h(
      'div',
      { class: 'ps-admin-dashboard__totals' },
      h(
        'p',
        { class: 'ps-admin-dashboard__total' },
        h('strong', { text: String(total) }),
        ' asuntos abiertos',
      ),
      h('p', {
        class: 'ps-admin-dashboard__total-meta',
        text: `${nuevasHoy} llegaron hoy · ${vencen24h} vencen en 24 h`,
      }),
    ),
  );
}

function createPulse(entries) {
  const summary = entries.map((entry) => `${entry.value} ${entry.label.toLowerCase()}`).join(', ');

  return h(
    'section',
    { class: 'ps-admin-pulse', attrs: { 'aria-labelledby': 'ps-admin-pulse-title' } },
    h(
      'div',
      { class: 'ps-admin-pulse__head' },
      h('h2', {
        class: 'ps-admin-pulse__title',
        id: 'ps-admin-pulse-title',
        text: 'Pulso por tipo',
      }),
      h('p', { class: 'ps-admin-pulse__note', text: '4 colas activas' }),
    ),
    h(
      'div',
      { class: 'ps-admin-pulse__body' },
      h(
        'div',
        {
          class: 'ps-admin-pulse__meter',
          attrs: { role: 'img', 'aria-label': `Pulso por tipo: ${summary}` },
        },
        entries.map((entry) =>
          h('span', {
            class: `ps-admin-pulse__segment ps-admin-pulse__segment--${entry.key}`,
            style: { flexGrow: String(entry.value || 0) },
            'aria-hidden': 'true',
          }),
        ),
      ),
      h(
        'ul',
        { class: 'ps-admin-pulse__legend' },
        entries.map((entry) =>
          h(
            'li',
            { class: 'ps-admin-pulse__legend-item', attrs: { title: entry.note } },
            h('span', {
              class: `ps-admin-pulse__dot ps-admin-pulse__dot--${entry.key}`,
              'aria-hidden': 'true',
            }),
            h('span', {
              class: 'ps-admin-pulse__legend-text',
              text: `${entry.label} · ${entry.value}`,
            }),
          ),
        ),
      ),
    ),
  );
}

function createQueue(items) {
  return h(
    'section',
    { class: 'ps-admin-queue', attrs: { 'aria-labelledby': 'ps-admin-queue-title' } },
    h(
      'header',
      { class: 'ps-admin-queue__head' },
      h(
        'div',
        {},
        h('h2', {
          class: 'ps-admin-queue__title',
          id: 'ps-admin-queue-title',
          text: 'Cola priorizada',
        }),
        h('p', {
          class: 'ps-admin-queue__note',
          text: 'Ordenada por urgencia y tiempo de espera',
        }),
      ),
      h('a', { class: 'ps-admin-queue__action', href: '/admin/reportes', text: 'Ver reportes' }),
    ),
    items.length
      ? h(
          'ol',
          { class: 'ps-admin-queue__list' },
          items.map((item, index) => h('li', {}, createQueueRow(item, index))),
        )
      : createEmptyState({
          icon: 'flag',
          title: 'No hay pendientes',
          body: 'Cuando la comunidad reporte algo, aparecerá aquí.',
        }),
  );
}

function createQueueRow(item, index) {
  return h(
    'a',
    { class: 'ps-admin-queue__row', href: item.href },
    h('span', {
      class: 'ps-admin-queue__rank',
      text: String(index + 1).padStart(2, '0'),
    }),
    h(
      'span',
      { class: 'ps-admin-queue__body' },
      h('span', {
        class: `ps-admin-queue__type ps-admin-queue__type--${item.type}`,
        text: item.typeLabel,
      }),
      h('span', { class: 'ps-admin-queue__row-title', text: item.title }),
      h('span', { class: 'ps-admin-queue__meta', text: item.meta }),
    ),
    createAdminStatus(item.estado),
  );
}

function createActivityStrip(items, system) {
  return h(
    'section',
    { class: 'ps-admin-activity-strip', attrs: { 'aria-labelledby': 'ps-admin-activity-title' } },
    h(
      'header',
      { class: 'ps-admin-activity-strip__head' },
      h('h2', {
        class: 'ps-admin-activity-strip__title',
        id: 'ps-admin-activity-title',
        text: 'Movimiento de hoy',
      }),
      system
        ? h(
            'span',
            {
              class: `ps-admin-activity-strip__system${
                system.estado === 'operativo' ? '' : ' ps-admin-activity-strip__system--attention'
              }`,
            },
            system.title,
          )
        : null,
    ),
    items.length
      ? h(
          'ol',
          { class: 'ps-admin-activity-strip__list' },
          items.map((item, index) =>
            h(
              'li',
              { class: 'ps-admin-activity-strip__item' },
              h(
                'span',
                { class: 'ps-admin-activity-strip__meta' },
                h('span', {
                  class: `ps-admin-activity-strip__dot ps-admin-activity-strip__dot--${
                    ['forest', 'info', 'warning', 'coral'][index % 4]
                  }`,
                  'aria-hidden': 'true',
                }),
                h('time', { class: 'ps-admin-activity-strip__time', text: item.hora }),
              ),
              h('span', { class: 'ps-admin-activity-strip__text', text: item.texto }),
            ),
          ),
        )
      : createEmptyState({
          icon: 'clock',
          title: 'Sin actividad todavía',
          body: 'Las decisiones y respuestas del día aparecerán aquí.',
        }),
  );
}

function buildQueue(data) {
  const reports = data.reportesRecientes.map((report) => ({
    key: `reporte-${report.id}`,
    type: 'reporte',
    typeLabel: 'REPORTE',
    title: report.titulo,
    meta: `${report.categoriaLabel} · ${report.hace}`,
    estado: report.estado,
    href: `/admin/reportes/${report.id}`,
  }));
  const tickets = data.ticketsRecientes.map((ticket) => ({
    key: `soporte-${ticket.id}`,
    type: 'soporte',
    typeLabel: 'SOPORTE',
    title: `Ticket #${ticket.id} · ${ticket.persona}`,
    meta: `${ticket.asunto} · ${ticket.temaLabel}`,
    estado: ticket.estado,
    href: `/admin/soporte/${ticket.id}`,
  }));
  const appeals = data.apelacionesRecientes.map((appeal) => ({
    key: `apelacion-${appeal.id}`,
    type: 'apelacion',
    typeLabel: 'APELACIÓN',
    title: `${appeal.nombre} · ${appeal.handle}`,
    meta: `Apelación del reporte #${appeal.reporteId}`,
    estado: appeal.estado,
    href: `/admin/apelaciones/${appeal.id}`,
  }));

  const preferred = [
    reports[0],
    reports[1],
    tickets[0],
    appeals[0],
    reports[2],
    tickets[1],
    appeals[1],
    reports[3],
    tickets[2],
    appeals[2],
  ];
  const queue = [];
  const seen = new Set();

  for (const item of preferred) {
    if (item && !seen.has(item.key) && queue.length < 5) {
      seen.add(item.key);
      queue.push(item);
    }
  }

  for (const item of [...reports, ...tickets, ...appeals]) {
    if (!seen.has(item.key) && queue.length < 5) {
      seen.add(item.key);
      queue.push(item);
    }
  }

  return queue;
}

function todayLabel() {
  const formatted = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return `${formatted.replace(',', '')} · edición de la comunidad`;
}
