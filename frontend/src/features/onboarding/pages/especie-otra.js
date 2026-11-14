import { createAuthCard } from '@/components/layout/auth-card.js';
import { createButton } from '@/components/primitives/button.js';
import { createCombobox } from '@/components/primitives/combobox.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';
import { getDraft, saveDraft } from '@/features/onboarding/draft.js';
import { OTHER_SPECIES } from '@/features/onboarding/species.js';
import { createOnboardingLayout } from '@/features/onboarding/layout.js';

/**
 * D06b — Buscar otra especie en el catálogo.
 */
export function createPage({ router } = {}) {
  const draft = getDraft();
  let selected = OTHER_SPECIES.find((species) => species.value === draft.especie) || null;

  const combobox = createCombobox({
    label: 'Especie',
    placeholder: 'Busca otra especie',
    options: OTHER_SPECIES,
    value: selected?.value || '',
    emptyText: 'No encontramos esa especie en el catálogo.',
    onChange: (option) => {
      selected = option;
      next.setDisabled(!option);
    },
  });

  const support = h(
    'p',
    { class: 'ps-onboarding__support' },
    '¿No encuentras la especie? ',
    h('a', { href: 'mailto:soporte@pawspace.app' }, 'Escríbenos a soporte'),
    ' y la agregamos.',
  );

  const back = createButton({
    label: 'Volver',
    variant: 'secondary',
    size: 'lg',
    iconLeft: createIcon('arrow-left', { size: 20 }),
    onClick: () => router.navigate('/onboarding/especie'),
  });

  const next = createButton({
    label: 'Continuar',
    size: 'lg',
    iconRight: createIcon('arrow-right', { size: 20 }),
    disabled: !selected,
    onClick: () => {
      if (!selected) {
        return;
      }

      saveDraft({ especie: selected.value });
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
    combobox.element,
    support,
    h(
      'div',
      { class: 'ps-onboarding__actions ps-onboarding__actions--split' },
      back.element,
      next.element,
    ),
  );

  const card = createAuthCard({
    title: '¿Qué especie es tu mascota?',
    subtitle: 'Busca en la lista o escribe el nombre.',
    children: form,
  });

  return createOnboardingLayout({ router, step: 1, card });
}
