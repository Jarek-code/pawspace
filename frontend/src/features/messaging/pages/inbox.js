import { createAppShell, setShellNotificationCount } from '@/components/layout/app-shell.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createModal } from '@/components/primitives/modal.js';
import { createSkeleton } from '@/components/primitives/skeleton.js';
import { showToast } from '@/components/primitives/toast.js';
import {
  createConversationList,
  createSegmentNav,
} from '@/components/messaging/conversation-list.js';
import {
  createActivePetCard,
  createConversationPreview,
  createPetSuggestions,
  createRequestsRailCard,
} from '@/components/messaging/messaging-rail.js';
import { h } from '@/lib/dom.js';
import { currentSession, logout } from '@/services/auth.js';
import { getCurrentPet, listPets } from '@/services/pets.js';
import { acceptRequest, ignoreRequest, loadInbox } from '@/services/messages.js';
import { normalizePet, accountFromEmail } from '@/features/feed/feed-view.js';

/**
 * D26 / M19 — Bandeja de mensajes.
 * Búsqueda, pestañas Todos / No leídos / Solicitudes, aceptar o ignorar
 * solicitudes y conversación seleccionada en el riel.
 */
export function createPage({ router, query } = {}) {
  const pet = normalizePet(getCurrentPet() || listPets(currentSession().email)[0] || null);
  const account = accountFromEmail(currentSession().email);

  let data = null;
  let mode = 'todos';
  let search = '';
  let selected = String(query?.get('conversacion') || '').replace(/^@/, '');

  const shell = createAppShell({
    activePath: '/mensajes',
    title: 'Mensajes',
    subtitle: 'Cargando conversaciones…',
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
    rail: h('span', { class: 'ps-sr-only', text: 'Cargando conversaciones…' }),
    children: inboxLoading(),
  });

  const content = shell.querySelector('.ps-shell__content');
  const rail = shell.querySelector('.ps-rail');
  const subtitle = shell.querySelector('.ps-topbar__subtitle');

  loadInbox()
    .then((payload) => {
      data = payload;
      setShellNotificationCount(shell, 3);
      render();
    })
    .catch(() => {
      rail.replaceChildren();
      content.replaceChildren(
        createEmptyState({
          icon: 'alert',
          title: 'No pudimos cargar los mensajes',
          body: 'Revisa tu conexión e intenta de nuevo.',
          action: createButton({
            label: 'Reintentar',
            variant: 'secondary',
            onClick: () => router.navigate('/mensajes', { replace: true }),
          }).element,
        }),
      );
    });

  function render() {
    const { totales } = data;

    subtitle.textContent = totales.conversaciones
      ? `${totales.conversaciones} ${totales.conversaciones === 1 ? 'conversación' : 'conversaciones'} · ${totales.sinLeer} sin leer`
      : 'Sin conversaciones';

    rail.replaceChildren(...createRail());

    const activeConversation =
      data.conversaciones.find(
        (conversation) =>
          conversation.mascota.handle.toLowerCase() === `@${selected.toLowerCase()}`,
      ) || data.conversaciones[0];

    const searchInput = h('input', {
      class: 'ps-inbox__search-input',
      type: 'search',
      placeholder: 'Buscar conversaciones',
      value: search,
      attrs: { 'aria-label': 'Buscar conversaciones' },
      onInput: () => {
        search = searchInput.value;
        paintList();
      },
    });

    const listHost = h('div', { class: 'ps-inbox__list' });
    const tabs = buildTabs();

    const mobileHead = h(
      'header',
      { class: 'ps-messaging-head ps-messaging-head--mobile' },
      h(
        'div',
        { class: 'ps-messaging-head__info' },
        h('h1', { class: 'ps-messaging-head__title', text: 'Mensajes' }),
        h('p', {
          class: 'ps-messaging-head__subtitle',
          text: subtitle.textContent,
        }),
      ),
    );

    content.replaceChildren(
      h(
        'div',
        { class: 'ps-inbox' },
        mobileHead,
        createSegmentNav({ active: 'mensajes' }),
        h(
          'div',
          { class: 'ps-inbox__heading' },
          h('h2', { class: 'ps-inbox__title', text: 'Bandeja de entrada' }),
          createButton({
            label: 'Nuevo mensaje',
            onClick: openNewMessage,
          }).element,
        ),
        h(
          'div',
          { class: 'ps-inbox__search' },
          h(
            'span',
            { class: 'ps-inbox__search-icon', 'aria-hidden': 'true' },
            createIcon('search', { size: 20 }),
          ),
          searchInput,
        ),
        tabs.element,
        listHost,
      ),
    );

    function buildTabs() {
      const items = [
        { value: 'todos', label: 'Todos' },
        { value: 'noLeidos', label: 'No leídos' },
        { value: 'solicitudes', label: 'Solicitudes', count: data.solicitudes.length },
      ];

      return {
        element: h(
          'div',
          {
            class: 'ps-inbox-tabs',
            role: 'tablist',
            attrs: { 'aria-label': 'Filtrar conversaciones' },
          },
          items.map((item) => {
            const button = h(
              'button',
              {
                class: `ps-inbox-tabs__tab${mode === item.value ? ' is-active' : ''}`,
                type: 'button',
                role: 'tab',
                attrs: { 'aria-selected': String(mode === item.value) },
                onClick: () => {
                  mode = item.value;
                  syncTabs();
                  paintList();
                },
              },
              h('span', { text: item.label }),
              item.count
                ? h('span', {
                    class: 'ps-inbox-tabs__count',
                    attrs: { 'aria-label': `${item.count} solicitudes` },
                    text: String(item.count),
                  })
                : null,
            );

            button.dataset.value = item.value;
            return button;
          }),
        ),
        sync() {
          syncTabs();
        },
      };

      function syncTabs() {
        for (const button of tabs.element.querySelectorAll('[role="tab"]')) {
          const active = button.dataset.value === mode;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-selected', String(active));
        }
      }
    }

    function paintList() {
      const term = search.trim().toLowerCase();
      const conversationList = data.conversaciones.filter((conversation) => {
        if (mode === 'noLeidos' && Number(conversation.noLeidos || 0) === 0) {
          return false;
        }

        if (!term) {
          return true;
        }

        return [
          conversation.mascota.nombre,
          conversation.mascota.handle,
          conversation.ultimoMensaje,
        ]
          .join(' ')
          .toLowerCase()
          .includes(term);
      });

      listHost.replaceChildren(
        createConversationList({
          conversations: conversationList,
          solicitudes: data.solicitudes.filter((solicitud) => {
            if (!term) {
              return true;
            }

            return [solicitud.mascota.nombre, solicitud.mascota.handle]
              .join(' ')
              .toLowerCase()
              .includes(term);
          }),
          mode,
          searching: Boolean(term),
          activeHandle: activeConversation?.mascota.handle || '',
          emptyAction: createButton({
            label: 'Explorar mascotas',
            onClick: () => router.navigate('/explorar'),
          }).element,
          onOpen: openConversation,
          onAccept: handleAccept,
          onIgnore: handleIgnore,
        }),
      );
    }

    paintList();

    function openNewMessage() {
      const modal = createModal({
        title: 'Nuevo mensaje',
        description: 'Elige una mascota para empezar una conversación.',
        onClose: () => modal.element.remove(),
      });

      modal.body.append(
        data.sugerencias.length
          ? h(
              'ul',
              { class: 'ps-new-message-list' },
              data.sugerencias.map((suggestion) =>
                h(
                  'li',
                  { class: 'ps-new-message-list__row' },
                  h(
                    'span',
                    { class: 'ps-new-message-list__info' },
                    h('span', { class: 'ps-new-message-list__name', text: suggestion.nombre }),
                    h('span', { class: 'ps-new-message-list__handle', text: suggestion.handle }),
                  ),
                  createButton({
                    label: 'Mensaje',
                    size: 'sm',
                    variant: 'secondary',
                    onClick: () => {
                      modal.close();
                      openConversation(suggestion);
                    },
                  }).element,
                ),
              ),
            )
          : h('p', {
              class: 'ps-chat-empty',
              text: 'Todavía no hay mascotas sugeridas.',
            }),
      );

      shell.append(modal.element);
      modal.open();
    }

    function openConversation(person) {
      const handle = String(person.mascota?.handle || person.handle || '').replace(/^@/, '');
      router.navigate(`/mensajes/${encodeURIComponent(handle)}`);
    }

    function handleAccept(solicitud) {
      return acceptRequest(solicitud.mascota.handle)
        .then(() => {
          showToast(`Conversación con ${solicitud.mascota.nombre} creada.`);
          router.navigate(`/mensajes/${solicitud.mascota.handle.replace(/^@/, '')}`);
        })
        .catch((error) => {
          showToast(error?.message || 'No pudimos aceptar la solicitud.', { variant: 'error' });
          throw error;
        });
    }

    function handleIgnore(solicitud) {
      return ignoreRequest(solicitud.mascota.handle)
        .then(() => {
          data.solicitudes = data.solicitudes.filter(
            (item) => item.mascota.handle !== solicitud.mascota.handle,
          );
          data.totales.solicitudes = data.solicitudes.length;
          showToast(`Solicitud de ${solicitud.mascota.nombre} ignorada.`);
          render();
        })
        .catch((error) => {
          showToast(error?.message || 'No pudimos ignorar la solicitud.', { variant: 'error' });
          throw error;
        });
    }
  }

  function createRail() {
    const selectedConversation =
      data.conversaciones.find(
        (conversation) =>
          conversation.mascota.handle.toLowerCase() === `@${selected.toLowerCase()}`,
      ) || data.conversaciones[0];

    return [
      createActivePetCard(pet, () => router.navigate('/elegir-mascota')),
      createConversationPreview({
        conversation: selectedConversation,
        onOpen: (conversation) => openFromRail(conversation),
      }),
      createRequestsRailCard({
        solicitudes: data.solicitudes,
        onAccept: handleAcceptFromRail,
        onIgnore: handleIgnoreFromRail,
      }),
      createPetSuggestions({
        title: 'Sugerencias',
        sugerencias: data.sugerencias || [],
        actionLabel: 'Mensaje',
        onAction: (suggestion) =>
          router.navigate(`/mensajes/${suggestion.handle.replace(/^@/, '')}`),
      }),
    ].filter(Boolean);
  }

  function openFromRail(conversation) {
    router.navigate(`/mensajes/${conversation.mascota.handle.replace(/^@/, '')}`);
  }

  function handleAcceptFromRail(solicitud) {
    return acceptRequest(solicitud.mascota.handle)
      .then(() => {
        showToast(`Conversación con ${solicitud.mascota.nombre} creada.`);
        router.navigate(`/mensajes/${solicitud.mascota.handle.replace(/^@/, '')}`);
      })
      .catch((error) => {
        showToast(error?.message || 'No pudimos aceptar la solicitud.', { variant: 'error' });
        throw error;
      });
  }

  function handleIgnoreFromRail(solicitud) {
    return ignoreRequest(solicitud.mascota.handle)
      .then(() => {
        data.solicitudes = data.solicitudes.filter(
          (item) => item.mascota.handle !== solicitud.mascota.handle,
        );
        data.totales.solicitudes = data.solicitudes.length;
        showToast(`Solicitud de ${solicitud.mascota.nombre} ignorada.`);
        render();
      })
      .catch((error) => {
        showToast(error?.message || 'No pudimos ignorar la solicitud.', { variant: 'error' });
        throw error;
      });
  }

  return shell;
}

function inboxLoading() {
  return h(
    'div',
    { class: 'ps-inbox', attrs: { 'aria-busy': 'true' } },
    createSkeleton({ width: '200px', height: '32px' }),
    createSkeleton({ height: '48px', radius: 'var(--ps-radius-md)' }),
    h(
      'div',
      { class: 'ps-conversation-list' },
      ...Array.from({ length: 5 }, () =>
        h(
          'div',
          { class: 'ps-conversation' },
          createSkeleton({ width: '48px', height: '48px', radius: 'var(--ps-radius-full)' }),
          createSkeleton({ width: '60%', height: '18px' }),
        ),
      ),
    ),
  );
}
