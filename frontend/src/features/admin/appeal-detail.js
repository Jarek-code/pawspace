import { createAdminStatus } from '@/components/admin/admin-status.js';
import { openModerationDialog } from '@/components/admin/moderation-dialog.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { h } from '@/lib/dom.js';
import { acceptAdminAppeal, loadAdminAppeal, rejectAdminAppeal } from '@/services/admin.js';

/**
 * CMP-101 — AppealDetail (D39).
 * Reporte original y decisión de apelación: aceptar o rechazar con resolución
 * obligatoria.
 */
export function createAppealDetail({ router, id, refresh }) {
  const root = h('div', { class: 'ps-report-detail' });

  function load() {
    root.replaceChildren(
      h('div', {
        class: 'ps-report-detail__loading',
        attrs: { role: 'status', 'aria-live': 'polite' },
      }),
    );

    loadAdminAppeal(id)
      .then((appeal) => {
        root.replaceChildren(render(appeal));
      })
      .catch(() => {
        root.replaceChildren(
          createEmptyState({
            icon: 'alert',
            title: 'No encontramos esta apelación',
            body: 'Pudo haberse resuelto o retirado.',
            action: createButton({
              label: 'Volver a apelaciones',
              variant: 'secondary',
              onClick: () => router.navigate('/admin/apelaciones'),
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

  function render(appeal) {
    return h(
      'div',
      { class: 'ps-report-detail__inner' },
      h(
        'div',
        { class: 'ps-report-detail__head' },
        h('a', {
          class: 'ps-report-detail__back',
          href: '/admin/apelaciones',
          text: 'Volver a apelaciones',
        }),
        h(
          'div',
          { class: 'ps-report-detail__heading' },
          h(
            'div',
            { class: 'ps-report-detail__title-row' },
            h('h2', { class: 'ps-report-detail__title', text: `Apelación #${appeal.id}` }),
            createAdminStatus(appeal.estado),
          ),
          h('p', {
            class: 'ps-report-detail__subtitle',
            text: `${appeal.handle} · Reporte #${appeal.reporteId} · ${appeal.hace}`,
          }),
        ),
      ),
      h(
        'div',
        { class: 'ps-report-detail__columns' },
        h(
          'div',
          { class: 'ps-report-detail__main' },
          renderMotivoCard(appeal),
          renderReporteCard(appeal),
        ),
        h(
          'div',
          { class: 'ps-report-detail__side' },
          renderDecisionCard(appeal),
          renderPersonCard(appeal),
          renderMetadataCard(appeal),
        ),
      ),
    );
  }

  function renderMotivoCard(appeal) {
    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Motivo de la apelación' }),
      h('p', { class: 'ps-report-content__text', text: appeal.motivo }),
    );
  }

  function renderReporteCard(appeal) {
    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Reporte original' }),
      appeal.reporteOriginal
        ? h(
            'a',
            { class: 'ps-admin-row', href: `/admin/reportes/${appeal.reporteOriginal.id}` },
            h('span', { class: 'ps-admin-row__id', text: `#${appeal.reporteOriginal.id}` }),
            h(
              'span',
              { class: 'ps-admin-row__main' },
              h('span', { class: 'ps-admin-row__title', text: appeal.reporteOriginal.titulo }),
              h('span', {
                class: 'ps-admin-row__meta',
                text: appeal.reporteOriginal.categoriaLabel,
              }),
            ),
          )
        : h('p', {
            class: 'ps-report-detail__empty',
            text: 'El contenido original ya no está disponible.',
          }),
    );
  }

  function renderDecisionCard(appeal) {
    const decidida = appeal.estado === 'ACEPTADA' || appeal.estado === 'RECHAZADA';

    const aceptar = createButton({
      label: 'Aceptar apelación',
      variant: 'primary',
      fullWidth: true,
      onClick: () =>
        openModerationDialog({
          titulo: 'Aceptar apelación',
          cuerpo: 'La resolución queda en el historial de la apelación.',
          fieldLabel: 'Resolución',
          confirmLabel: 'Aceptar apelación',
          variante: 'primary',
          onConfirm: (resolucion) => apply(() => acceptAdminAppeal(id, resolucion)),
        }),
    });

    const rechazar = createButton({
      label: 'Rechazar apelación',
      variant: 'secondary',
      fullWidth: true,
      onClick: () =>
        openModerationDialog({
          titulo: 'Rechazar apelación',
          cuerpo: 'Explica por qué la decisión original se mantiene.',
          fieldLabel: 'Resolución',
          confirmLabel: 'Rechazar apelación',
          variante: 'danger',
          onConfirm: (resolucion) => apply(() => rejectAdminAppeal(id, resolucion)),
        }),
    });

    const acciones = decidida
      ? [
          h('p', {
            class: 'ps-report-detail__decided',
            text: `${appeal.estado === 'ACEPTADA' ? 'Aceptada' : 'Rechazada'}: ${appeal.resolucion || 'Resolución registrada.'}`,
          }),
        ]
      : [aceptar.element, rechazar.element];

    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Siguiente paso' }),
      h('div', { class: 'ps-report-detail__actions' }, acciones),
    );
  }

  function renderPersonCard(appeal) {
    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Mascota' }),
      h(
        'div',
        { class: 'ps-report-person' },
        createAvatar({ name: appeal.nombre, size: 'md' }),
        h(
          'div',
          { class: 'ps-report-person__main' },
          h('span', { class: 'ps-report-person__name', text: appeal.handle }),
          h('span', { class: 'ps-report-person__meta', text: 'Apela una decisión de moderación' }),
        ),
        h('a', { class: 'ps-report-person__link', href: '/admin/usuarios', text: 'Ver perfil' }),
      ),
    );
  }

  function renderMetadataCard(appeal) {
    const rows = [
      { label: 'ID', value: `#${appeal.id}` },
      { label: 'Reporte', value: `#${appeal.reporteId}` },
      { label: 'Fecha', value: appeal.hace },
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
