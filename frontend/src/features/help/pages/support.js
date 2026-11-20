import { createSupportForm } from '@/components/help/support-form.js';
import { createSupportRail } from '@/components/help/help-rail.js';
import { createSupportTicketList } from '@/components/help/support-ticket-list.js';
import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';
import { createSupportTicket, loadSupport, reopenSupportTicket } from '@/services/help.js';
import { createHelpError, mountHelpShell, openStatusHistory } from '@/features/help/help-shell.js';

/**
 * D33 / M26 — Contactar con soporte.
 * Formulario con borrador local, confirmación al enviar y solicitudes con
 * detalle expandible. La consulta `?solicitud=` abre una solicitud concreta.
 */
export function createPage({ router, query } = {}) {
  const requested = String(query?.get('solicitud') || '');
  const shell = mountHelpShell({
    router,
    title: 'Soporte',
    mobileTitle: 'Soporte',
    subtitle: 'Cuéntanos qué ocurrió',
    backTo: '/ayuda',
  });

  const draftKey = `ps:help:draft:${shell.account?.email || 'anon'}`;
  let draft = readDraft(draftKey);
  let data = null;
  let submitted = null;
  let ticketList = null;

  loadSupport()
    .then((payload) => {
      data = payload;
      paint();

      window.setTimeout(() => {
        if (requested) {
          scrollToTicket(requested);
          return;
        }

        if (window.location.hash === '#solicitudes') {
          scrollToTickets();
        }
      }, 0);
    })
    .catch(() =>
      shell.content.replaceChildren(
        createHelpError({
          title: 'No pudimos cargar soporte',
          body: 'Revisa tu conexión e intenta de nuevo.',
          onRetry: () => router.navigate('/soporte', { replace: true }),
        }),
      ),
    );

  function paintRail() {
    shell.rail.replaceChildren(
      ...createSupportRail({
        pet: shell.pet,
        data,
        onChangePet: () => router.navigate('/elegir-mascota'),
        onOpenAll: () => scrollToTickets(),
        onStatusHistory: () => openStatusHistory(data.status),
      }),
    );
  }

  function paint() {
    paintRail();

    if (submitted) {
      shell.content.replaceChildren(
        createSuccess(submitted, { router, onSeeTickets: showTickets }),
      );
      window.scrollTo(0, 0);
      return;
    }

    const form = createSupportForm({
      topics: data.topics,
      email: shell.account?.email || '',
      draft,
      onSaveDraft: (value) => {
        draft = value;
        writeDraft(draftKey, value);
      },
      onSubmit: (value) =>
        createSupportTicket(value).then((result) => {
          removeDraft(draftKey);
          draft = null;
          submitted = result;
          data = { ...data, tickets: [result.ticket, ...data.tickets] };
          paint();
        }),
    });

    ticketList = createSupportTicketList({
      tickets: data.tickets,
      expandedId: requested,
      showFilters: true,
      onContact: () => {
        form.focus();
        shell.content.querySelector('.ps-support-card')?.scrollIntoView({ block: 'start' });
      },
      onReopen: async (id) => {
        const result = await reopenSupportTicket(id);
        data = { ...data, tickets: result.tickets };
        paintRail();
        return result;
      },
    });

    shell.content.replaceChildren(
      h(
        'div',
        { class: 'ps-support-page' },
        h(
          'section',
          { class: 'ps-support-card' },
          h(
            'header',
            { class: 'ps-support-card__head' },
            h('h2', { class: 'ps-help-section-title', text: 'Contactar con soporte' }),
            h('p', {
              class: 'ps-support-card__body',
              text: 'Respondemos en menos de 48 horas laborables. Incluye capturas si ayudan a explicar el problema.',
            }),
          ),
          form.element,
        ),
        h('div', { class: 'ps-support-tickets-host', id: 'solicitudes' }, ticketList.element),
      ),
    );
  }

  function showTickets() {
    submitted = null;
    paint();
    window.setTimeout(() => scrollToTickets(), 0);
  }

  function scrollToTickets() {
    const target = shell.content.querySelector('#solicitudes');

    if (target) {
      target.scrollIntoView({ block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  }

  function scrollToTicket(id) {
    const target = shell.content.querySelector(`#solicitud-${CSS.escape(String(id))}`);

    if (target) {
      target.scrollIntoView({ block: 'start' });
    }
  }

  return shell.shell;
}

function createSuccess(result, { router, onSeeTickets }) {
  return h(
    'section',
    { class: 'ps-support-success' },
    h(
      'span',
      { class: 'ps-support-success__icon', 'aria-hidden': 'true' },
      createIcon('circle-check', { size: 40 }),
    ),
    h('h2', { class: 'ps-help-section-title', text: 'Solicitud enviada' }),
    h(
      'p',
      { class: 'ps-support-success__body' },
      'Tu número de solicitud es ',
      h('strong', { text: `#${result.ticket.id}` }),
      '.',
    ),
    h('p', {
      class: 'ps-support-success__body',
      text: `Te escribiremos a ${result.correo} en menos de ${result.plazo}.`,
    }),
    h(
      'div',
      { class: 'ps-support-success__actions' },
      createButton({ label: 'Ver mis solicitudes', onClick: onSeeTickets }).element,
      createButton({
        label: 'Volver al centro de ayuda',
        variant: 'secondary',
        onClick: () => router.navigate('/ayuda'),
      }).element,
    ),
  );
}

function readDraft(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDraft(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento disponible: el formulario sigue funcionando en memoria.
  }
}

function removeDraft(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Sin almacenamiento disponible.
  }
}
