import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { createDropzone } from '@/components/primitives/dropzone.js';
import { createTextareaField } from '@/components/primitives/field.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

const MAX_LENGTH = 500;

/**
 * CMP-53 — Composer completo (D14 / M07).
 * Autor, texto con contador, adjunto de foto, acciones y publicación.
 * El botón Publicar se habilita con texto o con una imagen.
 */
export function createComposerForm({ pet, onSubmit = null, onCancel = null } = {}) {
  const handle = pet.handle || `@${pet.usuario || 'mascota'}`;
  const visibility = pet.privacidad === 'privado' ? 'Perfil privado' : 'Perfil público';

  const field = createTextareaField({
    label: '',
    placeholder: `¿Qué está pasando con ${pet.nombre}?`,
    rows: 6,
    maxlength: MAX_LENGTH,
    onInput: syncPublish,
  });

  const dropzone = createDropzone({
    label: '',
    help: 'JPG o PNG, máximo 5 MB.',
    onChange: syncPublish,
  });

  const photoButton = createButton({
    label: 'Foto',
    variant: 'secondary',
    size: 'sm',
    iconLeft: createIcon('image', { size: 18 }),
    onClick: () => dropzone.input.click(),
  });

  const logroButton = createButton({
    label: 'Logro',
    variant: 'secondary',
    size: 'sm',
    disabled: true,
    iconLeft: createIcon('zap', { size: 18 }),
  });
  logroButton.element.title = 'Próximamente';
  logroButton.element.setAttribute('aria-disabled', 'true');

  const publish = createButton({
    label: 'Publicar',
    variant: 'primary',
    type: 'submit',
    disabled: true,
  });

  const cancel = createButton({
    label: 'Cancelar',
    variant: 'secondary',
    onClick: onCancel,
  });

  const error = h('p', {
    class: 'ps-composer-form__error',
    attrs: { role: 'alert', hidden: true },
  });

  function currentText() {
    return field.getValue().trim();
  }

  function syncPublish() {
    const hasContent = currentText().length > 0 || Boolean(dropzone.getFile());
    publish.setDisabled(!hasContent);
  }

  const element = h(
    'form',
    { class: 'ps-composer-form', novalidate: true },
    h(
      'div',
      { class: 'ps-composer-form__author' },
      createAvatar({ name: pet.nombre, size: 'md' }),
      h(
        'div',
        { class: 'ps-composer-form__author-info' },
        h('span', {
          class: 'ps-composer-form__author-name',
          text: `Publicando como ${pet.nombre}`,
        }),
        h('span', {
          class: 'ps-composer-form__author-meta',
          text: `${handle} · ${visibility}`,
        }),
      ),
    ),
    h('div', { class: 'ps-composer-form__text' }, field.element),
    h('div', { class: 'ps-composer-form__media' }, dropzone.element),
    h('div', { class: 'ps-composer-form__tools' }, photoButton.element, logroButton.element),
    error,
    h('footer', { class: 'ps-composer-form__footer' }, cancel.element, publish.element),
  );

  element.addEventListener('submit', (event) => {
    event.preventDefault();

    if (publish.element.disabled) {
      return;
    }

    error.hidden = true;
    error.textContent = '';

    if (onSubmit) {
      onSubmit({
        texto: currentText(),
        file: dropzone.getFile(),
        media: dropzone.getFile() ? { caption: `Foto de ${pet.nombre}` } : null,
      });
    }
  });

  return {
    element,
    field,
    dropzone,
    publish,
    cancel,
    setError(message = '') {
      error.textContent = message;
      error.hidden = !message;
    },
    setLoading(next) {
      publish.setLoading(next);
      field.setDisabled(next);
      dropzone.input.disabled = next;
      photoButton.setDisabled(next);
      cancel.setDisabled(next);
    },
    reset() {
      field.setValue('');
      dropzone.reset();
      error.hidden = true;
      error.textContent = '';
      syncPublish();
    },
  };
}
