import { createAdminStatus } from '@/components/admin/admin-status.js';
import { openModerationDialog } from '@/components/admin/moderation-dialog.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { showToast } from '@/components/primitives/toast.js';
import { h } from '@/lib/dom.js';
import {
  loadAdminReport,
  markAdminReportReview,
  moderateAdminContent,
  rejectAdminReport,
  resolveAdminReport,
} from '@/services/admin.js';

/**
 * CMP-100 — ReportDetail.
 * Evidencia del contenido, cronología, relacionados y decisiones. Las acciones
 * destructivas piden motivo; resolver y rechazar piden nota o motivo.
 */
export function createReportDetail({ router, id, refresh }) {
  const root = h('div', { class: 'ps-report-detail' });

  function load() {
    root.replaceChildren(createLoading());

    loadAdminReport(id)
      .then((report) => {
        root.replaceChildren(render(report));
      })
      .catch(() => {
        root.replaceChildren(
          createEmptyState({
            icon: 'alert',
            title: 'No encontramos este reporte',
            body: 'Pudo haberse resuelto o eliminado.',
            action: createButton({
              label: 'Volver a reportes',
              variant: 'secondary',
              onClick: () => router.navigate('/admin/reportes'),
            }).element,
          }),
        );
      });
  }

  function apply(fn) {
    return fn()
      .then(() => {
        refresh?.();
        load();
      })
      .catch(() => {
        /* el diálogo ya mostró el error */
      });
  }

  load();

  return root;

  function render(report) {
    return h(
      'div',
      { class: 'ps-report-detail__inner' },
      renderHeading(report),
      h(
        'div',
        { class: 'ps-report-detail__columns' },
        h(
          'div',
          { class: 'ps-report-detail__main' },
          renderContentCard(report),
          renderHistoryCard(report),
          renderRelatedCard(report),
        ),
        h(
          'div',
          { class: 'ps-report-detail__side' },
          renderNextStepCard(report),
          renderPersonCard('Denunciante', report.denunciante, report.reportadoPor),
          renderPersonCard('Denunciado', report.denunciado, report.handle),
          renderMetadataCard(report),
        ),
      ),
    );
  }

  function renderHeading(report) {
    return h(
      'div',
      { class: 'ps-report-detail__head' },
      h('a', {
        class: 'ps-report-detail__back',
        href: '/admin/reportes',
        text: 'Volver a reportes',
      }),
      h(
        'div',
        { class: 'ps-report-detail__heading' },
        h(
          'div',
          { class: 'ps-report-detail__title-row' },
          h('h2', { class: 'ps-report-detail__title', text: `Reporte #${report.id}` }),
          createAdminStatus(report.estado),
        ),
        h('p', {
          class: 'ps-report-detail__subtitle',
          text: `${report.titulo} · Reportada por ${report.reportadoPor} · ${report.hace}`,
        }),
      ),
      h('span', { class: 'ps-report-detail__category', text: report.categoriaLabel }),
    );
  }

  function renderContentCard(report) {
    const noDisponible = report.contenidoNoDisponible;

    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Contenido reportado' }),
      noDisponible
        ? h('p', { class: 'ps-report-detail__unavailable', text: 'Contenido no disponible.' })
        : h(
            'div',
            { class: 'ps-report-content' },
            h(
              'div',
              { class: 'ps-report-content__head' },
              createAvatar({ name: report.nombre || report.handle, size: 'sm' }),
              h(
                'div',
                { class: 'ps-report-content__meta' },
                h('span', { class: 'ps-report-content__name', text: report.handle }),
                h('span', {
                  class: 'ps-report-content__time',
                  text: `${report.hace} · ${report.tipoLabel}`,
                }),
              ),
            ),
            h('p', { class: 'ps-report-content__text', text: report.contenido }),
            h('a', { class: 'ps-report-content__link', href: '/inicio', text: 'Ver publicación' }),
          ),
    );
  }

  function renderHistoryCard(report) {
    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Historial del reporte' }),
      h(
        'ol',
        { class: 'ps-report-timeline' },
        report.cronologia.map((item, index) =>
          h(
            'li',
            { class: `ps-report-timeline__item${index === 0 ? ' is-current' : ''}` },
            h('span', { class: 'ps-report-timeline__dot', 'aria-hidden': 'true' }),
            h(
              'div',
              { class: 'ps-report-timeline__body' },
              h('p', { class: 'ps-report-timeline__text', text: item.texto }),
              h('span', { class: 'ps-report-timeline__time', text: item.fecha }),
            ),
          ),
        ),
      ),
    );
  }

  function renderRelatedCard(report) {
    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Reportes relacionados' }),
      report.relacionados.length
        ? h(
            'ul',
            { class: 'ps-admin-panel__list' },
            report.relacionados.map((related) =>
              h(
                'li',
                {},
                h(
                  'a',
                  { class: 'ps-admin-row', href: `/admin/reportes/${related.id}` },
                  h('span', { class: 'ps-admin-row__id', text: `#${related.id}` }),
                  h(
                    'span',
                    { class: 'ps-admin-row__main' },
                    h('span', { class: 'ps-admin-row__title', text: related.titulo }),
                    h('span', {
                      class: 'ps-admin-row__meta',
                      text: related.categoriaLabel,
                    }),
                  ),
                  createAdminStatus(related.estado),
                ),
              ),
            ),
          )
        : h('p', {
            class: 'ps-report-detail__empty',
            text: 'No hay otros reportes de esta cuenta.',
          }),
    );
  }

  function renderNextStepCard(report) {
    const decidido = report.estado === 'RESUELTO' || report.estado === 'RECHAZADO';

    const resolver = createButton({
      label: 'Resolver reporte',
      variant: 'primary',
      fullWidth: true,
      onClick: () =>
        openModerationDialog({
          titulo: 'Resolver reporte',
          cuerpo: 'La decisión queda en el historial del reporte.',
          fieldLabel: 'Nota de resolución',
          confirmLabel: 'Resolver reporte',
          variante: 'primary',
          onConfirm: (nota) => apply(() => resolveAdminReport(id, nota)),
        }),
    });

    const rechazar = createButton({
      label: 'Rechazar reporte',
      variant: 'secondary',
      fullWidth: true,
      onClick: () =>
        openModerationDialog({
          titulo: 'Rechazar reporte',
          cuerpo: 'Explica por qué el reporte no procede.',
          fieldLabel: 'Motivo',
          confirmLabel: 'Rechazar reporte',
          variante: 'danger',
          onConfirm: (motivo) => apply(() => rejectAdminReport(id, motivo)),
        }),
    });

    const marcar = createButton({
      label: 'Marcar en revisión',
      variant: 'ghost',
      fullWidth: true,
      onClick: () =>
        apply(() => markAdminReportReview(id)).then(() =>
          showToast('Reporte marcado en revisión.', { variant: 'success' }),
        ),
    });

    const acciones = [];

    if (decidido) {
      acciones.push(
        h('p', {
          class: 'ps-report-detail__decided',
          text:
            report.estado === 'RESUELTO'
              ? `Resuelto: ${report.resolucion || 'Decisión registrada.'}`
              : `Rechazado: ${report.motivo || 'Motivo registrado.'}`,
        }),
      );
    } else {
      acciones.push(resolver.element, rechazar.element);

      if (report.estado === 'PENDIENTE') {
        acciones.push(marcar.element);
      }
    }

    acciones.push(renderContentActions(report));

    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Siguiente paso' }),
      h('div', { class: 'ps-report-detail__actions' }, acciones),
    );
  }

  function renderContentActions(report) {
    const esMensaje = report.tipo === 'mensaje';
    const historiaVencida = report.tipo === 'historia' && report.minutos >= 1440;
    const noDisponible = report.contenidoNoDisponible;
    const decidido = report.estado === 'RESUELTO' || report.estado === 'RECHAZADO';

    const ocultar = createButton({
      label: 'Ocultar contenido',
      variant: 'ghost',
      size: 'sm',
      fullWidth: true,
      disabled: decidido || esMensaje || historiaVencida || noDisponible,
      onClick: () =>
        openModerationDialog({
          titulo: `Ocultar ${report.tipoLabel.toLowerCase()}`,
          cuerpo: 'Dejará de ser visible para las demás personas.',
          confirmLabel: 'Ocultar contenido',
          variante: 'secondary',
          onConfirm: (motivo) =>
            apply(() => moderateAdminContent(id, { accion: 'ocultar', motivo })),
        }),
    });

    const eliminar = createButton({
      label: 'Eliminar contenido',
      variant: 'ghost',
      size: 'sm',
      fullWidth: true,
      disabled: decidido || esMensaje || historiaVencida || noDisponible,
      onClick: () =>
        openModerationDialog({
          titulo: `Eliminar ${report.tipoLabel.toLowerCase()}`,
          cuerpo: 'Se marcará como eliminado y ya no se mostrará.',
          confirmLabel: 'Eliminar contenido',
          variante: 'danger',
          onConfirm: (motivo) =>
            apply(() => moderateAdminContent(id, { accion: 'eliminar', motivo })),
        }),
    });

    const suspender = createButton({
      label: 'Suspender cuenta',
      variant: 'ghost',
      size: 'sm',
      fullWidth: true,
      disabled: decidido,
      onClick: () =>
        openModerationDialog({
          titulo: `Suspender la cuenta ${report.handle}`,
          cuerpo: 'La cuenta no podrá iniciar sesión.',
          advertencia: 'La suspensión es indefinida y la cuenta no podrá iniciar sesión.',
          confirmLabel: 'Suspender cuenta',
          variante: 'danger',
          onConfirm: (motivo) =>
            apply(() => moderateAdminContent(id, { accion: 'suspender', motivo })),
        }),
    });

    return h(
      'div',
      { class: 'ps-report-detail__moderation' },
      h('p', { class: 'ps-report-detail__moderation-label', text: 'Moderar contenido' }),
      h(
        'div',
        { class: 'ps-report-detail__moderation-actions' },
        ocultar.element,
        eliminar.element,
        suspender.element,
      ),
      esMensaje
        ? h('p', {
            class: 'ps-report-detail__hint',
            text: 'Los reportes de mensajes no se pueden ocultar ni eliminar.',
          })
        : null,
    );
  }

  function renderPersonCard(title, persona, handle) {
    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: title }),
      h(
        'div',
        { class: 'ps-report-person' },
        createAvatar({ name: persona.nombre, size: 'md' }),
        h(
          'div',
          { class: 'ps-report-person__main' },
          h('span', { class: 'ps-report-person__name', text: persona.handle || handle }),
          h('span', {
            class: 'ps-report-person__meta',
            text: `${persona.reportes} reportes enviados`,
          }),
        ),
        h('a', { class: 'ps-report-person__link', href: '/admin/usuarios', text: 'Ver perfil' }),
      ),
    );
  }

  function renderMetadataCard(report) {
    const rows = [
      { label: 'ID', value: `#${report.metadatos.id}` },
      { label: 'Creado', value: report.metadatos.creado },
      { label: 'Categoría', value: report.metadatos.categoria },
      { label: 'Origen', value: report.metadatos.origen },
    ];

    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Metadatos' }),
      h(
        'dl',
        { class: 'ps-report-metadata' },
        rows.map((row) =>
          h(
            'div',
            { class: 'ps-report-metadata__row' },
            h('dt', { class: 'ps-report-metadata__label', text: row.label }),
            h('dd', { class: 'ps-report-metadata__value', text: row.value }),
          ),
        ),
      ),
    );
  }
}

function createLoading() {
  return h(
    'div',
    { class: 'ps-report-detail__loading', attrs: { role: 'status', 'aria-live': 'polite' } },
    h('span', { class: 'ps-sr-only', text: 'Cargando detalle del reporte…' }),
    h('div', { class: 'ps-report-detail__loading-heading', 'aria-hidden': 'true' }),
    h('div', { class: 'ps-report-detail__loading-grid', 'aria-hidden': 'true' }),
  );
}
