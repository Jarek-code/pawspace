import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

/**
 * CMP-58 — PostGrid.
 * Rejilla 3×2 de publicaciones. Cada tarjeta es un botón que abre D15/M08.
 */
export function createPostGrid({ posts = [], onOpen = null } = {}) {
  const grid = h('div', { class: 'ps-post-grid' });

  for (const post of posts) {
    const caption = post.media?.caption || post.texto || 'Publicación';
    const tile = h(
      'button',
      {
        class: 'ps-post-tile',
        type: 'button',
        attrs: { 'aria-label': `Abrir publicación: ${caption}` },
        onClick: () => onOpen?.(post),
      },
      post.media?.url
        ? h('img', { class: 'ps-post-tile__image', src: post.media.url, alt: caption })
        : h(
            'span',
            { class: 'ps-post-tile__placeholder', attrs: { 'aria-hidden': 'true' } },
            createIcon('image', { size: 28 }),
            h('span', { class: 'ps-post-tile__caption', text: caption }),
          ),
    );

    grid.append(tile);
  }

  return grid;
}
