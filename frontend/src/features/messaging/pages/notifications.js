import { createAppShell, setShellNotificationCount } from '@/components/layout/app-shell.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createSkeleton } from '@/components/primitives/skeleton.js';
import { createTabs } from '@/components/primitives/tabs.js';
import { showToast } from '@/components/primitives/toast.js';
import { createSegmentNav } from '@/components/messaging/conversation-list.js';
import { createNotificationList } from '@/components/messaging/notification-list.js';
import {
  createActivePetCard,
  createNotificationSummary,
  createPetSuggestions,
} from '@/components/messaging/messaging-rail.js';
import { h } from '@/lib/dom.js';
import { currentSession, logout } from '@/services/auth.js';
import { getCurrentPet, listPets } from '@/services/pets.js';
import { toggleFollow } from '@/services/profiles.js';
import {
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications.js';
import { normalizePet, accountFromEmail } from '@/features/feed/feed-view.js';

/**
 * D25 / M18 — Notificaciones.
 * Agrupa avisos por Hoy, Ayer y Anteriores, filtra por Todas, Sin leer y
 * Menciones y actualiza el contador del shell sin recargar.
 */
export function createPage({ router } = {}) {
  const pet = normalizePet(getCurrentPet() || listPets(currentSession().email)[0] || null);
  const account = accountFromEmail(currentSession().email);

  let data = null;
  let filter = 'todas';

  const shell = createAppShell({
    activePath: '/notificaciones',
    title: 'Notificaciones',
    subtitle: 'Cargando avisos…',
    pet,
    account,
    notificationCount: 3,
    onCompose: () => router.navigate('/publicar'),
    onSearch: (query) =>
      router.navigate(query ? `/buscar?q=${encodeURIComponent(query)}` : '/buscar'),
    onLogout: () => {
      logout();
      router.navigate('/', { replace: true });
    },
    rail: h('span', { class: 'ps-sr-only', text: 'Cargando resumen…' }),
    children: notificationsLoading(),
  });

  const content = shell.querySelector('.ps-shell__content');
  const rail = shell.querySelector('.ps-rail');
  const subtitle = shell.querySelector('.ps-topbar__subtitle');

  loadNotifications()
    .then((payload) => {
      data = payload;
      setShellNotificationCount(shell, data.resumen.sinLeer);
      render();
    })
    .catch(() => {
      rail.replaceChildren();
      content.replaceChildren(
        createEmptyState({
          icon: 'alert',
          title: 'No pudimos cargar los avisos',
          body: 'Revisa tu conexión e intenta de nuevo.',
          action: createButton({
            label: 'Reintentar',
            variant: 'secondary',
            onClick: () => router.navigate('/notificaciones', { replace: true }),
          }).element,
        }),
      );
    });

  function render() {
    const { resumen } = data;

    subtitle.textContent =
      resumen.sinLeer > 0
        ? `${resumen.sinLeer} sin leer · ${resumen.semana} esta semana`
        : 'Sin avisos nuevos';

    rail.replaceChildren(...createRail());

    const tabs = createTabs({
      tabs: [
        { value: 'todas', label: 'Todas', active: filter === 'todas' },
        { value: 'unread', label: 'Sin leer', active: filter === 'unread' },
        { value: 'mentions', label: 'Menciones', active: filter === 'mentions' },
      ],
      onChange: (value) => {
        filter = value;
        render();
      },
    });

    const mobileHead = h(
      'header',
      { class: 'ps-messaging-head ps-messaging-head--mobile' },
      h(
        'div',
        { class: 'ps-messaging-head__info' },
        h('h1', { class: 'ps-messaging-head__title', text: 'Notificaciones' }),
        h('p', {
          class: 'ps-messaging-head__subtitle',
          text:
            resumen.sinLeer > 0
              ? `${resumen.sinLeer} sin leer · ${resumen.semana} esta semana`
              : 'Sin avisos nuevos',
        }),
      ),
      markAllButton(),
    );

    const list = createNotificationList({
      notifications: data.notificaciones,
      filter,
      petName: pet?.nombre || 'tu mascota',
      emptyAction: createButton({
        label: 'Explorar mascotas',
        onClick: () => router.navigate('/explorar'),
      }).element,
      onOpen: openNotification,
      onFollow: followActor,
    });

    content.replaceChildren(
      h(
        'div',
        { class: 'ps-notifications-page' },
        mobileHead,
        createSegmentNav({ active: 'notificaciones' }),
        h(
          'div',
          { class: 'ps-messaging-toolbar' },
          tabs.element,
          h('span', { class: 'ps-messaging-toolbar__desktop' }, markAllButton()),
        ),
        list,
      ),
    );
  }

  function createRail() {
    return [
      createActivePetCard(pet, () => router.navigate('/elegir-mascota')),
      createNotificationSummary({ resumen: data.resumen }),
      createPetSuggestions({
        sugerencias: data.sugerencias || [],
        actionLabel: 'Seguir',
        onAction: (suggestion) =>
          toggleFollow(suggestion.handle)
            .then(() => showToast(`Ahora sigues a ${suggestion.nombre}.`))
            .catch((error) =>
              showToast(error?.message || 'No pudimos actualizar el seguimiento.', {
                variant: 'error',
              }),
            ),
      }),
    ].filter(Boolean);
  }

  function markAllButton() {
    const button = createButton({
      label: 'Marcar todo leído',
      variant: 'ghost',
      size: 'sm',
      disabled: data.resumen.sinLeer === 0,
      onClick: markAll,
    });

    return button.element;
  }

  function markAll() {
    if (data.resumen.sinLeer === 0) {
      return;
    }

    const snapshot = data.notificaciones.map((notification) => notification.leida);

    for (const notification of data.notificaciones) {
      notification.leida = true;
    }

    data.resumen.sinLeer = 0;
    setShellNotificationCount(shell, 0);
    render();

    markAllNotificationsRead().catch(() => {
      data.notificaciones.forEach((notification, index) => {
        notification.leida = snapshot[index];
      });
      data.resumen.sinLeer = snapshot.filter((leida) => !leida).length;
      setShellNotificationCount(shell, data.resumen.sinLeer);
      render();
      showToast('No pudimos marcar los avisos. Intenta de nuevo.', { variant: 'error' });
    });
  }

  function openNotification(notification) {
    if (!notification.leida) {
      notification.leida = true;
      data.resumen.sinLeer = Math.max(0, data.resumen.sinLeer - 1);
      setShellNotificationCount(shell, data.resumen.sinLeer);
      markNotificationRead(notification.id).catch(() => {});

      if (!notification.destino) {
        render();
      }
    }
  }

  async function followActor(notification) {
    try {
      await toggleFollow(notification.actor.handle);
      showToast(`Ahora sigues a ${notification.actor.nombre}.`);
    } catch (error) {
      showToast(error?.message || 'No pudimos actualizar el seguimiento.', {
        variant: 'error',
      });
      throw error;
    }
  }

  return shell;
}

function notificationsLoading() {
  return h(
    'div',
    { class: 'ps-notifications-page', attrs: { 'aria-busy': 'true' } },
    h(
      'div',
      { class: 'ps-messaging-toolbar' },
      createSkeleton({ width: '240px', height: '32px' }),
      createSkeleton({ width: '140px', height: '24px' }),
    ),
    h(
      'div',
      { class: 'ps-notification-list' },
      ...Array.from({ length: 5 }, () =>
        h(
          'div',
          { class: 'ps-notification' },
          createSkeleton({ width: '48px', height: '48px', radius: 'var(--ps-radius-full)' }),
          createSkeleton({ width: '65%', height: '16px' }),
        ),
      ),
    ),
  );
}
