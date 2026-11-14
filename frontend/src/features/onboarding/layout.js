import { createAuthLayout } from '@/components/layout/auth-layout.js';
import { createBrandPanel } from '@/components/layout/brand-panel.js';
import { createStepper } from '@/components/navigation/stepper.js';
import { h } from '@/lib/dom.js';
import './onboarding.css';

export const STEP_ROUTES = {
  1: '/onboarding/especie',
  2: '/onboarding/datos',
  3: '/onboarding/perfil',
  4: '/onboarding/privacidad',
};

export function goToStep(router, step) {
  const target = STEP_ROUTES[step];

  if (target) {
    router.navigate(target);
  }
}

/**
 * CMP-23 + CMP-44 — Layout compartido del onboarding.
 * El stepper y la tarjeta comparten ancho para que la lectura sea una sola
 * columna sobre el panel de marca.
 */
export function createOnboardingLayout({ router, step, card }) {
  const stepper = createStepper({
    current: step,
    onNavigate: (nextStep) => goToStep(router, nextStep),
  });

  return createAuthLayout({
    brand: createBrandPanel(),
    children: h('div', { class: 'ps-onboarding' }, stepper.element, card),
  });
}
