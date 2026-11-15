import { h } from '@/lib/dom.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createIcon } from '@/components/primitives/icon.js';

/**
 * CMP-48 — PostCard.
 * Cabecera (avatar, nombre, handle, tiempo, menú), cuerpo, media opcional y
 * acciones. El cuerpo y la media abren el detalle; las acciones no propagan.
 */
export function createPostCard({
  post,
  onOpen = null,
  onLike = null,
  onComment = null,
  onShare = null,
} = {}) {
  const header = h(
    'header',
    { class: 'ps-post-card__header' },
    createAvatar({ name: post.mascota.nombre, size: 'md' }),
    h(
      'div',
      { class: 'ps-post-card__author' },
      h('span', { class: 'ps-post-card__name', text: post.mascota.nombre }),
      h('span', { class: 'ps-post-card__meta' }, `${post.mascota.handle} · ${post.tiempo}`),
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
        h(
          'span',
          { class: 'ps-post-card__media-icon', 'aria-hidden': 'true' },
          createIcon('image', { size: 24 }),
        ),
        h('span', { class: 'ps-post-card__media-caption', text: post.media.caption }),
      )
    : null;

  const like = createAction({
    icon: 'heart',
    label: 'Me gusta',
    count: post.likes,
    pressed: Boolean(post.meGusta),
    onClick: () => {
      const next = !like.isPressed();
      like.setPressed(next);
      like.setCount(Math.max(0, (Number(like.count()) || 0) + (next ? 1 : -1)));

      if (onLike) {
        onLike(next);
      }
    },
  });

  const comment = createAction({
    icon: 'message-square',
    label: 'Comentarios',
    count: post.comentarios,
    onClick: onComment,
  });

  const share = createAction({
    icon: 'share-2',
    label: 'Compartir',
    onClick: onShare,
  });

  const save = createAction({
    icon: 'bookmark',
    label: 'Guardar',
    align: 'end',
    pressed: Boolean(post.guardado),
    onClick: () => save.setPressed(!save.isPressed()),
  });

  const actions = h(
    'footer',
    { class: 'ps-post-card__actions' },
    like.element,
    comment.element,
    share.element,
    save.element,
  );

  const element = h(
    'article',
    { class: 'ps-post-card', dataset: { postId: post.id || '' } },
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

  return { element, like, comment, save };
}

function createAction({
  icon,
  label,
  count = null,
  align = '',
  pressed = null,
  onClick = null,
} = {}) {
  let currentCount = count;
  let currentPressed = pressed;

  const iconElement = h(
    'span',
    { class: 'ps-post-card__action-icon', 'aria-hidden': 'true' },
    createIcon(icon, { size: 20 }),
  );
  const countElement =
    count !== null ? h('span', { class: 'ps-post-card__action-count', text: String(count) }) : null;

  const element = h(
    'button',
    {
      class: 'ps-post-card__action',
      type: 'button',
      attrs: {
        'aria-label': count !== null ? `${label}: ${count}` : label,
        'aria-pressed': pressed === null ? null : String(Boolean(pressed)),
      },
    },
    iconElement,
    countElement,
    h('span', { class: 'ps-sr-only', text: label }),
  );

  if (align) {
    element.classList.add(`ps-post-card__action--${align}`);
  }

  if (pressed) {
    element.classList.add('is-active');
  }

  function setCount(next) {
    currentCount = next;

    if (countElement) {
      countElement.textContent = String(next);
      element.setAttribute('aria-label', `${label}: ${next}`);
    }
  }

  function setPressed(next) {
    currentPressed = next;
    element.setAttribute('aria-pressed', String(next));
    element.classList.toggle('is-active', next);
  }

  if (onClick) {
    element.addEventListener('click', onClick);
  }

  return {
    element,
    setCount,
    setPressed,
    isPressed: () => Boolean(currentPressed),
    count: () => currentCount,
  };
}
