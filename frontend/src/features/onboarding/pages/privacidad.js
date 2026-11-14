import { createAuthCard } from '@/components/layout/auth-card.js';
import { createAlert } from '@/components/primitives/alert.js';
import { createButton } from '@/components/primitives/button.js';
import { createSelectableCard } from '@/components/primitives/selectable-card.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';
import { currentSession } from '@/services/auth.js';
import { createPet } from '@/services/pets.js';
import { clearDraft, getDraft, setPendingPet } from '@/features/onboarding/draft.js';
import { createOnboardingLayout } from '@/features/onboarding/layout.js';

/**
 * D09 / D10 (paso 4) — Privacidad y cierre del onboarding.
 */
export function createPage({ router } = {}) {
  const draft = getDraft();

  if (!draft.nombre) {
    router.navigate('/onboarding/datos', { replace: true });
    return h('div');
  }

  let privacidad = draft.privacidad || 'publico';
  const alert = createAlert({ variant: 'error' });
  const submit = createButton({
    label: 'Terminar',
    type: 'submit',
    size: 'lg',
    fullWidth: true,
    iconRight: createIcon('arrow-right', { size: 20 }),
    loadingLabel: 'Creando espacio…',
  });

  const group = h('div', {
    class: 'ps-choice-list',
    role: 'radiogroup',
    attrs: { 'aria-label': 'Privacidad del perfil' },
  });

  const options = [
    {
      value: 'publico',
      title: 'Perfil público.',
      description: 'Cualquiera puede ver sus publicaciones y seguirla.',
      icon: 'globe',
    },
    {
      value: 'privado',
      title: 'Perfil privado.',
      description: 'Solo sus seguidores aprobados pueden ver su contenido.',
      icon: 'lock',
    },
  ];

  for (const option of options) {
    const choice = createSelectableCard({
      name: 'privacidad',
      value: option.value,
      title: option.title,
      description: option.description,
      icon: option.icon,
      checked: privacidad === option.value,
      onChange: () => {
        privacidad = option.value;
      },
    });
    group.append(choice.element);
  }

  const back = createButton({
    label: 'Volver',
    variant: 'ghost',
    size: 'md',
    iconLeft: createIcon('arrow-left', { size: 18 }),
    onClick: () => router.navigate('/onboarding/perfil'),
  });

  const form = h(
    'form',
    {
      class: 'ps-onboarding__form',
      novalidate: true,
      onSubmit: async (event) => {
        event.preventDefault();

        if (submit.element.disabled) {
          return;
        }

        submit.setLoading(true);
        submit.setDisabled(true);
        alert.hide();

        try {
          const email = currentSession().email;
          const pet = createPet(email, { ...draft, privacidad });
          setPendingPet(pet);
          clearDraft();
          await router.navigate('/onboarding/listo', { replace: true });
        } catch {
          alert.show('No pudimos crear el espacio', 'Intenta de nuevo en un momento.');
          alert.focus();
          submit.setLoading(false);
          submit.setDisabled(false);
        }
      },
    },
    group,
    h('p', {
      class: 'ps-onboarding__note',
      text: 'Puedes cambiarlo cuando quieras desde Ajustes.',
    }),
    alert.element,
    h('div', { class: 'ps-onboarding__actions' }, submit.element),
    h('div', { class: 'ps-onboarding__back' }, back.element),
  );

  const card = createAuthCard({
    title: 'Elige quién puede ver su perfil',
    subtitle: 'Puedes cambiarlo cuando quieras desde Ajustes.',
    children: form,
  });

  return createOnboardingLayout({ router, step: 4, card });
}
