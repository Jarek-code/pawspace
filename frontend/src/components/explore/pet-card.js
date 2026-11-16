import { createAvatar } from '@/components/primitives/avatar.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createFollowButton } from '@/components/profile/follow-button.js';
import { h } from '@/lib/dom.js';
import { formatCount, speciesIcon } from '@/lib/format.js';

/**
 * CMP-73 — PetResultCard de exploración y búsqueda.
 */
export function createPetCard({ pet, onOpen = null, onFollow = null, onFollowError = null } = {}) {
  const follow = createFollowButton({
    siguiendo: pet.siguiendo,
    pendiente: pet.pendiente,
    privado: pet.privacidad === 'privado',
    onToggle: () => onFollow(pet),
    onError: onFollowError,
  });

  return h(
    'article',
    { class: 'ps-pet-card' },
    h(
      'div',
      { class: 'ps-pet-card__cover', attrs: { 'aria-hidden': 'true' } },
      createIcon(speciesIcon(pet.especie), { size: 28 }),
    ),
    h(
      'div',
      { class: 'ps-pet-card__avatar' },
      createAvatar({ name: pet.nombre, src: pet.avatar, size: 'lg' }),
    ),
    h(
      'div',
      { class: 'ps-pet-card__body' },
      h(
        'button',
        {
          class: 'ps-pet-card__name',
          type: 'button',
          onClick: () => onOpen?.(pet),
        },
        pet.nombre,
      ),
      h('p', { class: 'ps-pet-card__handle', text: pet.handle }),
      h('p', {
        class: 'ps-pet-card__meta',
        text: [pet.especie, pet.raza].filter(Boolean).join(' · '),
      }),
      h('p', {
        class: 'ps-pet-card__followers',
        text: `${formatCount(pet.seguidores)} seguidores`,
      }),
      pet.bio ? h('p', { class: 'ps-pet-card__bio', text: pet.bio }) : null,
    ),
    h('div', { class: 'ps-pet-card__actions' }, follow.element),
  );
}
