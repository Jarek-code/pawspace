import { createAppShell } from '@/components/layout/app-shell.js';
import { createFeedTabs } from '@/components/feed/feed-tabs.js';
import { createComposer } from '@/components/feed/composer.js';
import { createPostCard } from '@/components/feed/post-card.js';
import { createRail } from '@/components/feed/rail.js';
import { createStoryRow } from '@/components/feed/story-ring.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createSkeleton } from '@/components/primitives/skeleton.js';
import { h } from '@/lib/dom.js';
import { currentSession, logout } from '@/services/auth.js';
import { loadFeed } from '@/services/feed.js';
import { getCurrentPet, listPets } from '@/services/pets.js';

/**
 * D13 / M06 — Feed principal.
 *
 * Lee el feed, las historias, las sugerencias y las tendencias contra mocks.
 * Tres estados: cargando (skeletons), vacío (D13b) y default. El compositor y
 * el detalle de publicación se conectan en las siguientes iteraciones.
 */
export function createPage({ router } = {}) {
  const pet = getCurrentPet() || listPets(currentSession().email)[0] || null;
  const account = accountFromEmail(currentSession().email);

  const shell = createAppShell({
    activePath: '/inicio',
    title: 'Inicio',
    subtitle: 'Lo último de tus mascotas',
    pet,
    account,
    notificationCount: 3,
    onLogout: () => {
      logout();
      router.navigate('/', { replace: true });
    },
    rail: h('span', { class: 'ps-sr-only', text: 'Cargando sugerencias…' }),
    children: createLoading(),
  });

  const content = shell.querySelector('.ps-shell__content');
  const rail = shell.querySelector('.ps-rail');

  loadFeed()
    .then((data) => {
      rail.replaceChildren(...createRail({ pet, ...data, onChangePet: () => router.navigate('/elegir-mascota') }));
      content.replaceChildren(createFeedContent({ pet, data }));
    })
    .catch(() => {
      rail.replaceChildren();
      content.replaceChildren(
        createEmptyState({
          icon: 'alert',
          title: 'No pudimos cargar el feed',
          body: 'Revisa tu conexión e intenta de nuevo.',
          action: createButton({ label: 'Reintentar', variant: 'secondary', onClick: () => router.navigate('/inicio') }).element,
        }),
      );
    });

  return shell;
}

function accountFromEmail(email) {
  const local = (email || '').split('@')[0] || 'cuenta';
  const nombre = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return { nombre: nombre || 'Tu cuenta', email };
}

function createFeedContent({ pet, data }) {
  if (!data.publicaciones.length) {
    return createEmptyState({
      icon: 'paw-print',
      title: 'Tu feed está vacío',
      body: 'Sigue a más mascotas para ver sus publicaciones aquí.',
      action: createButton({ label: 'Explorar mascotas', variant: 'primary' }).element,
    });
  }

  const feedTabs = createFeedTabs({ active: 'para-ti' }).element;
  const composer = pet ? createComposer({ pet }).element : null;
  const stories = createStoryRow({ stories: data.historias }).element;
  const posts = data.publicaciones.map((post) => createPostCard({ post }).element);

  return h('div', { class: 'ps-feed' }, stories, h('div', { class: 'ps-feed-tabs' }, feedTabs), composer, ...posts);
}

function createLoading() {
  const status = h('span', { class: 'ps-sr-only', role: 'status', text: 'Cargando publicaciones…' });

  return h(
    'div',
    { class: 'ps-feed' },
    status,
    h('div', { class: 'ps-story-row' }, createSkeleton({ width: '60px', height: '60px', radius: 'var(--ps-radius-full)' }), createSkeleton({ width: '60px', height: '60px', radius: 'var(--ps-radius-full)' }), createSkeleton({ width: '60px', height: '60px', radius: 'var(--ps-radius-full)' })),
    createPostSkeleton(),
    createPostSkeleton(),
  );
}

function createPostSkeleton() {
  return h(
    'article',
    { class: 'ps-post-card', attrs: { 'aria-hidden': 'true' } },
    h(
      'div',
      { class: 'ps-post-card__header' },
      createSkeleton({ width: '48px', height: '48px', radius: 'var(--ps-radius-full)' }),
      h(
        'div',
        { class: 'ps-post-card__author' },
        createSkeleton({ width: '40%', height: '14px' }),
        createSkeleton({ width: '60%', height: '12px' }),
      ),
    ),
    createSkeleton({ width: '90%', height: '16px', className: 'ps-post-skeleton__line' }),
    createSkeleton({ width: '70%', height: '16px', className: 'ps-post-skeleton__line' }),
    createSkeleton({ width: '100%', height: '168px', radius: 'var(--ps-radius-md)', className: 'ps-post-skeleton__media' }),
  );
}
