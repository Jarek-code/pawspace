import { createAuthCard } from '@/components/layout/auth-card.js';
import { createButton } from '@/components/primitives/button.js';
import { createDropzone } from '@/components/primitives/dropzone.js';
import { createTextareaField } from '@/components/primitives/field.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';
import { clearPhoto, getDraft, saveDraft, setPhoto } from '@/features/onboarding/draft.js';
import { createOnboardingLayout } from '@/features/onboarding/layout.js';

/**
 * D08 / M03 (paso 3) — Foto y biografía, ambos opcionales.
 */
export function createPage({ router } = {}) {
  const draft = getDraft();

  if (!draft.nombre) {
    router.navigate('/onboarding/datos', { replace: true });
    return h('div');
  }

  const photo = createDropzone({
    label: 'Foto de perfil',
    help: 'JPEG o PNG, máximo 5 MB.',
    onChange: (file) => {
      if (file) {
        setPhoto(file);
      } else {
        clearPhoto();
      }
    },
  });

  const bio = createTextareaField({
    name: 'bio',
    label: 'Biografía',
    value: draft.bio || '',
    placeholder: 'Cuéntanos qué le gusta, cómo es o qué la hace especial…',
    optional: true,
    maxlength: 160,
    rows: 4,
  });

  const back = createButton({
    label: 'Volver',
    variant: 'ghost',
    size: 'md',
    iconLeft: createIcon('arrow-left', { size: 18 }),
    onClick: () => router.navigate('/onboarding/datos'),
  });

  const next = createButton({
    label: 'Continuar',
    type: 'submit',
    size: 'lg',
    fullWidth: true,
    iconRight: createIcon('arrow-right', { size: 20 }),
  });

  const skip = createButton({
    label: 'Omitir por ahora',
    variant: 'ghost',
    size: 'md',
    onClick: () => {
      clearPhoto();
      saveDraft({ bio: '', fotoNombre: '' });
      router.navigate('/onboarding/privacidad');
    },
  });

  const form = h(
    'form',
    {
      class: 'ps-onboarding__form',
      novalidate: true,
      onSubmit: async (event) => {
        event.preventDefault();
        const file = photo.getFile();

        saveDraft({
          bio: bio.getValue().trim(),
          fotoNombre: file?.name || '',
        });

        await router.navigate('/onboarding/privacidad');
      },
    },
    photo.element,
    bio.element,
    h('div', { class: 'ps-onboarding__actions' }, next.element),
    h('div', { class: 'ps-onboarding__skip' }, skip.element),
    h('div', { class: 'ps-onboarding__back' }, back.element),
  );

  const card = createAuthCard({
    title: 'Dale cara y voz',
    subtitle: 'Una foto y una pequeña biografía ayudan a que otros la conozcan.',
    children: form,
  });

  return createOnboardingLayout({ router, step: 3, card });
}
