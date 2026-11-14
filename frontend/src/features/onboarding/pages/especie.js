import { createIcon } from '@/components/primitives/icon.js';
import { createButton } from '@/components/primitives/button.js';
import { createAuthCard } from '@/components/layout/auth-card.js';
import { createSelectableCard } from '@/components/primitives/selectable-card.js';
import { h } from '@/lib/dom.js';
import { saveDraft, getDraft } from '@/features/onboarding/draft.js';
import { SPECIES } from '@/features/onboarding/species.js';
import { createOnboardingLayout } from '@/features/onboarding/layout.js';

/**
 * D06 / M03 (paso 1) — Elegir especie.
 */
export function createPage({ router } = {}) {
  const draft = getDraft();
  let selected = draft.especie || '';

  const group = h('div', {
    class: 'ps-choice-list',
    role: 'radiogroup',
    attrs: { 'aria-label': 'Tipo de mascota' },
  });

  for (const species of SPECIES) {
    const choice = createSelectableCard({
      name: 'especie',
      value: species.value,
      title: species.title,
      description: species.description,
      icon: species.icon,
      checked: selected === species.value,
      onChange: () => {
        selected = species.value;
        next.setDisabled(false);
      },
    });
    group.append(choice.element);
  }

  const next = createButton({
    label: 'Continuar',
    size: 'lg',
    fullWidth: true,
    iconRight: createIcon('arrow-right', { size: 20 }),
    disabled: !selected,
    onClick: () => {
      if (!selected) {
        return;
      }

      saveDraft({ especie: selected });

      if (selected === 'Otra') {
        router.navigate('/onboarding/especie/otra');
        return;
      }

      router.navigate('/onboarding/datos');
    },
  });

  const form = h(
    'form',
    {
      class: 'ps-onboarding__form',
      novalidate: true,
      onSubmit: (event) => {
        event.preventDefault();
        next.element.click();
      },
    },
    group,
    h('div', { class: 'ps-onboarding__actions' }, next.element),
  );

  const card = createAuthCard({
    title: '¿Qué tipo de mascota es?',
    subtitle: 'Elige una opción. Podrás cambiarla después.',
    children: form,
  });

  return createOnboardingLayout({ router, step: 1, card });
}
