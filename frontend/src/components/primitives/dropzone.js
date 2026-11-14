import { h } from '@/lib/dom.js';
import { createIcon } from './icon.js';

let dropzoneCounter = 0;

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.ceil(bytes / 1024)} KB`;
}

/**
 * CMP-20 — FileUpload.
 * Dropzone con vista previa, validación de tipo y tamaño, y limpieza de la URL
 * temporal. El input es real y se mantiene accesible.
 */
export function createDropzone({
  label = 'Foto de perfil',
  help = 'JPEG o PNG, máximo 5 MB.',
  accept = 'image/png,image/jpeg',
  maxSize = 5 * 1024 * 1024,
  onChange = null,
} = {}) {
  dropzoneCounter += 1;
  const id = `ps-dropzone-${dropzoneCounter}`;
  const messageId = `${id}-message`;
  const helpId = `${id}-help`;

  let file = null;
  let previewUrl = '';

  const input = h('input', {
    class: 'ps-dropzone__input',
    type: 'file',
    id,
    accept,
    attrs: {
      'aria-describedby': `${messageId} ${helpId}`,
    },
  });

  const prompt = h(
    'span',
    { class: 'ps-dropzone__prompt' },
    h(
      'span',
      { class: 'ps-dropzone__icon', 'aria-hidden': 'true' },
      createIcon('upload', { size: 24 }),
    ),
    h('span', {
      class: 'ps-dropzone__title',
      text: 'Arrastra una imagen o haz clic para elegirla',
    }),
    h('span', { class: 'ps-dropzone__help', text: help }),
  );

  const preview = h(
    'span',
    { class: 'ps-dropzone__preview' },
    h('img', { class: 'ps-dropzone__image', alt: '' }),
    h('span', { class: 'ps-dropzone__file' }),
    h(
      'button',
      {
        class: 'ps-dropzone__remove',
        type: 'button',
        attrs: { 'aria-label': 'Quitar imagen' },
        onClick: (event) => {
          event.preventDefault();
          reset();
        },
      },
      createIcon('x', { size: 16 }),
    ),
  );
  preview.hidden = true;

  const message = h('p', {
    class: 'ps-field__message',
    id: messageId,
    attrs: { role: 'alert' },
  });

  const zone = h('label', { class: 'ps-dropzone__zone', for: id }, input, prompt, preview);

  const element = h(
    'div',
    { class: 'ps-dropzone' },
    h('p', { class: 'ps-field__label', text: label }),
    zone,
    h('p', { class: 'ps-field__help', id: helpId, text: help }),
    message,
  );

  function setError(text) {
    element.classList.add('is-invalid');
    zone.classList.add('is-invalid');
    message.textContent = text;
  }

  function clearError() {
    element.classList.remove('is-invalid');
    zone.classList.remove('is-invalid');
    message.textContent = '';
  }

  function clearPreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = '';
    }

    preview.querySelector('img').removeAttribute('src');
    preview.querySelector('.ps-dropzone__file').textContent = '';
  }

  function reset() {
    file = null;
    input.value = '';
    clearPreview();
    preview.hidden = true;
    prompt.hidden = false;
    clearError();

    if (onChange) {
      onChange(null);
    }
  }

  function acceptFile(nextFile) {
    clearError();

    if (!nextFile) {
      return;
    }

    const allowed = accept.split(',').map((type) => type.trim());

    if (!allowed.includes(nextFile.type)) {
      setError('Elige una imagen JPG o PNG.');
      input.value = '';
      return;
    }

    if (nextFile.size > maxSize) {
      setError(`La imagen pesa ${formatSize(nextFile.size)}. El máximo es ${formatSize(maxSize)}.`);
      input.value = '';
      return;
    }

    clearPreview();
    file = nextFile;
    previewUrl = URL.createObjectURL(nextFile);
    preview.querySelector('img').src = previewUrl;
    preview.querySelector('.ps-dropzone__file').textContent = nextFile.name;
    preview.hidden = false;
    prompt.hidden = true;

    if (onChange) {
      onChange(nextFile);
    }
  }

  input.addEventListener('change', () => acceptFile(input.files?.[0] || null));

  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.classList.add('is-dragging');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('is-dragging'));

  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('is-dragging');
    acceptFile(event.dataTransfer?.files?.[0] || null);
  });

  return {
    element,
    input,
    getFile: () => file,
    getPreviewUrl: () => previewUrl,
    reset,
    setError,
    clearError,
  };
}
