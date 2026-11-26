import { createAvatar } from '@/components/primitives/avatar.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createModal } from '@/components/primitives/modal.js';
import { createSpinner } from '@/components/primitives/spinner.js';
import { showToast } from '@/components/primitives/toast.js';
import { h } from '@/lib/dom.js';
import { repostPost } from '@/services/feed.js';
import { loadInbox, sendMessage } from '@/services/messages.js';

export function postUrl(post) {
  return `${window.location.origin}/publicacion/${encodeURIComponent(post.id)}`;
}

function isMobileSheet() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 767px) and (orientation: portrait)').matches
  );
}

function createOption({ icon, title, description, onClick }) {
  const button = h(
    'button',
    { class: 'ps-share-dialog__option', type: 'button', onClick },
    h(
      'span',
      { class: 'ps-share-dialog__option-icon', 'aria-hidden': 'true' },
      createIcon(icon, {
        size: 20,
      }),
    ),
    h(
      'span',
      { class: 'ps-share-dialog__option-copy' },
      h('span', { class: 'ps-share-dialog__option-title', text: title }),
      h('span', { class: 'ps-share-dialog__option-description', text: description }),
    ),
    h(
      'span',
      { class: 'ps-share-dialog__option-chevron', 'aria-hidden': 'true' },
      createIcon('chevron-right', {
        size: 18,
      }),
    ),
  );

  return button;
}

/**
 * Ventana para compartir una publicación: republicar, enviar por mensajería
 * interna o copiar el enlace. En escritorio es un modal; en móvil, una hoja.
 */
export function openShareDialog({ post, pet = null, onReposted = null } = {}) {
  const url = postUrl(post);

  const optionsView = h('div', { class: 'ps-share-dialog__options' });
  const recipientsView = h('div', {
    class: 'ps-share-dialog__recipients',
    attrs: { hidden: true },
  });

  const modal = createModal({
    title: 'Compartir publicación',
    size: 'sm',
    variant: isMobileSheet() ? 'sheet' : 'default',
    onClose: () => modal.element.remove(),
    children: h(
      'div',
      { class: 'ps-share-dialog' },
      h(
        'div',
        { class: 'ps-share-dialog__preview' },
        createAvatar({ name: post.mascota?.nombre || '', size: 'sm' }),
        h(
          'div',
          { class: 'ps-share-dialog__preview-copy' },
          h('span', { class: 'ps-share-dialog__preview-name', text: post.mascota?.nombre || '' }),
          h('span', {
            class: 'ps-share-dialog__preview-text',
            text: post.texto || post.media?.caption || 'Publicación',
          }),
        ),
      ),
      optionsView,
      recipientsView,
    ),
  });

  const status = h('p', {
    class: 'ps-share-dialog__status',
    attrs: { role: 'alert', hidden: true },
  });

  const repostButton = createOption({
    icon: 'repeat-2',
    title: 'Republicar',
    description: 'Compártela con tus seguidores.',
    onClick: async () => {
      repostButton.disabled = true;
      repostButton.setAttribute('aria-busy', 'true');
      const spinner = createSpinner({ size: 'sm' });
      repostButton.append(spinner);

      try {
        await repostPost(post.id, {
          mascota: pet ? { nombre: pet.nombre, handle: pet.handle } : undefined,
        });
        modal.close();
        showToast('Republicaste la publicación.');
        onReposted?.();
      } catch (error) {
        repostButton.disabled = false;
        repostButton.removeAttribute('aria-busy');
        spinner.remove();
        showStatus(error?.message || 'No pudimos republicar. Intenta de nuevo.');
      }
    },
  });

  const messageButton = createOption({
    icon: 'send',
    title: 'Enviar por mensaje',
    description: 'Mándala a una conversación.',
    onClick: () => openRecipients(),
  });

  const copyButton = createOption({
    icon: 'link',
    title: 'Copiar enlace',
    description: 'Pega el enlace donde quieras.',
    onClick: async () => {
      try {
        await navigator.clipboard.writeText(url);
        modal.close();
        showToast('Enlace copiado al portapapeles.');
      } catch {
        showStatus('No pudimos copiar el enlace. Intenta de nuevo.');
      }
    },
  });

  optionsView.append(repostButton, messageButton, copyButton, status);

  function showStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  let inboxPromise = null;

  function loadConversations() {
    if (!inboxPromise) {
      inboxPromise = loadInbox().then((data) => data.conversaciones || []);
    }

    return inboxPromise;
  }

  async function openRecipients() {
    optionsView.hidden = true;
    recipientsView.hidden = false;

    if (recipientsView.dataset.ready === 'true') {
      recipientsView.querySelector('.ps-share-dialog__search')?.focus();
      return;
    }

    const back = h(
      'button',
      {
        class: 'ps-share-dialog__back',
        type: 'button',
        onClick: () => {
          recipientsView.hidden = true;
          optionsView.hidden = false;
          repostButton.focus();
        },
      },
      createIcon('arrow-left', { size: 18 }),
      h('span', { text: 'Volver a opciones' }),
    );

    const search = h('input', {
      class: 'ps-share-dialog__search',
      type: 'search',
      placeholder: 'Busca una conversación…',
      attrs: { 'aria-label': 'Buscar conversación' },
    });

    const list = h('ul', { class: 'ps-share-dialog__list' });
    const loading = h(
      'div',
      { class: 'ps-share-dialog__loading' },
      createSpinner({ size: 'sm', label: 'Cargando conversaciones' }),
      h('span', { text: 'Cargando conversaciones…' }),
    );
    const error = h('p', {
      class: 'ps-share-dialog__status',
      attrs: { role: 'alert', hidden: true },
    });

    recipientsView.append(back, search, loading, error, list);

    let conversations = [];

    function renderList() {
      const term = search.value.trim().toLowerCase();
      const visible = conversations.filter((conversation) => {
        const mascota = conversation.mascota || {};
        return (
          !term ||
          String(mascota.nombre || '')
            .toLowerCase()
            .includes(term) ||
          String(mascota.handle || '')
            .toLowerCase()
            .includes(term)
        );
      });

      if (!visible.length) {
        list.replaceChildren(
          h(
            'li',
            { class: 'ps-share-dialog__empty' },
            'No encontramos conversaciones con ese nombre.',
          ),
        );
        return;
      }

      list.replaceChildren(
        ...visible.map((conversation) => {
          const mascota = conversation.mascota || {};
          const button = h(
            'button',
            {
              class: 'ps-share-dialog__recipient',
              type: 'button',
              onClick: async () => {
                button.disabled = true;
                button.setAttribute('aria-busy', 'true');

                try {
                  await sendMessage(mascota.handle, {
                    texto: `Mira esta publicación de ${post.mascota?.nombre || 'una mascota'}: ${url}`,
                  });
                  modal.close();
                  showToast(`Enlace enviado a ${mascota.handle}.`);
                } catch (sendError) {
                  button.disabled = false;
                  button.removeAttribute('aria-busy');
                  error.textContent =
                    sendError?.message || 'No pudimos enviar el mensaje. Intenta de nuevo.';
                  error.hidden = false;
                }
              },
            },
            createAvatar({ name: mascota.nombre || '', src: mascota.avatar || null, size: 'sm' }),
            h(
              'span',
              { class: 'ps-share-dialog__recipient-copy' },
              h('span', {
                class: 'ps-share-dialog__recipient-name',
                text: mascota.nombre || '',
              }),
              h('span', { class: 'ps-share-dialog__recipient-handle', text: mascota.handle || '' }),
            ),
            createIcon('send', { size: 18 }),
          );

          return h('li', { attrs: { role: 'none' } }, button);
        }),
      );
    }

    search.addEventListener('input', renderList);

    try {
      conversations = await loadConversations();
      loading.remove();
      renderList();
      recipientsView.dataset.ready = 'true';
      search.focus();
    } catch (loadError) {
      loading.remove();
      error.textContent =
        loadError?.message || 'No pudimos cargar tus conversaciones. Intenta de nuevo.';
      error.hidden = false;
    }
  }

  document.body.append(modal.element);
  modal.open();

  return modal;
}
