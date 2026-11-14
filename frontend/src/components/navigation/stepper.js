import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

export const ONBOARDING_STEPS = ['Especie', 'Datos', 'Foto y biografía', 'Privacidad'];

/**
 * CMP-23 — Stepper.
 * En escritorio muestra los cuatro pasos; en móvil, “Paso X de 4” y una barra.
 * Solo los pasos completados son navegables.
 */
export function createStepper({ current = 1, steps = ONBOARDING_STEPS, onNavigate = null } = {}) {
  const displayStep = Math.min(current, steps.length);
  const items = steps.map((label, index) => {
    const step = index + 1;
    const isComplete = step < current;
    const isCurrent = step === current;
    const classes = [
      'ps-stepper__item',
      isComplete ? 'is-complete' : '',
      isCurrent ? 'is-current' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const marker = h(
      'span',
      { class: 'ps-stepper__marker', 'aria-hidden': 'true' },
      isComplete ? createIcon('check', { size: 16 }) : String(step),
    );

    const content = h(
      'span',
      { class: 'ps-stepper__label', text: label },
      isCurrent ? h('span', { class: 'ps-sr-only', text: ' (paso actual)' }) : null,
    );

    return h(
      'li',
      {
        class: classes,
        attrs: isCurrent ? { 'aria-current': 'step' } : {},
      },
      onNavigate && isComplete
        ? h(
            'button',
            {
              class: 'ps-stepper__button',
              type: 'button',
              onClick: () => onNavigate(step),
            },
            marker,
            content,
          )
        : h('span', { class: 'ps-stepper__button' }, marker, content),
    );
  });

  const mobile = h(
    'div',
    { class: 'ps-stepper__mobile' },
    h('p', {
      class: 'ps-stepper__mobile-label',
      text: `Paso ${displayStep} de ${steps.length}`,
    }),
    h(
      'div',
      {
        class: 'ps-stepper__progress',
        attrs: {
          role: 'progressbar',
          'aria-valuemin': '1',
          'aria-valuemax': String(steps.length),
          'aria-valuenow': String(displayStep),
          'aria-label': `Paso ${displayStep} de ${steps.length}: ${steps[displayStep - 1]}`,
        },
      },
      h('span', {
        class: 'ps-stepper__progress-bar',
        style: { width: `${(displayStep / steps.length) * 100}%` },
      }),
    ),
  );

  return h(
    'nav',
    { class: 'ps-stepper', attrs: { 'aria-label': 'Progreso del onboarding' } },
    h('ol', { class: 'ps-stepper__list' }, items),
    mobile,
  );
}
