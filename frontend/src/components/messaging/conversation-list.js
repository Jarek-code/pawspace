import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

export function createConversationRow({ conversation, active = false, onOpen = null } = {}) {
  const { mascota, ultimoMensaje, tiempo, noLeidos, silenciada } = conversation;
  const unread = Number(noLeidos || 0) > 0;

  return h(
    'li',
    { class: 'ps-conversation-list__item' },
    h(
      'button',
      {
        class: ['ps-conversation', active ? 'is-active' : '', unread ? 'is-unread' : '']
          .filter(Boolean)
          .join(' '),
        type: 'button',
        onClick: () => onOpen?.(conversation),
      },
      createAvatar({ name: mascota.nombre, src: mascota.avatar, size: 'md' }),
      h(
        'span',
        { class: 'ps-conversation__content' },
        h(
          'span',
          { class: 'ps-conversation__head' },
          h('span', { class: 'ps-conversation__name', text: mascota.nombre }),
          h('span', { class: 'ps-conversation__time', text: tiempo || '' }),
        ),
        h(
          'span',
          { class: 'ps-conversation__preview' },
          h('span', { class: 'ps-conversation__message', text: ultimoMensaje || 'Sin mensajes' }),
          silenciada
            ? h(
                'span',
                { class: 'ps-conversation__muted' },
                createIcon('bell-off', { size: 14 }),
                h('span', { class: 'ps-sr-only', text: 'Avisos silenciados' }),
              )
            : null,
          unread
            ? h('span', {
                class: 'ps-conversation__unread',
                attrs: { 'aria-label': `${noLeidos} sin leer` },
                text: String(noLeidos),
              })
            : null,
        ),
      ),
    ),
  );
}

export function createRequestRow({ solicitud, onAccept = null, onIgnore = null } = {}) {
  const { mascota, tiempo } = solicitud;

  const accept = createButton({
    label: 'Aceptar',
    size: 'sm',
    onClick: async () => {
      accept.setLoading(true);

      try {
        await onAccept?.(solicitud);
      } catch {
        accept.setLoading(false);
      }
    },
  });

  const ignore = createButton({
    label: 'Ignorar',
    variant: 'secondary',
    size: 'sm',
    onClick: async () => {
      ignore.setLoading(true);

      try {
        await onIgnore?.(solicitud);
      } catch {
        ignore.setLoading(false);
      }
    },
  });

  return h(
    'li',
    { class: 'ps-conversation-list__item ps-request' },
    createAvatar({ name: mascota.nombre, src: mascota.avatar, size: 'md' }),
    h(
      'span',
      { class: 'ps-request__content' },
      h(
        'span',
        { class: 'ps-request__head' },
        h('span', { class: 'ps-request__name', text: mascota.nombre }),
        h('span', { class: 'ps-request__time', text: tiempo || '' }),
      ),
      h('span', { class: 'ps-request__handle', text: mascota.handle }),
      h('span', { class: 'ps-request__actions' }, accept.element, ignore.element),
    ),
  );
}

export function createConversationList({
  conversations = [],
  solicitudes = [],
  mode = 'todos',
  activeHandle = '',
  searching = false,
  emptyAction = null,
  onOpen = null,
  onAccept = null,
  onIgnore = null,
} = {}) {
  if (mode === 'solicitudes') {
    if (!solicitudes.length) {
      return createEmptyState({
        icon: 'users',
        title: 'Sin solicitudes',
        body: 'Cuando una mascota quiera conversar, aparecerá aquí.',
      });
    }

    return h(
      'ul',
      { class: 'ps-conversation-list', attrs: { 'aria-label': 'Solicitudes de conversación' } },
      solicitudes.map((solicitud) => createRequestRow({ solicitud, onAccept, onIgnore })),
    );
  }

  if (!conversations.length) {
    return createEmptyState({
      icon: searching ? 'search' : 'message-circle',
      title: searching ? 'Sin resultados' : 'Sin conversaciones',
      body: searching
        ? 'Prueba con otro nombre o con el contenido del último mensaje.'
        : 'Empieza a conversar desde el perfil de una mascota.',
      action: searching ? null : emptyAction,
    });
  }

  return h(
    'ul',
    { class: 'ps-conversation-list', attrs: { 'aria-label': 'Conversaciones' } },
    conversations.map((conversation) =>
      createConversationRow({
        conversation,
        active: conversation.mascota.handle.toLowerCase() === String(activeHandle).toLowerCase(),
        onOpen,
      }),
    ),
  );
}

export function createSegmentNav({ active = 'notificaciones' } = {}) {
  const item = (value, label, href) =>
    h(
      'a',
      {
        class: `ps-segment__item${active === value ? ' is-active' : ''}`,
        href,
        attrs: { 'aria-current': active === value ? 'page' : null },
      },
      label,
    );

  return h(
    'nav',
    { class: 'ps-segment', attrs: { 'aria-label': 'Avisos y mensajes' } },
    item('notificaciones', 'Notificaciones', '/notificaciones'),
    item('mensajes', 'Mensajes', '/mensajes'),
  );
}
