import { createAppShell } from '@/components/layout/app-shell.js';
import { createRail } from '@/components/feed/rail.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { h } from '@/lib/dom.js';
import { currentSession, logout } from '@/services/auth.js';
import { loadFeed } from '@/services/feed.js';
import { getCurrentPet, listPets } from '@/services/pets.js';
import {
  accountFromEmail,
  createFeedContent,
  createFeedLoading,
  normalizePet,
} from '@/features/feed/feed-view.js';

/**
 * D13 / M06 — Feed principal.
 *
 * Lee el feed, las historias, las sugerencias y las tendencias contra mocks.
 * Tres estados: cargando (skeletons), vacío (D13b) y default. El compositor
 * abre D14/M07 y cada publicación abre D15/M08.
 */
export function createPage({ router } = {}) {
  const pet = normalizePet(getCurrentPet() || listPets(currentSession().email)[0] || null);
  const account = accountFromEmail(currentSession().email);

  const shell = createAppShell({
    activePath: '/inicio',
    title: 'Inicio',
    subtitle: 'Lo último de tus mascotas',
    pet,
    account,
    notificationCount: 3,
    onCompose: () => router.navigate('/publicar'),
    onLogout: () => {
      logout();
      router.navigate('/', { replace: true });
    },
    rail: h('span', { class: 'ps-sr-only', text: 'Cargando sugerencias…' }),
    children: createFeedLoading(),
  });

  const content = shell.querySelector('.ps-shell__content');
  const rail = shell.querySelector('.ps-rail');

  loadFeed()
    .then((data) => {
      const renderFeed = (feedData) => {
        rail.replaceChildren(
          ...createRail({
            pet,
            ...feedData,
            onChangePet: () => router.navigate('/elegir-mascota'),
          }),
        );
        content.replaceChildren(
          createFeedContent({
            pet,
            data: feedData,
            onCompose: () => router.navigate('/publicar'),
            onOpenPost: (post) => router.navigate(`/publicacion/${post.id}`),
            onOpenStory: (story) =>
              router.navigate(
                `/historias/${story.mascota.handle.replace(/^@/, '')}?desde=${encodeURIComponent('/inicio')}`,
              ),
            onReposted: () => {
              loadFeed()
                .then(renderFeed)
                .catch(() => {});
            },
          }),
        );
      };

      renderFeed(data);
    })
    .catch(() => {
      rail.replaceChildren();
      content.replaceChildren(
        createEmptyState({
          icon: 'alert',
          title: 'No pudimos cargar el feed',
          body: 'Revisa tu conexión e intenta de nuevo.',
          action: createButton({
            label: 'Reintentar',
            variant: 'secondary',
            onClick: () => router.navigate('/inicio'),
          }).element,
        }),
      );
    });

  return shell;
}
