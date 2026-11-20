import { createAlert } from '@/components/primitives/alert.js';
import { createButton } from '@/components/primitives/button.js';
import { createDropzone } from '@/components/primitives/dropzone.js';
import {
  createCheckbox,
  createField,
  createSelectField,
  createTextareaField,
} from '@/components/primitives/field.js';
import { h } from '@/lib/dom.js';

const MAX_SUBJECT = 120;
const MAX_DESCRIPTION = 2000;
const MAX_ATTACHMENT = 5 * 1024 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * CMP-92 — SupportForm.
 * Tema, correo, asunto, descripción, adjunto opcional y privacidad. Valida al
 * salir y al enviar; conserva el contenido si el envío falla.
 */
export function createSupportForm({
  topics = [],
  email = '',
  draft = null,
  onSubmit = null,
  onSaveDraft = null,
} = {}) {
  const alert = createAlert();
  const draftStatus = h('p', {
    class: 'ps-support-form__draft-status',
    attrs: { role: 'status', 'aria-live': 'polite' },
  });

  const tema = createSelectField({
    name: 'tema',
    label: 'Tema',
    options: topics,
    value: draft?.tema || topics[0]?.value || '',
    requiredMark: true,
    onChange: () => tema.clearError(),
  });

  const correo = createField({
    name: 'correo',
    label: 'Correo de contacto',
    type: 'email',
    value: draft?.correo || email,
    autocomplete: 'email',
    inputmode: 'email',
    requiredMark: true,
    onInput: () => correo.clearError(),
    onBlur: () => {
      const value = correo.getValue().trim();

      if (value && !EMAIL_PATTERN.test(value)) {
        correo.setError('Escribe un correo electrónico válido.');
      }
    },
  });

  const asunto = createField({
    name: 'asunto',
    label: 'Asunto',
    value: draft?.asunto || '',
    maxlength: MAX_SUBJECT,
    requiredMark: true,
    onInput: () => asunto.clearError(),
    onBlur: () => {
      if (!asunto.getValue().trim()) {
        asunto.setError('Escribe un asunto.');
      }
    },
  });

  const descripcion = createTextareaField({
    name: 'descripcion',
    label: 'Descripción',
    value: draft?.descripcion || '',
    placeholder:
      'Cuéntanos qué pasó, qué esperabas que ocurriera y si viste algún mensaje de error.',
    rows: 4,
    maxlength: MAX_DESCRIPTION,
    requiredMark: true,
    onInput: () => descripcion.clearError(),
  });

  const captura = createDropzone({
    label: 'Adjuntar captura (opcional)',
    help: 'PNG o JPG · máximo 5 MB',
    accept: 'image/png,image/jpeg',
    maxSize: MAX_ATTACHMENT,
  });

  const privacy = createCheckbox({
    name: 'privacidad',
    label: 'Acepto la política de privacidad y el tratamiento de mis datos.',
    checked: Boolean(draft?.privacidad),
    onChange: () => clearPrivacyError(),
  });

  const privacyError = h('p', {
    class: 'ps-field__message',
    attrs: { role: 'alert' },
  });

  const privacyBlock = h(
    'div',
    { class: 'ps-support-form__privacy' },
    privacy.element,
    privacyError,
  );

  const submit = createButton({
    label: 'Enviar solicitud',
    type: 'submit',
    loadingLabel: 'Enviando…',
  });

  const saveDraft = createButton({
    label: 'Guardar borrador',
    variant: 'ghost',
    onClick: () => {
      onSaveDraft?.(getData());
      draftStatus.textContent = 'Borrador guardado en este dispositivo.';
    },
  });

  const form = h(
    'form',
    { class: 'ps-support-form', attrs: { novalidate: true } },
    alert.element,
    h('div', { class: 'ps-support-form__grid' }, tema.element, correo.element, asunto.element),
    descripcion.element,
    captura.element,
    privacyBlock,
    h('div', { class: 'ps-support-form__actions' }, submit.element, saveDraft.element, draftStatus),
  );

  function clearPrivacyError() {
    privacyBlock.classList.remove('is-invalid');
    privacyError.textContent = '';
  }

  function clearErrors() {
    tema.clearError();
    correo.clearError();
    asunto.clearError();
    descripcion.clearError();
    clearPrivacyError();
    alert.hide();
  }

  function validate() {
    clearErrors();

    if (!tema.getValue()) {
      tema.setError('Elige un tema para tu solicitud.');
      tema.focus();
      return false;
    }

    if (!EMAIL_PATTERN.test(correo.getValue().trim())) {
      correo.setError('Escribe un correo de contacto válido.');
      correo.focus();
      return false;
    }

    const subject = asunto.getValue().trim();

    if (!subject) {
      asunto.setError('Escribe un asunto.');
      asunto.focus();
      return false;
    }

    if (subject.length > MAX_SUBJECT) {
      asunto.setError('El asunto no puede superar los 120 caracteres.');
      asunto.focus();
      return false;
    }

    const body = descripcion.getValue().trim();

    if (!body) {
      descripcion.setError('Cuéntanos qué ocurrió.');
      descripcion.focus();
      return false;
    }

    if (body.length > MAX_DESCRIPTION) {
      descripcion.setError('La descripción no puede superar los 2.000 caracteres.');
      descripcion.focus();
      return false;
    }

    if (!privacy.getValue()) {
      privacyBlock.classList.add('is-invalid');
      privacyError.textContent = 'Acepta la política de privacidad para enviar.';
      privacy.focus();
      return false;
    }

    return true;
  }

  function getData() {
    const file = captura.getFile();

    return {
      tema: tema.getValue(),
      correo: correo.getValue().trim(),
      asunto: asunto.getValue().trim(),
      descripcion: descripcion.getValue().trim(),
      privacidad: privacy.getValue(),
      adjunto: file ? { name: file.name, size: file.size, type: file.type } : null,
    };
  }

  function focusFirstError() {
    for (const field of [tema, correo, asunto, descripcion]) {
      if (field.messageElement.textContent) {
        field.focus();
        return;
      }
    }

    if (privacyError.textContent) {
      privacy.focus();
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    submit.setLoading(true);
    saveDraft.setDisabled(true);

    Promise.resolve(onSubmit?.(getData()))
      .catch((error) => {
        const message = error?.message || 'No pudimos enviar tu solicitud. Intenta de nuevo.';
        alert.show('No pudimos enviar la solicitud', message);
        alert.focus();

        if (/tema/i.test(message)) {
          tema.setError(message);
        } else if (/correo/i.test(message)) {
          correo.setError(message);
        } else if (/asunto/i.test(message)) {
          asunto.setError(message);
        } else if (/descripci[oó]n/i.test(message)) {
          descripcion.setError(message);
        } else if (/privacidad/i.test(message)) {
          privacyBlock.classList.add('is-invalid');
          privacyError.textContent = message;
        }

        focusFirstError();
      })
      .finally(() => {
        submit.setLoading(false);
        saveDraft.setDisabled(false);
      });
  });

  return {
    element: form,
    getData,
    validate,
    focus: () => tema.focus(),
  };
}
