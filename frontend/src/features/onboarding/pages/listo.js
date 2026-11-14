import { createAuthLayout } from '@/components/layout/auth-layout.js';
import { createBrandPanel } from '@/components/layout/brand-panel.js';
import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';
import { activatePet } from '@/services/pets.js';
import { clearPendingPet, getPendingPet } from '@/features/onboarding/draft.js';
import '../onboarding.css';

/**
 * D10 / M05 — Onboarding completado.
 */
export function createPage({ router } = {}) {
  const pet = getPendingPet();

  if (!pet) {
    router.navigate('/onboarding/especie', { replace: true });
    return h('div');
  }

  const enter = createButton({
    label: 'Entrar a PawSpace',
    size: 'lg',
    fullWidth: true,
    onClick: () => {
      activatePet(pet);
      clearPendingPet();
      router.navigate('/inicio', { replace: true });
    },
  });

  const card = h(
    'section',
    {
      class: 'ps-auth-card ps-onboarding-success',
      attrs: { 'aria-label': 'Onboarding completado' },
    },
    h(
      'div',
      { class: 'ps-onboarding-success__icon', 'aria-hidden': 'true' },
      createIcon('paw-print', { size: 32 }),
    ),
    h('h1', {
      class: 'ps-onboarding-success__title',
      text: `¡${pet.nombre} ya tiene su espacio!`,
    }),
    h('p', {
      class: 'ps-onboarding-success__text',
      text: 'Todo está listo. Ahora puede publicar, seguir y descubrir otras mascotas.',
    }),
    h('p', {
      class: 'ps-onboarding-success__note',
      text: 'Puedes cambiar su foto y biografía cuando quieras.',
    }),
    enter.element,
  );

  return createAuthLayout({
    brand: createBrandPanel(),
    children: card,
  });
}
