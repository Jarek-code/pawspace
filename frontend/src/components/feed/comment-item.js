import { createAvatar } from '@/components/primitives/avatar.js';
import { h } from '@/lib/dom.js';

/**
 * CMP-49 — CommentItem.
 * Avatar, autor, tiempo y texto. El texto largo envuelve sin empujar el avatar.
 */
export function createCommentItem({ comment }) {
  const { mascota, tiempo, texto } = comment;

  return h(
    'li',
    { class: 'ps-comment-item' },
    createAvatar({ name: mascota.nombre, size: 'sm' }),
    h(
      'div',
      { class: 'ps-comment-item__content' },
      h(
        'p',
        { class: 'ps-comment-item__meta' },
        h('span', { class: 'ps-comment-item__name', text: mascota.nombre }),
        h('span', { class: 'ps-comment-item__handle', text: `${mascota.handle} · ${tiempo}` }),
      ),
      h('p', { class: 'ps-comment-item__text', text: texto }),
    ),
  );
}
