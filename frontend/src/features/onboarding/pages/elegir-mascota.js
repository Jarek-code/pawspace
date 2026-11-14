import { createAuthLayout } from '@/components/layout/auth-layout.js';
import { createBrandPanel } from '@/components/layout/brand-panel.js';
import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';
import { clearDraft } from '@/features/onboarding/draft.js';
import { h } from '@/lib/dom.js';
import { currentSession } from '@/services/auth.js';
import { activatePet, getCurrentPet, listPets } from '@/services/pets.js';
import '../onboarding.css';

function petMeta(pet) {
  const parts = [pet.especie, pet.sexo].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : `@${pet.usuario}`;
}

/**
 * D11 / M04 — Elegir mascota activa.
 */
export function createPage({ router } = {}) {
  const email = currentSession().email;
  const pets = listPets(email);

  if (pets.length === 0) {
    router.navigate('/onboarding/especie', { replace: true });
    return h('div');
  }

  const active = getCurrentPet() || pets[0];

  const choices = pets.map((pet) => {
    const isActive = pet.id === active.id;
    const button = createButton({
      label: `Entrar como ${pet.nombre}`,
      variant: isActive ? 'primary' : 'secondary',
      size: 'md',
      fullWidth: true,
      onClick: () => {
        activatePet(pet);
        router.navigate('/inicio', { replace: true });
      },
    });

    return h(
      'article',
      { class: `ps-pet-choice${isActive ? ' is-selected' : ''}` },
      h(
        'div',
        { class: 'ps-pet-choice__header' },
        h('span', {
          class: 'ps-pet-choice__avatar',
          'aria-hidden': 'true',
          text: pet.nombre.charAt(0),
        }),
        h(
          'div',
          { class: 'ps-pet-choice__identity' },
          h('h2', { class: 'ps-pet-choice__name', text: pet.nombre }),
          h('p', { class: 'ps-pet-choice__meta', text: petMeta(pet) }),
        ),
      ),
      button.element,
    );
  });

  const add = createButton({
    label: 'Agregar otra mascota',
    variant: 'secondary',
    size: 'lg',
    fullWidth: true,
    iconLeft: createIcon('plus', { size: 20 }),
    onClick: () => {
      clearDraft();
      router.navigate('/onboarding/especie');
    },
  });

  const card = h(
    'section',
    { class: 'ps-auth-card ps-pet-choice-card', attrs: { 'aria-label': 'Elegir mascota activa' } },
    h(
      'header',
      { class: 'ps-auth-card__header' },
      h('h1', { class: 'ps-auth-card__title', text: '¿Con quién vas a entrar?' }),
      h('p', {
        class: 'ps-auth-card__subtitle',
        text: 'Elige la mascota que quieres administrar ahora.',
      }),
    ),
    h('div', { class: 'ps-pet-choice-list' }, choices),
    h('div', { class: 'ps-pet-choice-list__add' }, add.element),
    h('p', {
      class: 'ps-onboarding__note',
      text: 'Puedes cambiar de mascota desde el menú de tu cuenta.',
    }),
  );

  return createAuthLayout({
    brand: createBrandPanel(),
    children: card,
  });
}
