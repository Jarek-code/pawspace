import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { h } from '@/lib/dom.js';

/**
 * CMP-51 — NotificationItem.
 * Fila accionable de 80 px (76 px en móvil) con avatar o marca del sistema,
 * texto, tiempo y punto de no leído. La acción Seguir vive fuera del enlace
 * para no anidar controles interactivos.
 */
export function createNotificationItem({ notification, onOpen = null, onFollow = null } = {}) {
  const { actor, titulo, accion, cuerpo, tiempo, leida, destino } = notification;

  const avatar = createAvatar({
    name: actor?.nombre || 'PawSpace',
    src: actor?.avatar || null,
    size: 'md',
  });

  const title = actor
    ? h(
        'span',
        { class: 'ps-notification__title' },
        h('strong', { text: actor.nombre }),
        ` ${accion}`,
      )
    : h('span', { class: 'ps-notification__title', text: titulo });

  const content = h(
    'span',
    { class: 'ps-notification__content' },
    h('span', { class: 'ps-notification__avatar' }, avatar),
    h(
      'span',
      { class: 'ps-notification__text' },
      title,
      h('span', { class: 'ps-notification__body', text: cuerpo || '' }),
    ),
    h(
      'span',
      { class: 'ps-notification__meta' },
      h('span', { class: 'ps-notification__time', text: tiempo || '' }),
      leida ? null : h('span', { class: 'ps-notification__dot', attrs: { 'aria-hidden': 'true' } }),
      leida ? null : h('span', { class: 'ps-sr-only', text: 'Sin leer' }),
    ),
  );

  let main;

  if (destino) {
    main = h(
      'a',
      {
        class: 'ps-notification__main',
        href: destino,
        onClick: () => onOpen?.(notification),
      },
      content,
    );
  } else {
    main = h(
      'button',
      {
        class: 'ps-notification__main',
        type: 'button',
        onClick: () => onOpen?.(notification),
      },
      content,
    );
  }

  let follow = null;

  if (notification.accionSeguir) {
    const button = createButton({
      label: 'Seguir',
      variant: 'secondary',
      size: 'sm',
      onClick: async () => {
        if (!onFollow) {
          return;
        }

        button.setLoading(true);

        try {
          await onFollow(notification);
          button.setLabel('Siguiendo');
          button.setDisabled(true);
        } catch {
          // La página muestra el aviso de error y conserva el botón.
        } finally {
          button.setLoading(false);
        }
      },
    });

    follow = h('div', { class: 'ps-notification__action' }, button.element);
  }

  return h(
    'article',
    {
      class: ['ps-notification', leida ? '' : 'is-unread', follow ? 'has-action' : '']
        .filter(Boolean)
        .join(' '),
    },
    main,
    follow,
  );
}
