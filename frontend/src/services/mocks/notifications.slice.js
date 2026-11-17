import { notifications, notificationsSummary } from './fixtures/notifications.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export const notificationsState = clone(notifications);

export function notificationUnreadCount() {
  return notificationsState.filter((item) => !item.leida).length;
}

export function notificationsPayload() {
  const sinLeer = notificationUnreadCount();

  return {
    notificaciones: notificationsState,
    resumen: {
      sinLeer,
      hoy: notificationsState.filter((item) => item.grupo === 'Hoy').length,
      semana: notificationsSummary.semana,
    },
  };
}

export function markNotificationRead(id) {
  const notification = notificationsState.find((item) => item.id === id);

  if (!notification) {
    return { id, leida: false, sinLeer: notificationUnreadCount() };
  }

  notification.leida = true;
  return { id, leida: true, sinLeer: notificationUnreadCount() };
}

export function markAllNotificationsRead() {
  for (const notification of notificationsState) {
    notification.leida = true;
  }

  return { sinLeer: 0 };
}
