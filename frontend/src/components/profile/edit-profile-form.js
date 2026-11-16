import { createAlert } from '@/components/primitives/alert.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { createDropzone } from '@/components/primitives/dropzone.js';
import {
  createField,
  createSelectField,
  createTextareaField,
} from '@/components/primitives/field.js';
import { h } from '@/lib/dom.js';
import { fileToDataUrl } from '@/lib/image.js';
import { breedsForSpecies } from '@/features/onboarding/breeds.js';
import { OTHER_SPECIES, SPECIES } from '@/features/onboarding/species.js';
import { messages, validatePetName, validateUsername } from '@/features/auth/validation.js';

const SPECIES_VALUES = [
  ...SPECIES.map((item) => item.value).filter((value) => value !== 'Otra'),
  ...OTHER_SPECIES.map((item) => item.value),
];

/**
 * CMP-61 — EditProfileForm.
 * Solo edita campos del esquema: sin portada, ubicación ni sitio web.
 */
export function createEditProfileForm({
  profile,
  onSubmit = null,
  onCancel = null,
  onPreview = null,
} = {}) {
  const alert = createAlert();

  const dropzone = createDropzone({
    label: 'Foto de perfil',
    help: 'JPEG o PNG, máximo 5 MB. Se recorta en círculo.',
    onChange: () => emitPreview(),
  });

  const nombreField = createField({
    name: 'nombre',
    label: 'Nombre',
    value: profile.nombre,
    required: true,
    requiredMark: true,
    onInput: () => nombreField.clearError(),
  });

  const usuarioField = createField({
    name: 'usuario',
    label: 'Nombre de usuario',
    value: profile.handle.replace(/^@/, ''),
    maxlength: 30,
    required: true,
    requiredMark: true,
    help: 'Así te encuentran. Letras, números, punto o guion bajo.',
    onInput: () => usuarioField.clearError(),
  });

  const speciesOptions = [...new Set([...SPECIES_VALUES, profile.especie].filter(Boolean))].map(
    (value) => ({ value, label: value }),
  );

  const especieField = createSelectField({
    name: 'especie',
    label: 'Especie',
    value: profile.especie,
    options: speciesOptions,
    placeholder: 'Elige una especie',
    required: true,
    requiredMark: true,
  });

  const razaField = createSelectField({
    name: 'raza',
    label: 'Raza',
    value: profile.raza,
    options: [],
    placeholder: 'Sin raza',
    optional: true,
  });

  function syncBreeds(species, current = '') {
    const breeds = breedsForSpecies(species);

    if (current && !breeds.some((item) => item.value === current)) {
      breeds.unshift({ value: current, label: current });
    }

    razaField.select.replaceChildren(
      h('option', { value: '', text: 'Sin raza' }),
      ...breeds.map((item) => h('option', { value: item.value, text: item.label })),
    );
    razaField.select.value = current;
  }

  syncBreeds(profile.especie, profile.raza);
  especieField.select.addEventListener('change', () => syncBreeds(especieField.getValue(), ''));

  const sexoField = createSelectField({
    name: 'sexo',
    label: 'Sexo',
    value: profile.sexo,
    options: [
      { value: 'Hembra', label: 'Hembra' },
      { value: 'Macho', label: 'Macho' },
      { value: 'No especificado', label: 'No especificado' },
    ],
    placeholder: 'Sin especificar',
    optional: true,
  });

  const birthField = createField({
    name: 'fechaNacimiento',
    label: 'Fecha de nacimiento',
    type: 'date',
    value: profile.fechaNacimiento || '',
    optional: true,
  });
  birthField.input.max = new Date().toISOString().slice(0, 10);

  const bioField = createTextareaField({
    name: 'bio',
    label: 'Biografía',
    value: profile.bio || '',
    placeholder: 'Cuenta algo sobre tu mascota.',
    rows: 4,
    maxlength: 1000,
    optional: true,
    help: 'Máximo 1000 caracteres.',
  });

  const privacyField = createSelectField({
    name: 'privacidad',
    label: 'Privacidad del perfil',
    value: profile.privacidad || 'publico',
    options: [
      { value: 'publico', label: 'Público: cualquiera puede ver el perfil' },
      { value: 'privado', label: 'Privado: solo seguidores aprobados' },
    ],
  });

  const cancel = createButton({
    label: 'Cancelar',
    variant: 'ghost',
    size: 'md',
    onClick: onCancel,
  });

  const save = createButton({
    label: 'Guardar cambios',
    type: 'submit',
    size: 'md',
  });

  function emitPreview(extra = {}) {
    onPreview?.({
      nombre: nombreField.getValue().trim() || profile.nombre,
      usuario: usuarioField.getValue().trim() || profile.handle.replace(/^@/, ''),
      bio: bioField.getValue().trim(),
      especie: especieField.getValue(),
      raza: razaField.getValue(),
      fechaNacimiento: birthField.getValue(),
      avatar: dropzone.getPreviewUrl() || profile.avatar || null,
      ...extra,
    });
  }

  nombreField.input.addEventListener('input', () => emitPreview());
  usuarioField.input.addEventListener('input', () => emitPreview());
  bioField.input.addEventListener('input', () => emitPreview());
  especieField.select.addEventListener('change', () => emitPreview());
  razaField.select.addEventListener('change', () => emitPreview());
  birthField.input.addEventListener('change', () => emitPreview());

  const form = h(
    'form',
    {
      class: 'ps-edit-profile',
      novalidate: true,
      onSubmit: async (event) => {
        event.preventDefault();
        alert.hide();
        nombreField.clearError();
        usuarioField.clearError();

        const nombre = nombreField.getValue().trim();
        const usuario = usuarioField.getValue().trim();
        const nameError = validatePetName(nombre);
        const usernameError = validateUsername(usuario);

        if (nameError) {
          nombreField.setError(nameError);
        }

        if (usernameError) {
          usuarioField.setError(usernameError);
        }

        if (nameError || usernameError) {
          (nameError ? nombreField : usuarioField).focus();
          return;
        }

        save.setLoading(true);

        try {
          const file = dropzone.getFile();
          const avatar = file ? await fileToDataUrl(file) : profile.avatar || null;

          await onSubmit?.({
            nombre,
            usuario,
            especie: especieField.getValue(),
            raza: razaField.getValue(),
            sexo: sexoField.getValue(),
            fechaNacimiento: birthField.getValue(),
            bio: bioField.getValue().trim(),
            privacidad: privacyField.getValue(),
            avatar,
          });
        } catch (error) {
          alert.show('No pudimos guardar los cambios', error?.message || messages.network);
          alert.focus();
        } finally {
          save.setLoading(false);
        }
      },
    },
    alert.element,
    h(
      'section',
      { class: 'ps-edit-profile__section' },
      h('h2', { class: 'ps-edit-profile__title', text: 'Identidad' }),
      h(
        'div',
        { class: 'ps-edit-profile__avatar' },
        createAvatar({
          name: profile.nombre,
          src: profile.avatar,
          size: 'lg',
        }),
        h(
          'div',
          { class: 'ps-edit-profile__avatar-copy' },
          h('p', { class: 'ps-edit-profile__avatar-title', text: 'Foto de tu mascota' }),
          h('p', {
            class: 'ps-edit-profile__avatar-help',
            text: 'Una foto clara y reciente ayuda a que la reconozcan.',
          }),
        ),
      ),
      dropzone.element,
      h('div', { class: 'ps-edit-profile__grid' }, nombreField.element, usuarioField.element),
    ),
    h(
      'section',
      { class: 'ps-edit-profile__section' },
      h('h2', { class: 'ps-edit-profile__title', text: 'Sobre tu mascota' }),
      h(
        'div',
        { class: 'ps-edit-profile__grid' },
        especieField.element,
        razaField.element,
        sexoField.element,
        birthField.element,
      ),
      bioField.element,
    ),
    h(
      'section',
      { class: 'ps-edit-profile__section' },
      h('h2', { class: 'ps-edit-profile__title', text: 'Privacidad' }),
      privacyField.element,
    ),
    h('div', { class: 'ps-edit-profile__actions' }, cancel.element, save.element),
  );

  return { element: form, save };
}
