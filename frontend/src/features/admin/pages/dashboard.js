import { createAdminStatus } from '@/components/admin/admin-status.js';
import { createMetricCard } from '@/components/admin/metric-card.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { h } from '@/lib/dom.js';
import { mountAdminPage } from '@/features/admin/admin-page.js';

/**
 * D34 / M27 — Panel de administración.
 * Métricas del día, reportes y tickets recientes, apelaciones pendientes y
 * actividad. La acción principal es revisar lo pendiente.
 */
export function createPage({ router } = {}) {
  return mountAdminPage({
    active: 'resumen',
    title: 'Administración',
    subtitle: 'Reportes, soporte y contenido de PawSpace.',
    router,
    createContent: ({ data }) => createDashboard(data),
  });
}

function createDashboard(data) {
  const { metricas } = data;

  return h(
    'div',
    { class: 'ps-admin-dashboard' },
    h(
      'section',
      { class: 'ps-admin-metrics', attrs: { 'aria-label': 'Métricas del panel' } },
      createMetricCard({
        label: 'Reportes pendientes',
        value: metricas.reportesPendientes.valor,
        note: metricas.reportesPendientes.nota,
        icon: 'flag',
        tone: 'sun',
      }),
      createMetricCard({
        label: 'En revisión',
        value: metricas.enRevision.valor,
        note: metricas.enRevision.nota,
        icon: 'eye',
        tone: 'forest',
      }),
      createMetricCard({
        label: 'Tickets abiertos',
        value: metricas.ticketsAbiertos.valor,
        note: metricas.ticketsAbiertos.nota,
        icon: 'headset',
        tone: 'coral',
      }),
      createMetricCard({
        label: 'Apelaciones',
        value: metricas.apelacionesPendientes.valor,
        note: metricas.apelacionesPendientes.nota,
        icon: 'scale',
        tone: 'danger',
      }),
    ),
    h(
      'div',
      { class: 'ps-admin-dashboard__columns ps-admin-dashboard__panels' },
      h(
        'div',
        { class: 'ps-admin-dashboard__main' },
        createPanel({
          title: 'Reportes recientes',
          href: '/admin/reportes',
          items: data.reportesRecientes.map(reportRow),
          emptyTitle: 'No hay reportes pendientes',
          emptyBody: 'Cuando la comunidad reporte algo, aparecerá aquí.',
        }),
        createPanel({
          title: 'Apelaciones pendientes',
          href: '/admin/apelaciones',
          actionLabel: 'Ver todas',
          items: data.apelacionesRecientes.map(appealRow),
          emptyTitle: 'No hay apelaciones pendientes',
          emptyBody: 'Las solicitudes de revisión aparecerán aquí.',
        }),
      ),
      h(
        'div',
        { class: 'ps-admin-dashboard__side' },
        createPanel({
          title: 'Tickets recientes',
          href: '/admin/soporte',
          items: data.ticketsRecientes.map(ticketRow),
          emptyTitle: 'No hay tickets abiertos',
          emptyBody: 'Las solicitudes de soporte aparecerán aquí.',
        }),
        createActivityPanel(data.actividad),
      ),
    ),
    createPriorityPanel(data),
  );
}

function createPriorityPanel(data) {
  const items = [
    ...data.reportesRecientes.slice(0, 2).map(reportRow),
    ...(data.ticketsRecientes[0] ? [priorityTicketRow(data.ticketsRecientes[0])] : []),
  ];

  return h(
    'section',
    { class: 'ps-admin-panel ps-admin-dashboard__priority' },
    h(
      'header',
      { class: 'ps-admin-panel__head' },
      h('h2', { class: 'ps-admin-panel__title', text: 'Prioridad de hoy' }),
      h('a', { class: 'ps-admin-panel__action', href: '/admin/reportes', text: 'Ver todo' }),
    ),
    h('ul', { class: 'ps-admin-panel__list' }, items),
    h('p', {
      class: 'ps-admin-priority__hint',
      text: 'Toca un elemento para revisarlo y tomar una decisión.',
    }),
  );
}

function createPanel({ title, href, actionLabel = 'Ver todos', items, emptyTitle, emptyBody }) {
  return h(
    'section',
    { class: 'ps-admin-panel' },
    h(
      'header',
      { class: 'ps-admin-panel__head' },
      h('h2', { class: 'ps-admin-panel__title', text: title }),
      href ? h('a', { class: 'ps-admin-panel__action', href, text: actionLabel }) : null,
    ),
    items.length
      ? h('ul', { class: 'ps-admin-panel__list' }, items)
      : createEmptyState({ icon: 'paw-print', title: emptyTitle, body: emptyBody }),
  );
}

function createActivityPanel(items) {
  return h(
    'section',
    { class: 'ps-admin-panel' },
    h(
      'header',
      { class: 'ps-admin-panel__head' },
      h('h2', { class: 'ps-admin-panel__title', text: 'Actividad de hoy' }),
    ),
    items.length
      ? h(
          'ol',
          { class: 'ps-admin-activity', attrs: { 'aria-label': 'Actividad de hoy' } },
          items.map((item) =>
            h(
              'li',
              { class: 'ps-admin-activity__item' },
              h('span', { class: 'ps-admin-activity__time', text: item.hora }),
              h('span', { class: 'ps-admin-activity__dot', 'aria-hidden': 'true' }),
              h('span', { class: 'ps-admin-activity__text', text: item.texto }),
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

function reportRow(report) {
  return h(
    'li',
    {},
    h(
      'a',
      { class: 'ps-admin-row', href: `/admin/reportes/${report.id}` },
      createAvatar({ name: report.nombre || report.handle, size: 'sm' }),
      h(
        'span',
        { class: 'ps-admin-row__main' },
        h('span', { class: 'ps-admin-row__title', text: report.titulo }),
        h('span', {
          class: 'ps-admin-row__meta',
          text: `${report.categoriaLabel} · ${report.hace}`,
        }),
      ),
      createAdminStatus(report.estado),
    ),
  );
}

function ticketRow(ticket) {
  return h(
    'li',
    {},
    h(
      'a',
      { class: 'ps-admin-row ps-admin-row--ticket', href: `/admin/soporte/${ticket.id}` },
      h('span', { class: 'ps-admin-row__id', text: `#${ticket.id}` }),
      h('span', { class: 'ps-admin-row__title', text: ticket.asunto }),
      h('span', {
        class: 'ps-admin-row__meta',
        text: `${ticket.persona} · ${ticket.temaLabel}`,
      }),
      createAdminStatus(ticket.estado),
    ),
  );
}

function priorityTicketRow(ticket) {
  return h(
    'li',
    {},
    h(
      'a',
      { class: 'ps-admin-row', href: `/admin/soporte/${ticket.id}` },
      createAvatar({ name: ticket.persona, size: 'sm' }),
      h(
        'span',
        { class: 'ps-admin-row__main' },
        h('span', { class: 'ps-admin-row__title', text: `Ticket #${ticket.id}` }),
        h('span', {
          class: 'ps-admin-row__meta',
          text: `${ticket.persona} · ${ticket.asunto}`,
        }),
      ),
      createAdminStatus(ticket.estado),
    ),
  );
}

function appealRow(appeal) {
  return h(
    'li',
    {},
    h(
      'a',
      { class: 'ps-admin-row', href: `/admin/apelaciones/${appeal.id}` },
      createAvatar({ name: appeal.nombre, size: 'sm' }),
      h(
        'span',
        { class: 'ps-admin-row__main' },
        h('span', {
          class: 'ps-admin-row__title',
          text: `${appeal.nombre} · ${appeal.handle}`,
        }),
        h('span', {
          class: 'ps-admin-row__meta',
          text: `Apelación del reporte #${appeal.reporteId}`,
        }),
      ),
      createAdminStatus(appeal.estado),
    ),
  );
}
