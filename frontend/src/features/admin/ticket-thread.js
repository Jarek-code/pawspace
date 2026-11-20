import { createAdminStatus } from '@/components/admin/admin-status.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createSelectField, createTextareaField } from '@/components/primitives/field.js';
import { showToast } from '@/components/primitives/toast.js';
import { h } from '@/lib/dom.js';
import { loadAdminTicket, respondAdminTicket, setAdminTicketState } from '@/services/admin.js';

const ESTADOS = [
  { value: 'ABIERTA', label: 'Abierta' },
  { value: 'EN_REVISION', label: 'En revisión' },
  { value: 'ESPERANDO_USUARIO', label: 'Esperando a la persona' },
  { value: 'RESUELTA', label: 'Resuelta' },
  { value: 'CERRADA', label: 'Cerrada' },
];

/**
 * CMP-103 — TicketThread (D41 / M31).
 * Contacto, hilo completo y compositor de respuesta. Todo mensaje del equipo es
 * visible para la persona; no hay notas internas.
 */
export function createTicketThread({ router, id, refresh }) {
  const root = h('div', { class: 'ps-report-detail' });

  function load() {
    root.replaceChildren(
      h('div', {
        class: 'ps-report-detail__loading',
        attrs: { role: 'status', 'aria-live': 'polite' },
      }),
    );

    loadAdminTicket(id)
      .then((ticket) => {
        root.replaceChildren(render(ticket));
      })
      .catch(() => {
        root.replaceChildren(
          createEmptyState({
            icon: 'alert',
            title: 'No encontramos esta solicitud',
            body: 'Pudo haberse resuelto o retirado.',
            action: createButton({
              label: 'Volver a soporte',
              variant: 'secondary',
              onClick: () => router.navigate('/admin/soporte'),
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

  function render(ticket) {
    return h(
      'div',
      { class: 'ps-report-detail__inner' },
      h(
        'div',
        { class: 'ps-report-detail__head' },
        h('a', {
          class: 'ps-report-detail__back',
          href: '/admin/soporte',
          text: 'Volver a soporte',
        }),
        h(
          'div',
          { class: 'ps-report-detail__heading' },
          h(
            'div',
            { class: 'ps-report-detail__title-row' },
            h('h2', { class: 'ps-report-detail__title', text: `Solicitud #${ticket.id}` }),
            createAdminStatus(ticket.estado),
          ),
          h('p', {
            class: 'ps-report-detail__subtitle',
            text: `${ticket.contacto.persona} · ${ticket.contacto.correo} · ${ticket.temaLabel || ticket.tema}`,
          }),
        ),
      ),
      h(
        'div',
        { class: 'ps-report-detail__columns' },
        h('div', { class: 'ps-report-detail__main' }, renderThreadCard(ticket), renderComposer()),
        h(
          'div',
          { class: 'ps-report-detail__side' },
          renderContactCard(ticket),
          renderStateCard(ticket),
        ),
      ),
    );
  }

  function renderThreadCard(ticket) {
    const bubbles = [
      h(
        'div',
        { class: 'ps-ticket-bubble ps-ticket-bubble--in' },
        h('p', { class: 'ps-ticket-bubble__text', text: ticket.detalle }),
      ),
      ...ticket.hilo.map((entry) =>
        h(
          'div',
          {
            class: `ps-ticket-bubble ${entry.propio ? 'ps-ticket-bubble--out' : 'ps-ticket-bubble--in'}`,
          },
          h('p', { class: 'ps-ticket-bubble__text', text: entry.texto }),
          h('span', { class: 'ps-ticket-bubble__time', text: entry.fecha }),
        ),
      ),
    ];

    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Hilo de la conversación' }),
      h('div', { class: 'ps-ticket-thread' }, bubbles),
    );
  }

  function renderComposer() {
    const composer = createTextareaField({
      label: 'Respuesta',
      placeholder: 'Escribe una respuesta…',
      rows: 3,
      maxlength: 500,
    });

    const send = createButton({
      label: 'Responder',
      variant: 'primary',
      onClick: () =>
        apply(() => respondAdminTicket(id, composer.getValue())).then(() => {
          showToast('Respuesta enviada.', { variant: 'success' });
        }),
    });

    composer.input.addEventListener('input', () => {
      send.element.disabled = composer.getValue().trim().length === 0;
    });
    send.element.disabled = true;

    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Responder' }),
      composer.element,
      h('div', { class: 'ps-moderation__actions' }, send.element),
    );
  }

  function renderContactCard(ticket) {
    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Contacto' }),
      h(
        'dl',
        { class: 'ps-report-metadata' },
        h(
          'div',
          { class: 'ps-report-metadata__row' },
          h('dt', { class: 'ps-report-metadata__label', text: 'Persona' }),
          h('dd', { class: 'ps-report-metadata__value', text: ticket.contacto.persona }),
        ),
        h(
          'div',
          { class: 'ps-report-metadata__row' },
          h('dt', { class: 'ps-report-metadata__label', text: 'Correo' }),
          h('dd', { class: 'ps-report-metadata__value', text: ticket.contacto.correo }),
        ),
      ),
    );
  }

  function renderStateCard(ticket) {
    const select = createSelectField({
      label: 'Estado',
      placeholder: '',
      options: ESTADOS,
    });
    select.setValue(ticket.estado);

    const save = createButton({
      label: 'Guardar estado',
      variant: 'secondary',
      fullWidth: true,
      onClick: () =>
        apply(() => setAdminTicketState(id, select.getValue())).then(() =>
          showToast('Estado actualizado.', { variant: 'success' }),
        ),
    });

    return h(
      'section',
      { class: 'ps-admin-panel ps-report-detail__card' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Estado de la solicitud' }),
      select.element,
      h('div', { class: 'ps-report-detail__actions' }, save.element),
    );
  }
}
