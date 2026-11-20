import { createAdminStatus } from '@/components/admin/admin-status.js';
import { openModerationDialog } from '@/components/admin/moderation-dialog.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createBadge } from '@/components/primitives/badge.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { showToast } from '@/components/primitives/toast.js';
import { h } from '@/lib/dom.js';
import { loadAdminUser, reactivateAdminUser, suspendAdminUser } from '@/services/admin.js';

/**
 * CMP-108 — UserDetail (D46).
 * Ficha, mascotas, actividad y suspensión o reactivación de la cuenta.
 */
export function createUserDetail({ router, id, refresh }) {
  const root = h('div', { class: 'ps-report-detail' });

  function load() {
    root.replaceChildren(
      h('div', {
        class: 'ps-report-detail__loading',
        attrs: { role: 'status', 'aria-live': 'polite' },
      }),
    );

    loadAdminUser(id)
      .then((user) => {
        root.replaceChildren(render(user));
      })
      .catch(() => {
        root.replaceChildren(
          createEmptyState({
            icon: 'alert',
            title: 'No encontramos esta cuenta',
            body: 'Pudo haberse eliminado.',
            action: createButton({
              label: 'Volver a usuarios',
              variant: 'secondary',
              onClick: () => router.navigate('/admin/usuarios'),
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
      .catch((error) => {
        showToast(error?.message || 'No pudimos completar la acción.', { variant: 'error' });
      });
  }

  load();

  return root;

  function render(user) {
    return h(
      'div',
      { class: 'ps-report-detail__inner' },
      h(
        'div',
        { class: 'ps-report-detail__head' },
        h('a', {
          class: 'ps-report-detail__back',
          href: '/admin/usuarios',
          text: 'Volver a usuarios',
        }),
        h(
          'div',
          { class: 'ps-report-detail__heading' },
          h(
            'div',
            { class: 'ps-report-detail__title-row' },
            h('h2', { class: 'ps-report-detail__title', text: `Cuenta de ${user.nombre}` }),
            createAdminStatus(user.estado),
            user.es_admin ? createBadge({ label: 'Administrador', variant: 'primary' }) : null,
          ),
          h('p', {
            class: 'ps-report-detail__subtitle',
            text: `${user.correo} · Alta ${user.alta}`,
          }),
        ),
      ),
      h(
        'div',
        { class: 'ps-report-detail__columns' },
        h(
          'div',
          { class: 'ps-report-detail__main' },
          renderPetsCard(user),
          renderActivityCard(user),
        ),
        h(
          'div',
          { class: 'ps-report-detail__side' },
          renderNextStepCard(user),
          renderMetadataCard(user),
        ),
      ),
    );
  }

  function renderPetsCard(user) {
    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Mascotas' }),
      h(
        'ul',
        { class: 'ps-admin-panel__list' },
        user.mascotas.map((pet) =>
          h(
            'li',
            {},
            h(
              'div',
              { class: 'ps-admin-row' },
              createAvatar({ name: pet.nombre, size: 'sm' }),
              h(
                'span',
                { class: 'ps-admin-row__main' },
                h('span', { class: 'ps-admin-row__title', text: pet.nombre }),
                h('span', { class: 'ps-admin-row__meta', text: pet.handle }),
              ),
            ),
          ),
        ),
      ),
    );
  }

  function renderActivityCard(user) {
    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Actividad reciente' }),
      h(
        'ol',
        { class: 'ps-report-timeline' },
        (user.actividad || []).map((item, index) =>
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

  function renderNextStepCard(user) {
    let contenido;

    if (user.eliminada) {
      contenido = h('p', {
        class: 'ps-report-detail__decided',
        text: 'Esta cuenta fue eliminada y queda en solo lectura.',
      });
    } else if (user.es_admin) {
      contenido = h('p', {
        class: 'ps-report-detail__decided',
        text: 'No puedes suspender una cuenta administradora.',
      });
    } else if (user.activo) {
      contenido = createButton({
        label: 'Suspender cuenta',
        variant: 'danger',
        fullWidth: true,
        onClick: () =>
          openModerationDialog({
            titulo: `Suspender la cuenta de ${user.nombre}`,
            cuerpo: 'La cuenta no podrá iniciar sesión.',
            advertencia: 'La suspensión es indefinida y la cuenta no podrá iniciar sesión.',
            confirmLabel: 'Suspender cuenta',
            variante: 'danger',
            onConfirm: (motivo) => apply(() => suspendAdminUser(id, motivo)),
          }),
      }).element;
    } else {
      contenido = createButton({
        label: 'Reactivar cuenta',
        variant: 'primary',
        fullWidth: true,
        onClick: () =>
          apply(() => reactivateAdminUser(id)).then(() =>
            showToast('Cuenta reactivada.', { variant: 'success' }),
          ),
      }).element;
    }

    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Siguiente paso' }),
      h('div', { class: 'ps-report-detail__actions' }, contenido),
    );
  }

  function renderMetadataCard(user) {
    const rows = [
      { label: 'ID', value: user.id },
      { label: 'Correo', value: user.correo },
      { label: 'Alta', value: user.alta },
      { label: 'Estado', value: user.estado },
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
