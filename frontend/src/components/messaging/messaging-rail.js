import { createActivePetCard } from '@/components/feed/rail.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { h } from '@/lib/dom.js';
import { createRequestRow } from './conversation-list.js';

export { createActivePetCard };

export function createNotificationSummary({ resumen } = {}) {
  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Resumen' }),
    h(
      'div',
      { class: 'ps-notification-summary' },
      summaryItem(resumen?.sinLeer, 'Sin leer'),
      summaryItem(resumen?.hoy, 'Hoy'),
      summaryItem(resumen?.semana, 'Semana'),
    ),
  );
}

function summaryItem(value, label) {
  return h(
    'div',
    { class: 'ps-notification-summary__item' },
    h('span', { class: 'ps-notification-summary__value', text: String(value ?? 0) }),
    h('span', { class: 'ps-notification-summary__label', text: label }),
  );
}

export function createPetSuggestions({
  title = 'Mascotas sugeridas',
  sugerencias = [],
  actionLabel = 'Seguir',
  onAction = null,
} = {}) {
  if (!sugerencias.length) {
    return null;
  }

  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: title }),
    h(
      'ul',
      { class: 'ps-rail__list' },
      sugerencias.map((pet) =>
        h(
          'li',
          { class: 'ps-rail__row' },
          createAvatar({ name: pet.nombre, size: 'sm' }),
          h(
            'div',
            { class: 'ps-rail__row-info' },
            h('span', { class: 'ps-rail__row-name', text: pet.nombre }),
            h('span', { class: 'ps-rail__row-handle', text: pet.handle }),
          ),
          createButton({
            label: actionLabel,
            size: 'sm',
            variant: 'secondary',
            onClick: () => onAction?.(pet),
          }).element,
        ),
      ),
    ),
  );
}

export function createConversationPreview({ conversation, onOpen = null } = {}) {
  if (!conversation) {
    return null;
  }

  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Conversación' }),
    h(
      'div',
      { class: 'ps-chat-preview' },
      h(
        'div',
        { class: 'ps-chat-preview__head' },
        createAvatar({ name: conversation.mascota.nombre, size: 'md' }),
        h(
          'div',
          { class: 'ps-chat-preview__info' },
          h('span', { class: 'ps-chat-preview__name', text: conversation.mascota.nombre }),
          h(
            'span',
            { class: 'ps-chat-preview__status' },
            h('span', {
              class: `ps-status-dot${conversation.enLinea ? ' is-online' : ''}`,
              attrs: { 'aria-hidden': 'true' },
            }),
            conversation.enLinea ? 'En línea' : 'Reciente',
          ),
        ),
      ),
      h('p', {
        class: 'ps-chat-preview__message',
        text: `“${conversation.ultimoMensaje || 'Sin mensajes'}”`,
      }),
      createButton({
        label: 'Abrir conversación',
        fullWidth: true,
        onClick: () => onOpen?.(conversation),
      }).element,
    ),
  );
}

export function createRequestsRailCard({
  solicitudes = [],
  onAccept = null,
  onIgnore = null,
} = {}) {
  if (!solicitudes.length) {
    return null;
  }

  return h(
    'section',
    { class: 'ps-rail__card' },
    h(
      'div',
      { class: 'ps-rail__title-row' },
      h('h2', { class: 'ps-rail__title', text: 'Solicitudes' }),
      h('span', {
        class: 'ps-rail__title-note',
        text: `${solicitudes.length} ${solicitudes.length === 1 ? 'pendiente' : 'pendientes'}`,
      }),
    ),
    h(
      'ul',
      { class: 'ps-conversation-list ps-conversation-list--requests' },
      solicitudes.map((solicitud) => createRequestRow({ solicitud, onAccept, onIgnore })),
    ),
  );
}
