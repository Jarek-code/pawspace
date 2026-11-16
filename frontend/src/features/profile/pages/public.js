import { createAppShell } from '@/components/layout/app-shell.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createModal } from '@/components/primitives/modal.js';
import { showToast } from '@/components/primitives/toast.js';
import { createPostGrid } from '@/components/profile/post-grid.js';
import { createProfileHeader } from '@/components/profile/profile-header.js';
import { createProfileRail } from '@/components/profile/profile-rail.js';
import { createProfileTabs } from '@/components/profile/profile-tabs.js';
import { h } from '@/lib/dom.js';
import { currentSession, logout } from '@/services/auth.js';
import { getCurrentPet, listPets } from '@/services/pets.js';
import { loadProfile, reportProfile, toggleBlock, toggleFollow } from '@/services/profiles.js';
import { accountFromEmail } from '@/features/feed/feed-view.js';
import { createProfileLoading } from '@/features/profile/profile-view.js';
import { copyProfileUrl, shareProfile } from '@/features/profile/share.js';

/**
 * D17 / M10 — Perfil público.
 * No marca un elemento activo en la navegación: es una vista contextual.
 */
export function createPage({ router, params } = {}) {
  const handle = params?.handle || '';
  const stored = getCurrentPet() || listPets(currentSession().email)[0] || null;
  const pet = stored ? { ...stored, handle: `@${stored.usuario}` } : null;
  const account = accountFromEmail(currentSession().email);

  const shell = createAppShell({
    activePath: '',
    title: 'Perfil',
    subtitle: 'Conoce a esta mascota',
    pet,
    account,
    notificationCount: 3,
    backTo: '/inicio',
    onCompose: () => router.navigate('/publicar'),
    onSearch: (query) => goSearch(router, query),
    onLogout: () => {
      logout();
      router.navigate('/', { replace: true });
    },
    rail: h('span', { class: 'ps-sr-only', text: 'Cargando perfil…' }),
    children: createProfileLoading(),
  });

  const content = shell.querySelector('.ps-shell__content');
  const rail = shell.querySelector('.ps-rail');

  loadProfile(handle)
    .then((profile) => render(profile))
    .catch(() => {
      rail.replaceChildren();
      content.replaceChildren(
        createEmptyState({
          icon: 'paw-print',
          title: 'No encontramos esta mascota',
          body: 'Puede que el perfil haya cambiado de nombre o ya no exista.',
          action: createButton({
            label: 'Explorar mascotas',
            variant: 'primary',
            onClick: () => router.navigate('/explorar'),
          }).element,
        }),
      );
    });

  function reload() {
    router.navigate(window.location.pathname, { replace: true });
  }

  function render(profile) {
    setTitles(shell, `Perfil de ${profile.nombre}`);

    if (profile.bloqueado) {
      profile = { ...profile, contenidoBloqueado: true, publicaciones: [] };
    }

    const header = createProfileHeader({
      profile,
      variant: 'public',
      onFollow: () => toggleFollow(profile.handle),
      onFollowError: (error) =>
        showToast(error?.message || 'No pudimos actualizar el seguimiento.', { variant: 'error' }),
      onMessage: () => showToast('La mensajería todavía no está disponible en esta demostración.'),
      onMore: () => openMenu(profile, reload),
      onUnblock: async () => {
        try {
          await toggleBlock(profile.handle);
          showToast(`Desbloqueaste a ${profile.nombre}.`);
          reload();
        } catch (error) {
          showToast(error?.message || 'No pudimos desbloquear el perfil.', { variant: 'error' });
        }
      },
    });

    const gridHost = h('div', {
      class: 'ps-profile__panel',
      attrs: { role: 'tabpanel', 'aria-live': 'polite' },
    });

    const tabs = createProfileTabs({
      own: false,
      active: 'publicaciones',
      onChange: (value) => showTab(value, profile, gridHost, router),
    });

    showTab('publicaciones', profile, gridHost, router);

    content.replaceChildren(
      h(
        'div',
        { class: 'ps-profile' },
        header,
        h(
          'section',
          { class: 'ps-profile__feed', attrs: { 'aria-label': 'Contenido del perfil' } },
          tabs.element,
          gridHost,
        ),
      ),
    );

    rail.replaceChildren(
      ...createProfileRail({
        profile,
        own: false,
        similares: profile.similares || [],
        onOpenProfile: (item) => router.navigate(`/mascota/${item.handle.replace(/^@/, '')}`),
      }),
    );
  }

  return shell;
}

function showTab(tab, profile, host, router) {
  host.replaceChildren();

  if (profile.contenidoBloqueado) {
    host.append(lockedState(profile));
    return;
  }

  if (tab === 'historias') {
    host.append(
      createEmptyState({
        icon: 'image',
        title: `Historias de ${profile.nombre}`,
        body: 'Mira lo que compartió en las últimas 24 horas.',
        action: createButton({
          label: 'Ver historias',
          variant: 'primary',
          onClick: () => router.navigate(`/historias/${profile.handle.replace(/^@/, '')}`),
        }).element,
      }),
    );
    return;
  }

  const posts =
    tab === 'fotos' ? profile.publicaciones.filter((post) => post.media) : profile.publicaciones;

  if (!posts.length) {
    host.append(
      createEmptyState({
        icon: 'image',
        title: tab === 'fotos' ? 'Sin fotos todavía' : 'Sin publicaciones todavía',
        body:
          tab === 'fotos'
            ? `${profile.nombre} aún no ha compartido fotos.`
            : `${profile.nombre} aún no ha publicado nada.`,
      }),
    );
    return;
  }

  host.append(
    createPostGrid({
      posts,
      onOpen: (post) => router.navigate(`/publicacion/${post.id}`),
    }),
  );
}

function lockedState(profile) {
  return createEmptyState({
    icon: 'lock',
    title: profile.bloqueado
      ? `Has bloqueado a ${profile.nombre}`
      : `El perfil de ${profile.nombre} es privado`,
    body: profile.bloqueado
      ? 'Desbloquea el perfil para volver a ver sus publicaciones.'
      : 'Sigue a esta mascota para ver sus publicaciones e historias cuando acepte la solicitud.',
  });
}

function openMenu(profile, reload) {
  const modal = createModal({
    title: 'Opciones del perfil',
    size: 'sm',
    onClose: () => modal.element.remove(),
  });

  const items = [
    {
      icon: 'share-2',
      label: 'Compartir perfil',
      run: async () => {
        const result = await shareProfile(profile);
        modal.close();
        showToast(
          result === 'shared' || result === 'copied'
            ? 'Perfil compartido.'
            : 'No pudimos compartir el perfil.',
          { variant: result === 'shared' || result === 'copied' ? 'success' : 'error' },
        );
      },
    },
    {
      icon: 'bookmark',
      label: 'Copiar enlace',
      run: async () => {
        const result = await copyProfileUrl(profile);
        modal.close();
        showToast(result === 'copied' ? 'Enlace copiado.' : 'No pudimos copiar el enlace.', {
          variant: result === 'copied' ? 'success' : 'error',
        });
      },
    },
    {
      icon: 'alert',
      label: 'Reportar perfil',
      run: async () => {
        try {
          await reportProfile(profile.handle);
          modal.close();
          showToast('Gracias. Revisaremos este perfil.');
        } catch (error) {
          showToast(error?.message || 'No pudimos enviar el reporte.', { variant: 'error' });
        }
      },
    },
    {
      icon: 'lock',
      label: profile.bloqueado ? 'Desbloquear perfil' : `Bloquear a ${profile.nombre}`,
      run: async () => {
        try {
          const result = await toggleBlock(profile.handle);
          modal.close();
          showToast(
            result.bloqueado
              ? `Bloqueaste a ${profile.nombre}.`
              : `Desbloqueaste a ${profile.nombre}.`,
          );
          reload();
        } catch (error) {
          showToast(error?.message || 'No pudimos actualizar el bloqueo.', { variant: 'error' });
        }
      },
    },
  ];

  modal.body.append(
    h(
      'div',
      { class: 'ps-profile-menu' },
      items.map((item) =>
        h(
          'button',
          {
            class: 'ps-profile-menu__item',
            type: 'button',
            onClick: item.run,
          },
          h(
            'span',
            { class: 'ps-profile-menu__icon', 'aria-hidden': 'true' },
            createIcon(item.icon, { size: 18 }),
          ),
          h('span', { text: item.label }),
        ),
      ),
    ),
  );

  document.body.append(modal.element);
  modal.open();
}

function setTitles(shell, title) {
  const desktop = shell.querySelector('.ps-topbar__title');
  const mobile = shell.querySelector('.ps-topbar__mobile-title');

  if (desktop) {
    desktop.textContent = title;
  }

  if (mobile) {
    mobile.textContent = title;
  }
}

function goSearch(router, query) {
  const clean = String(query || '').trim();
  router.navigate(clean ? `/buscar?q=${encodeURIComponent(clean)}` : '/buscar');
}
