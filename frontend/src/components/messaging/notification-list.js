import { createEmptyState } from '@/components/primitives/empty-state.js';
import { h } from '@/lib/dom.js';
import { createNotificationItem } from './notification-item.js';

const GROUPS = ['Hoy', 'Ayer', 'Anteriores'];

const EMPTY_COPY = {
  todas: {
    title: 'Sin notificaciones',
    body: 'Cuando alguien interactúe con Luna, lo verás aquí.',
  },
  unread: {
    title: 'Todo al día',
    body: 'No tienes notificaciones sin leer.',
    icon: 'check-check',
  },
  mentions: {
    title: 'Sin menciones',
    body: 'Cuando alguien mencione a Luna, aparecerá aquí.',
    icon: 'message-circle',
  },
};

/**
 * CMP-77 — NotificationList.
 * Agrupa por Hoy, Ayer y Anteriores y aplica los filtros Todas, Sin leer y
 * Menciones sin perder el orden cronológico.
 */
export function createNotificationList({
  notifications = [],
  filter = 'todas',
  petName = 'tu mascota',
  emptyAction = null,
  onOpen = null,
  onFollow = null,
} = {}) {
  const visible = notifications.filter((item) => {
    if (filter === 'unread') {
      return !item.leida;
    }

    if (filter === 'mentions') {
      return item.tipo === 'MENCION';
    }

    return true;
  });

  if (!visible.length) {
    const copy = EMPTY_COPY[filter] || EMPTY_COPY.todas;

    return createEmptyState({
      icon: copy.icon || 'bell',
      title: copy.title,
      body: copy.body.replace('Luna', petName),
      action: emptyAction,
    });
  }

  const sections = GROUPS.map((group) => {
    const items = visible.filter((item) => item.grupo === group);

    if (!items.length) {
      return null;
    }

    const headingId = `ps-notification-group-${group.toLowerCase()}`;

    return h(
      'section',
      { class: 'ps-notification-group', attrs: { 'aria-labelledby': headingId } },
      h('h2', { class: 'ps-notification-group__title', id: headingId, text: group }),
      h(
        'div',
        { class: 'ps-notification-group__items' },
        items.map((notification) => createNotificationItem({ notification, onOpen, onFollow })),
      ),
    );
  }).filter(Boolean);

  return h('div', { class: 'ps-notification-list' }, sections);
}
