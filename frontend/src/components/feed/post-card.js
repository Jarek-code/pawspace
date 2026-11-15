import { h } from '@/lib/dom.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createIcon } from '@/components/primitives/icon.js';

/**
 * CMP-48 — PostCard.
 * Cabecera (avatar, nombre, handle, tiempo, menú), cuerpo, media opcional y
 * acciones. El cuerpo y la media abren el detalle; las acciones no propagan.
 */
export function createPostCard({ post, onOpen = null } = {}) {
  const header = h(
    'header',
    { class: 'ps-post-card__header' },
    createAvatar({ name: post.mascota.nombre, size: 'md' }),
    h(
      'div',
      { class: 'ps-post-card__author' },
      h('span', { class: 'ps-post-card__name', text: post.mascota.nombre }),
      h(
        'span',
        { class: 'ps-post-card__meta' },
        `${post.mascota.handle} · ${post.tiempo}`,
      ),
    ),
    h(
      'button',
      {
        class: 'ps-icon-button',
        type: 'button',
        attrs: { 'aria-label': `Más opciones de la publicación de ${post.mascota.nombre}` },
      },
      createIcon('more-horizontal', { size: 20 }),
    ),
  );

  const body = h(
    'button',
    { class: 'ps-post-card__body', type: 'button' },
    h('span', { class: 'ps-sr-only', text: `Abrir publicación de ${post.mascota.nombre}: ` }),
    h('p', { class: 'ps-post-card__text', text: post.texto }),
  );

  const media = post.media
    ? h(
        'button',
        {
          class: 'ps-post-card__media',
          type: 'button',
        },
        h('span', { class: 'ps-sr-only', text: `Abrir publicación de ${post.mascota.nombre}: ` }),
        h('span', { class: 'ps-post-card__media-icon', 'aria-hidden': 'true' }, createIcon('image', { size: 24 })),
        h('span', { class: 'ps-post-card__media-caption', text: post.media.caption }),
      )
    : null;

  const actions = h(
    'footer',
    { class: 'ps-post-card__actions' },
    createAction({ icon: 'heart', label: 'Me gusta', count: post.likes }),
    createAction({ icon: 'message-square', label: 'Comentarios', count: post.comentarios }),
    createAction({ icon: 'share-2', label: 'Compartir' }),
    createAction({ icon: 'bookmark', label: 'Guardar', align: 'end' }),
  );

  const element = h(
    'article',
    { class: 'ps-post-card' },
    header,
    body,
    media,
    actions,
  );

  if (onOpen) {
    for (const trigger of [body, media]) {
      if (trigger) {
        trigger.addEventListener('click', () => onOpen(post));
      }
    }
  }

  return { element };
}

function createAction({ icon, label, count = null, align = '' }) {
  const content = h(
    'button',
    {
      class: 'ps-post-card__action',
      type: 'button',
      attrs: { 'aria-label': count !== null ? `${label}: ${count}` : label },
    },
    h('span', { class: 'ps-post-card__action-icon', 'aria-hidden': 'true' }, createIcon(icon, { size: 20 })),
    count !== null ? h('span', { class: 'ps-post-card__action-count', text: String(count) }) : null,
    h('span', { class: 'ps-sr-only', text: label }),
  );

  if (align) {
    content.classList.add(`ps-post-card__action--${align}`);
  }

  return content;
}
