import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

const MAX_LENGTH = 4000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * CMP-81 — MessageComposer.
 * Campo que crece hasta cinco líneas, adjunto con vista previa, Enter para
 * enviar y Shift+Enter para salto de línea. Conserva el texto si el envío
 * falla y deshabilita el envío con el campo vacío.
 */
export function createMessageComposer({
  recipientName = '',
  initialValue = '',
  disabled = false,
  onSubmit = null,
  onDraft = null,
} = {}) {
  const textarea = h('textarea', {
    class: 'ps-message-composer__input',
    rows: 1,
    maxlength: MAX_LENGTH,
    placeholder: `Escribe un mensaje${recipientName ? ` para ${recipientName}` : ''}…`,
    attrs: { 'aria-label': 'Escribe un mensaje' },
  });
  textarea.value = initialValue;

  const counter = h('span', {
    class: 'ps-message-composer__counter',
    attrs: { hidden: true, 'aria-live': 'polite' },
  });

  const error = h('p', {
    class: 'ps-message-composer__error',
    attrs: { role: 'alert', hidden: true },
  });

  const attachmentHost = h('div', {
    class: 'ps-message-composer__attachment',
    attrs: { hidden: true },
  });

  const fileInput = h('input', {
    type: 'file',
    accept: 'image/*,.pdf,.txt,.doc,.docx',
    class: 'ps-sr-only',
    tabindex: '-1',
    attrs: { 'aria-hidden': 'true' },
  });

  const attachButton = h(
    'button',
    {
      class: 'ps-message-composer__icon-button',
      type: 'button',
      attrs: { 'aria-label': 'Adjuntar archivo' },
      onClick: () => fileInput.click(),
    },
    createIcon('paperclip', { size: 20 }),
  );

  const sendButton = h(
    'button',
    {
      class: 'ps-message-composer__send',
      type: 'submit',
      disabled: true,
      attrs: { 'aria-label': 'Enviar mensaje' },
    },
    createIcon('send', { size: 20 }),
  );

  let attachment = null;

  function clearAttachment() {
    attachment = null;
    attachmentHost.hidden = true;
    attachmentHost.replaceChildren();
    fileInput.value = '';
  }

  function renderAttachment() {
    if (!attachment) {
      clearAttachment();
      return;
    }

    const preview =
      attachment.tipo === 'image'
        ? h('img', {
            class: 'ps-message-composer__thumb',
            src: attachment.url,
            alt: attachment.nombre,
          })
        : h(
            'span',
            { class: 'ps-message-composer__file-icon', 'aria-hidden': 'true' },
            createIcon('image', { size: 18 }),
          );

    attachmentHost.hidden = false;
    attachmentHost.replaceChildren(
      preview,
      h(
        'span',
        { class: 'ps-message-composer__file-info' },
        h('span', { class: 'ps-message-composer__file-name', text: attachment.nombre }),
        h('span', { class: 'ps-message-composer__file-size', text: attachment.tamano }),
      ),
      h(
        'button',
        {
          class: 'ps-message-composer__remove',
          type: 'button',
          attrs: { 'aria-label': `Quitar ${attachment.nombre}` },
          onClick: () => {
            clearAttachment();
            syncState();
          },
        },
        createIcon('x', { size: 16 }),
      ),
    );
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    error.hidden = true;
    error.textContent = '';

    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      error.textContent = 'El archivo supera los 5 MB. Elige uno más pequeño.';
      error.hidden = false;
      fileInput.value = '';
      return;
    }

    attachment = {
      tipo: file.type.startsWith('image/') ? 'image' : 'file',
      nombre: file.name,
      tamano: formatSize(file.size),
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    };

    renderAttachment();
    syncState();
  });

  function currentText() {
    return textarea.value.trim();
  }

  function grow() {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight || 24, 120)}px`;
  }

  function syncState() {
    const length = textarea.value.length;
    sendButton.disabled = disabled || (!currentText() && !attachment);
    counter.hidden = length < 3600;
    counter.textContent = `${length}/${MAX_LENGTH}`;
    grow();
  }

  textarea.addEventListener('input', () => {
    error.hidden = true;
    syncState();
    onDraft?.(textarea.value);
  });

  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      submit();
    }
  });

  const form = h(
    'form',
    { class: 'ps-message-composer', novalidate: true },
    attachmentHost,
    error,
    h(
      'div',
      { class: 'ps-message-composer__field' },
      attachButton,
      h('div', { class: 'ps-message-composer__input-wrap' }, textarea, counter),
      sendButton,
    ),
    fileInput,
  );

  function submit() {
    if (sendButton.disabled) {
      return;
    }

    error.hidden = true;
    error.textContent = '';

    onSubmit?.({
      texto: currentText(),
      adjunto: attachment
        ? {
            tipo: attachment.tipo,
            nombre: attachment.nombre,
            tamano: attachment.tamano,
            url: attachment.url,
          }
        : null,
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submit();
  });

  function setDisabled(next) {
    disabled = next;
    textarea.disabled = next;
    attachButton.disabled = next;
    sendButton.disabled = next || (!currentText() && !attachment);
  }

  setDisabled(disabled);
  syncState();

  return {
    element: form,
    textarea,
    setError(message = '') {
      error.textContent = message;
      error.hidden = !message;
    },
    setLoading(next) {
      form.classList.toggle('is-loading', next);
      setDisabled(next);
    },
    setDisabled,
    focus: () => textarea.focus(),
    reset() {
      textarea.value = '';
      clearAttachment();
      error.hidden = true;
      error.textContent = '';
      syncState();
      onDraft?.('');
    },
    getValue: () => textarea.value,
  };
}
