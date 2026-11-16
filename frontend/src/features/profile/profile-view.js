import { createSkeleton } from '@/components/primitives/skeleton.js';
import { h } from '@/lib/dom.js';

export function createProfileLoading() {
  return h(
    'div',
    {
      class: 'ps-profile-loading',
      attrs: { 'aria-busy': 'true', 'aria-label': 'Cargando perfil' },
    },
    h(
      'div',
      { class: 'ps-profile-loading__card' },
      h('span', { class: 'ps-skeleton ps-profile-loading__cover' }),
      h('span', { class: 'ps-skeleton ps-profile-loading__avatar' }),
      createSkeleton({ width: '34%', height: '28px' }),
      createSkeleton({ width: '20%', height: '16px' }),
      createSkeleton({ width: '90%', height: '14px' }),
      createSkeleton({ width: '72%', height: '14px' }),
      h(
        'div',
        { class: 'ps-profile-loading__stats' },
        createSkeleton({ width: '72px', height: '40px' }),
        createSkeleton({ width: '72px', height: '40px' }),
        createSkeleton({ width: '72px', height: '40px' }),
      ),
    ),
    h(
      'div',
      { class: 'ps-post-grid' },
      ...Array.from({ length: 6 }, () =>
        createSkeleton({ height: '180px', radius: 'var(--ps-radius-md)' }),
      ),
    ),
  );
}
