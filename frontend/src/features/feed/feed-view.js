import { createComposer } from '@/components/feed/composer.js';
import { createFeedTabs } from '@/components/feed/feed-tabs.js';
import { createPostCard } from '@/components/feed/post-card.js';
import { createStoryRow } from '@/components/feed/story-ring.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createSkeleton } from '@/components/primitives/skeleton.js';
import { h } from '@/lib/dom.js';
import { toggleLike } from '@/services/feed.js';

export function accountFromEmail(email) {
  const local = (email || '').split('@')[0] || 'cuenta';
  const nombre = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return { nombre: nombre || 'Tu cuenta', email };
}

export function petHandle(pet) {
  if (!pet) {
    return '@mascota';
  }

  return pet.handle || `@${pet.usuario || 'mascota'}`;
}

export function normalizePet(pet) {
  return pet ? { ...pet, handle: petHandle(pet) } : null;
}

export function createFeedContent({
  pet,
  data,
  onOpenPost = null,
  onCompose = null,
  onExplore = null,
} = {}) {
  if (!data.publicaciones.length) {
    return createEmptyState({
      icon: 'paw-print',
      title: 'Tu feed está vacío',
      body: 'Sigue a más mascotas para ver sus publicaciones aquí.',
      action: createButton({
        label: 'Explorar mascotas',
        variant: 'primary',
        onClick: onExplore,
      }).element,
    });
  }

  const feedTabs = createFeedTabs({ active: 'para-ti' }).element;
  const composer = pet ? createComposer({ pet, onCompose }).element : null;
  const stories = createStoryRow({ stories: data.historias }).element;
  const posts = data.publicaciones.map(
    (post) =>
      createPostCard({
        post,
        onOpen: onOpenPost,
        onComment: onOpenPost ? () => onOpenPost(post) : null,
        onLike: () => {
          toggleLike(post.id).catch(() => {});
        },
      }).element,
  );

  return h(
    'div',
    { class: 'ps-feed' },
    stories,
    h('div', { class: 'ps-feed-tabs' }, feedTabs),
    composer,
    ...posts,
  );
}

export function createFeedLoading() {
  const status = h('span', {
    class: 'ps-sr-only',
    role: 'status',
    text: 'Cargando publicaciones…',
  });

  return h(
    'div',
    { class: 'ps-feed' },
    status,
    h(
      'div',
      { class: 'ps-story-row' },
      createSkeleton({ width: '60px', height: '60px', radius: 'var(--ps-radius-full)' }),
      createSkeleton({ width: '60px', height: '60px', radius: 'var(--ps-radius-full)' }),
      createSkeleton({ width: '60px', height: '60px', radius: 'var(--ps-radius-full)' }),
    ),
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
    createSkeleton({
      width: '100%',
      height: '168px',
      radius: 'var(--ps-radius-md)',
      className: 'ps-post-skeleton__media',
    }),
  );
}
