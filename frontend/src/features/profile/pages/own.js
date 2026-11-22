import { createAppShell } from '@/components/layout/app-shell.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createButton } from '@/components/primitives/button.js';
import { showToast } from '@/components/primitives/toast.js';
import { createPostGrid } from '@/components/profile/post-grid.js';
import { createProfileHeader } from '@/components/profile/profile-header.js';
import { createProfileRail } from '@/components/profile/profile-rail.js';
import { createProfileTabs } from '@/components/profile/profile-tabs.js';
import { createStoryCard } from '@/components/stories/story-card.js';
import { h } from '@/lib/dom.js';
import { currentSession, logout } from '@/services/auth.js';
import { getCurrentPet, listPets } from '@/services/pets.js';
import { loadOwnProfile } from '@/services/profiles.js';
import { loadStoryArchive } from '@/services/stories.js';
import { accountFromEmail } from '@/features/feed/feed-view.js';
import { createProfileLoading } from '@/features/profile/profile-view.js';
import { shareProfile } from '@/features/profile/share.js';

/**
 * D16 / M09 — Perfil propio.
 * Cabecera, pestañas y rejilla contra mocks. La rejilla abre D15/M08.
 */
export function createPage({ router } = {}) {
  const stored = getCurrentPet() || listPets(currentSession().email)[0] || null;
  const pet = stored ? { ...stored, handle: `@${stored.usuario}` } : null;
  const account = accountFromEmail(currentSession().email);

  const shell = createAppShell({
    activePath: '/perfil',
    layout: 'wide',
    container: true,
    title: 'Mi perfil',
    subtitle: 'Así te ve la comunidad',
    pet,
    account,
    notificationCount: 3,
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

  loadOwnProfile()
    .then((profile) => {
      render(profile);
    })
    .catch(() => {
      rail.replaceChildren();
      content.replaceChildren(
        createEmptyState({
          icon: 'alert',
          title: 'No pudimos cargar tu perfil',
          body: 'Revisa tu conexión e intenta de nuevo.',
          action: createButton({
            label: 'Reintentar',
            variant: 'secondary',
            onClick: () => router.navigate('/perfil', { replace: true }),
          }).element,
        }),
      );
    });

  function render(profile) {
    const header = createProfileHeader({
      profile,
      variant: 'own',
      onEdit: () => router.navigate('/perfil/editar'),
      onShare: async () => {
        const result = await shareProfile(profile);

        if (result === 'copied') {
          showToast('Enlace del perfil copiado.');
        } else if (result === 'shared') {
          showToast('Perfil compartido.');
        } else if (result === 'failed') {
          showToast('No pudimos copiar el enlace.', { variant: 'error' });
        }
      },
    });

    const gridHost = h('div', {
      class: 'ps-profile__panel',
      attrs: { role: 'tabpanel', 'aria-live': 'polite' },
    });

    const tabs = createProfileTabs({
      own: true,
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
        own: true,
        suggestions: profile.sugerencias || [],
        onChangePet: () => router.navigate('/elegir-mascota'),
        onEdit: () => router.navigate('/perfil/editar'),
        onOpenProfile: (item) => router.navigate(`/mascota/${item.handle.replace(/^@/, '')}`),
      }),
    );
  }

  return shell;
}

function showTab(tab, profile, host, router) {
  host.dataset.tab = tab;
  host.replaceChildren();

  if (tab === 'publicaciones' || tab === 'fotos') {
    const posts =
      tab === 'fotos' ? profile.publicaciones.filter((post) => post.media) : profile.publicaciones;

    if (!posts.length) {
      host.append(
        createEmptyState({
          icon: 'image',
          title: tab === 'fotos' ? 'Aún no hay fotos' : 'Tu primera publicación te espera',
          body:
            tab === 'fotos'
              ? 'Cuando publiques una foto, aparecerá aquí.'
              : 'Comparte un momento de tu mascota con la comunidad.',
          action: createButton({
            label: 'Crear publicación',
            variant: 'primary',
            onClick: () => router.navigate('/publicar'),
          }).element,
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
    return;
  }

  if (tab === 'historias') {
    const loading = createEmptyState({
      icon: 'clock',
      title: 'Cargando tus historias',
      body: 'Estamos reuniendo lo que compartiste.',
    });
    host.append(loading);

    loadStoryArchive()
      .then((data) => {
        if (host.dataset.tab !== 'historias') {
          return;
        }

        const all = [...data.activas, ...data.archivadas];

        if (!all.length) {
          host.replaceChildren(
            createEmptyState({
              icon: 'image',
              title: 'Tus historias',
              body: 'Crea una historia o revisa las que ya compartiste.',
              action: h(
                'div',
                { class: 'ps-empty-state__actions' },
                createButton({
                  label: 'Ver historias',
                  variant: 'secondary',
                  onClick: () => router.navigate('/historias'),
                }).element,
                createButton({
                  label: 'Crear historia',
                  variant: 'primary',
                  onClick: () => router.navigate('/historias/nueva'),
                }).element,
              ),
            }),
          );
          return;
        }

        const handle = profile.handle.replace(/^@/, '');
        host.replaceChildren(
          h('h2', { class: 'ps-profile__stories-title', text: 'Tus historias' }),
          h(
            'div',
            { class: 'ps-story-grid' },
            all.map((story) =>
              createStoryCard({
                story,
                onOpen: data.activas.includes(story)
                  ? () => router.navigate(`/historias/${handle}?desde=/perfil`)
                  : null,
              }),
            ),
          ),
          h(
            'div',
            { class: 'ps-profile__stories-actions' },
            createButton({
              label: 'Gestionar historias',
              variant: 'secondary',
              onClick: () => router.navigate('/historias'),
            }).element,
          ),
        );
      })
      .catch(() => {
        if (host.dataset.tab !== 'historias') {
          return;
        }

        host.replaceChildren(
          createEmptyState({
            icon: 'alert',
            title: 'No pudimos cargar tus historias',
            body: 'Revisa tu conexión e intenta de nuevo.',
          }),
        );
      });
    return;
  }

  host.append(
    createEmptyState({
      icon: 'bookmark',
      title: 'Aún no guardas publicaciones',
      body: 'Cuando guardes algo, lo encontrarás aquí.',
    }),
  );
}

function goSearch(router, query) {
  const clean = String(query || '').trim();
  router.navigate(clean ? `/buscar?q=${encodeURIComponent(clean)}` : '/buscar');
}
