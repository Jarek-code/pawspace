import { createAuthCard } from '@/components/layout/auth-card.js';
import { createButton } from '@/components/primitives/button.js';
import { createField, createSelectField } from '@/components/primitives/field.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';
import { getDraft, saveDraft } from '@/features/onboarding/draft.js';
import { createOnboardingLayout } from '@/features/onboarding/layout.js';
import { messages, validatePetName, validateUsername } from '@/features/auth/validation.js';

const MOCK_TAKEN_USERNAMES = ['sofia', 'milo', 'nala', 'kira', 'toby', 'coco'];

/**
 * D07 / M03 (paso 2) — Datos de la mascota.
 * Solo nombre y usuario son obligatorios. Los datos opcionales se conservan si
 * la persona vuelve a un paso anterior.
 */
export function createPage({ router } = {}) {
  const draft = getDraft();

  if (!draft.especie) {
    router.navigate('/onboarding/especie', { replace: true });
    return h('div');
  }

  const nameField = createField({
    name: 'nombre',
    label: 'Nombre',
    value: draft.nombre || '',
    placeholder: 'Luna',
    autocomplete: 'off',
    required: true,
    requiredMark: true,
    onInput: () => nameField.clearError(),
  });

  const usernameField = createField({
    name: 'usuario',
    label: 'Nombre de usuario',
    value: draft.usuario || '',
    placeholder: 'luna.paws',
    autocomplete: 'off',
    maxlength: 30,
    required: true,
    requiredMark: true,
    help: 'Así la van a encontrar. Solo letras, números y guion bajo.',
    onInput: () => usernameField.clearError(),
  });

  const breedField = createField({
    name: 'raza',
    label: 'Raza',
    value: draft.raza || '',
    placeholder: 'Siamés',
    autocomplete: 'off',
    optional: true,
  });

  const sexField = createSelectField({
    name: 'sexo',
    label: 'Sexo',
    value: draft.sexo || '',
    placeholder: 'Elige una opción',
    options: [
      { value: 'Hembra', label: 'Hembra' },
      { value: 'Macho', label: 'Macho' },
      { value: 'No especificado', label: 'No especificado' },
    ],
    optional: true,
  });

  const birthField = createField({
    name: 'fechaNacimiento',
    label: 'Fecha de nacimiento',
    type: 'date',
    value: draft.fechaNacimiento || '',
    icon: 'calendar',
    optional: true,
  });

  const back = createButton({
    label: 'Volver',
    variant: 'ghost',
    size: 'md',
    iconLeft: createIcon('arrow-left', { size: 18 }),
    onClick: () =>
      router.navigate(
        draft.especie === 'Otra' ? '/onboarding/especie/otra' : '/onboarding/especie',
      ),
  });

  const next = createButton({
    label: 'Continuar',
    type: 'submit',
    size: 'lg',
    fullWidth: true,
    iconRight: createIcon('arrow-right', { size: 20 }),
  });

  const form = h(
    'form',
    {
      class: 'ps-onboarding__form',
      novalidate: true,
      onSubmit: async (event) => {
        event.preventDefault();

        nameField.clearError();
        usernameField.clearError();

        const nombre = nameField.getValue().trim();
        const usuario = usernameField.getValue().trim();
        const nameError = validatePetName(nombre);
        const usernameError = validateUsername(usuario);

        if (nameError) {
          nameField.setError(nameError);
        }

        if (usernameError) {
          usernameField.setError(usernameError);
        } else if (MOCK_TAKEN_USERNAMES.includes(usuario.toLowerCase())) {
          usernameField.setError(messages.usernameTaken);
        }

        if (nameError || usernameError || MOCK_TAKEN_USERNAMES.includes(usuario.toLowerCase())) {
          (nameError ? nameField : usernameField).focus();
          return;
        }

        saveDraft({
          nombre,
          usuario,
          raza: breedField.getValue().trim(),
          sexo: sexField.getValue(),
          fechaNacimiento: birthField.getValue(),
        });

        await router.navigate('/onboarding/perfil');
      },
    },
    nameField.element,
    usernameField.element,
    breedField.element,
    sexField.element,
    birthField.element,
    h('div', { class: 'ps-onboarding__actions' }, next.element),
    h('div', { class: 'ps-onboarding__back' }, back.element),
  );

  const card = createAuthCard({
    title: 'Cuéntanos de tu mascota',
    subtitle: 'Solo el nombre y el usuario son obligatorios.',
    children: form,
  });

  return createOnboardingLayout({ router, step: 2, card });
}
