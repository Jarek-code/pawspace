import { createAppShell } from '@/components/layout/app-shell.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createSelectField, createTextareaField } from '@/components/primitives/field.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createModal } from '@/components/primitives/modal.js';
import { createSkeleton } from '@/components/primitives/skeleton.js';
import { showToast } from '@/components/primitives/toast.js';
import { createChatDetails } from '@/components/messaging/chat-details.js';
import { createChatThread } from '@/components/messaging/chat-thread.js';
import { createMessageComposer } from '@/components/messaging/message-composer.js';
import { h } from '@/lib/dom.js';
import { currentSession, logout } from '@/services/auth.js';
import { getCurrentPet, listPets } from '@/services/pets.js';
import {
  loadConversation,
  reportConversation,
  sendMessage,
  toggleBlock,
  toggleSilence,
} from '@/services/messages.js';
import { normalizePet, accountFromEmail } from '@/features/feed/feed-view.js';

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'ACOSO', label: 'Acoso' },
  { value: 'CONTENIDO_INAPROPIADO', label: 'Contenido inapropiado' },
  { value: 'VIOLENCIA', label: 'Violencia' },
  { value: 'SUPLANTACION', label: 'Suplantación' },
  { value: 'DERECHOS_AUTOR', label: 'Derechos de autor' },
  { value: 'OTRO', label: 'Otro motivo' },
];

/**
 * D27 / M20 — Conversación.
 * Hilo con separadores de día, envío optimista con reintento, adjuntos y
 * acciones de moderación. En móvil ocupa la pantalla y oculta la bottom nav.
 */
export function createPage({ router, params } = {}) {
  const handle = String(params?.handle || '').replace(/^@/, '');
  const pet = normalizePet(getCurrentPet() || listPets(currentSession().email)[0] || null);
  const account = accountFromEmail(currentSession().email);
  const draftKey = `pawspace.draft.${handle}`;

  let data = null;
  let threadHost = null;
  let composer = null;

  const shell = createAppShell({
    activePath: '/mensajes',
    title: 'Mensajes',
    subtitle: 'Conversación',
    pet,
    account,
    notificationCount: 3,
    onCompose: () => router.navigate('/publicar'),
    onSearch: (value) =>
      router.navigate(value ? `/buscar?q=${encodeURIComponent(value)}` : '/buscar'),
    onLogout: () => {
      logout();
      router.navigate('/', { replace: true });
    },
    hideBottomNav: true,
    className: 'ps-app-shell--chat',
    rail: h('span', { class: 'ps-sr-only', text: 'Cargando conversación…' }),
    children: chatLoading(),
  });

  const content = shell.querySelector('.ps-shell__content');
  const rail = shell.querySelector('.ps-rail');
  const topbarTitle = shell.querySelector('.ps-topbar__title');
  const topbarSubtitle = shell.querySelector('.ps-topbar__subtitle');

  loadConversation(handle)
    .then((payload) => {
      data = payload;
      render();
    })
    .catch((error) => {
      rail.replaceChildren();
      content.replaceChildren(
        createEmptyState({
          icon: 'message-circle',
          title: error?.status === 409 ? 'Solicitud pendiente' : 'Conversación no disponible',
          body:
            error?.status === 409
              ? 'Acepta la solicitud desde tu bandeja de mensajes.'
              : 'No encontramos esta conversación o ya no está disponible.',
          action: createButton({
            label: 'Volver a mensajes',
            variant: 'secondary',
            onClick: () => router.navigate('/mensajes', { replace: true }),
          }).element,
        }),
      );
    });

  function render() {
    const conversation = data.conversacion;
    const mascota = conversation.mascota;

    topbarTitle.textContent = `Conversación con ${mascota.nombre}`;
    topbarSubtitle.textContent = 'Mensajes';

    rail.replaceChildren(
      createChatDetails({
        conversation,
        onOpenProfile: () => router.navigate(`/mascota/${mascota.handle.replace(/^@/, '')}`),
        onSilence: handleSilence,
        onBlock: handleBlock,
        onReport: openReport,
      }),
    );

    const head = createHead(conversation);
    threadHost = h('div', { class: 'ps-chat__thread' });

    if (conversation.bloqueada) {
      content.replaceChildren(
        h(
          'div',
          { class: 'ps-chat' },
          head,
          h(
            'section',
            { class: 'ps-chat-blocked', attrs: { role: 'status' } },
            h(
              'span',
              { class: 'ps-chat-blocked__icon', 'aria-hidden': 'true' },
              createIcon('ban', { size: 32 }),
            ),
            h('h2', { class: 'ps-chat-blocked__title', text: 'Conversación bloqueada' }),
            h('p', {
              class: 'ps-chat-blocked__body',
              text: `Ya no puedes enviar mensajes a ${mascota.nombre}. Su perfil y su conversación quedan ocultos en la bandeja.`,
            }),
            createButton({
              label: `Desbloquear a ${mascota.nombre}`,
              variant: 'secondary',
              onClick: () => changeBlock(false),
            }).element,
          ),
        ),
      );
      return;
    }

    composer = createMessageComposer({
      recipientName: mascota.nombre,
      initialValue: readDraft(),
      onSubmit: deliver,
      onDraft: writeDraft,
    });

    content.replaceChildren(
      h(
        'div',
        { class: 'ps-chat' },
        head,
        threadHost,
        h('div', { class: 'ps-chat__composer' }, composer.element),
      ),
    );

    paintThread();
    composer.focus();
  }

  function createHead(conversation) {
    const mascota = conversation.mascota;

    return h(
      'header',
      { class: 'ps-chat-head' },
      h(
        'a',
        {
          class: 'ps-chat-head__back',
          href: '/mensajes',
          attrs: { 'aria-label': 'Volver a mensajes' },
        },
        createIcon('arrow-left', { size: 22 }),
      ),
      createAvatar({ name: mascota.nombre, src: mascota.avatar, size: 'md' }),
      h(
        'div',
        { class: 'ps-chat-head__info' },
        h('h1', { class: 'ps-chat-head__name', text: mascota.nombre }),
        h(
          'p',
          { class: 'ps-chat-head__status' },
          h('span', {
            class: `ps-status-dot${conversation.enLinea ? ' is-online' : ''}`,
            attrs: { 'aria-hidden': 'true' },
          }),
          conversation.enLinea ? 'En línea' : 'Última actividad reciente',
        ),
      ),
      h(
        'div',
        { class: 'ps-chat-head__actions' },
        headAction('phone', `Llamar a ${mascota.nombre}`),
        headAction('video', `Videollamar a ${mascota.nombre}`),
        h(
          'button',
          {
            class: 'ps-chat-head__icon ps-chat-head__more',
            type: 'button',
            attrs: { 'aria-label': 'Ver detalles de la conversación' },
            onClick: openDetails,
          },
          createIcon('more-vertical', { size: 20 }),
        ),
      ),
    );
  }

  function headAction(icon, label) {
    return h(
      'button',
      {
        class: 'ps-chat-head__icon',
        type: 'button',
        title: 'Próximamente',
        attrs: { 'aria-label': label },
        onClick: () => showToast('Las llamadas todavía no están disponibles en esta demostración.'),
      },
      createIcon(icon, { size: 20 }),
    );
  }

  function paintThread() {
    const thread = createChatThread({
      mensajes: data.mensajes,
      onRetry: retryMessage,
    });

    threadHost.replaceChildren(thread.element);
    thread.scrollToEnd();
  }

  async function deliver(payload) {
    composer.setLoading(true);

    try {
      const result = await sendMessage(handle, payload);

      if (!data.mensajes.some((item) => item.id === result.mensaje.id)) {
        data.mensajes.push(result.mensaje);
      }

      data.conversacion.ultimoMensaje = result.conversacion.ultimoMensaje;
      composer.reset();
      composer.setLoading(false);
      paintThread();
      composer.focus();
    } catch (error) {
      const hora = new Intl.DateTimeFormat('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date());

      data.mensajes.push({
        id: `msg_error_${Date.now()}`,
        propia: true,
        texto: payload.texto,
        adjunto: payload.adjunto,
        hora,
        fecha: 'Hoy',
        estado: 'error',
      });

      composer.reset();
      composer.setLoading(false);
      paintThread();
      showToast(error?.message || 'No pudimos enviar el mensaje.', { variant: 'error' });
    }
  }

  async function retryMessage(mensaje) {
    data.mensajes = data.mensajes.filter((item) => item.id !== mensaje.id);
    paintThread();
    await deliver({ texto: mensaje.texto, adjunto: mensaje.adjunto || null });
  }

  function readDraft() {
    try {
      return localStorage.getItem(draftKey) || '';
    } catch {
      return '';
    }
  }

  function writeDraft(value) {
    try {
      if (value) {
        localStorage.setItem(draftKey, value);
      } else {
        localStorage.removeItem(draftKey);
      }
    } catch {
      // Sin almacenamiento, el borrador dura lo que la pantalla.
    }
  }

  function handleSilence() {
    toggleSilence(handle)
      .then((result) => {
        data.conversacion.silenciada = result.silenciada;
        showToast(
          result.silenciada
            ? 'Avisos de esta conversación silenciados.'
            : 'Avisos de esta conversación reactivados.',
        );
        render();
      })
      .catch((error) =>
        showToast(error?.message || 'No pudimos actualizar los avisos.', { variant: 'error' }),
      );
  }

  function handleBlock() {
    if (data.conversacion.bloqueada) {
      changeBlock(false);
      return;
    }

    const modal = createModal({
      title: `Bloquear a ${data.conversacion.mascota.nombre}`,
      description:
        'Ya no verás sus mensajes ni su perfil. Puedes desbloquear la conversación más tarde desde este mismo hilo.',
      onClose: () => modal.element.remove(),
    });

    const confirm = createButton({
      label: 'Bloquear',
      variant: 'danger',
      onClick: async () => {
        confirm.setLoading(true);

        try {
          const result = await toggleBlock(handle);
          data.conversacion.bloqueada = result.bloqueada;
          modal.close();
          showToast(`Bloqueaste a ${data.conversacion.mascota.nombre}.`);
          render();
        } catch (error) {
          confirm.setLoading(false);
          showToast(error?.message || 'No pudimos bloquear la conversación.', {
            variant: 'error',
          });
        }
      },
    });

    modal.body.append(
      h(
        'div',
        { class: 'ps-modal__actions' },
        createButton({
          label: 'Cancelar',
          variant: 'secondary',
          onClick: () => modal.close(),
        }).element,
        confirm.element,
      ),
    );

    shell.append(modal.element);
    modal.open();
  }

  function changeBlock() {
    toggleBlock(handle)
      .then((result) => {
        data.conversacion.bloqueada = result.bloqueada;
        showToast(
          result.bloqueada
            ? `Bloqueaste a ${data.conversacion.mascota.nombre}.`
            : `Desbloqueaste a ${data.conversacion.mascota.nombre}.`,
        );
        render();
      })
      .catch((error) =>
        showToast(error?.message || 'No pudimos actualizar el bloqueo.', { variant: 'error' }),
      );
  }

  function openReport() {
    const reason = createSelectField({
      label: 'Motivo',
      value: 'OTRO',
      options: REPORT_REASONS,
    });
    const detail = createTextareaField({
      label: 'Cuéntanos qué pasó',
      placeholder: 'Incluye solo la información necesaria.',
      rows: 4,
      maxlength: 500,
      optional: true,
    });

    const modal = createModal({
      title: `Reportar a ${data.conversacion.mascota.nombre}`,
      description:
        'El reporte no elimina la conversación. Nuestro equipo revisará el contenido y tomará una decisión.',
      onClose: () => modal.element.remove(),
    });

    const submit = createButton({
      label: 'Enviar reporte',
      variant: 'danger',
      onClick: async () => {
        submit.setLoading(true);

        try {
          await reportConversation(handle, {
            categoria: reason.getValue(),
            detalle: detail.getValue().trim(),
          });
          data.conversacion.reportada = true;
          modal.close();
          showToast('Reporte enviado. Revisaremos la conversación.');
          render();
        } catch (error) {
          submit.setLoading(false);
          showToast(error?.message || 'No pudimos enviar el reporte.', { variant: 'error' });
        }
      },
    });

    modal.body.append(
      reason.element,
      detail.element,
      h(
        'div',
        { class: 'ps-modal__actions' },
        createButton({
          label: 'Cancelar',
          variant: 'secondary',
          onClick: () => modal.close(),
        }).element,
        submit.element,
      ),
    );

    shell.append(modal.element);
    modal.open();
  }

  function openDetails() {
    const modal = createModal({
      title: 'Detalles de la conversación',
      size: 'md',
      variant: 'sheet',
      onClose: () => modal.element.remove(),
    });

    modal.body.append(
      createChatDetails({
        conversation: data.conversacion,
        onOpenProfile: () => {
          const mascota = data.conversacion.mascota;
          modal.close();
          router.navigate(`/mascota/${mascota.handle.replace(/^@/, '')}`);
        },
        onSilence: () => {
          modal.close();
          handleSilence();
        },
        onBlock: () => {
          modal.close();
          handleBlock();
        },
        onReport: () => {
          modal.close();
          openReport();
        },
      }),
    );

    shell.append(modal.element);
    modal.open();
  }

  return shell;
}

function chatLoading() {
  return h(
    'div',
    { class: 'ps-chat', attrs: { 'aria-busy': 'true' } },
    h(
      'div',
      { class: 'ps-chat-head' },
      createSkeleton({ width: '48px', height: '48px', radius: 'var(--ps-radius-full)' }),
      h(
        'div',
        { class: 'ps-chat-head__info' },
        createSkeleton({ width: '160px', height: '20px' }),
        createSkeleton({ width: '100px', height: '14px' }),
      ),
    ),
    h(
      'div',
      { class: 'ps-chat__thread' },
      ...Array.from({ length: 4 }, (_, index) =>
        createSkeleton({
          width: index % 2 ? '60%' : '48%',
          height: '58px',
          radius: 'var(--ps-radius-lg)',
          className: index % 2 ? 'ps-chat-skeleton--out' : '',
        }),
      ),
    ),
  );
}
