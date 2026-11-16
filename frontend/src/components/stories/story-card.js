import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

/**
 * CMP-67 — StoryCard. Tarjeta 9:16 para historias activas y archivo.
 */
export function createStoryCard({ story, onOpen = null, onDelete = null } = {}) {
  const isVideo = story.media?.type === 'video';
  const caption = story.media?.alt || 'Historia';
  const media = isVideo
    ? h('video', {
        class: 'ps-story-card__media',
        src: story.media.url,
        muted: true,
        loop: true,
        playsinline: true,
        attrs: { 'aria-hidden': 'true' },
      })
    : h('img', {
        class: 'ps-story-card__media',
        src: story.media?.url || '',
        alt: caption,
      });

  const stats = h(
    'span',
    { class: 'ps-story-card__stats' },
    story.fecha ? h('span', { text: story.fecha }) : null,
    h(
      'span',
      { class: 'ps-story-card__stat' },
      createIcon('eye', { size: 14 }),
      h('span', { text: String(story.vistas || 0) }),
    ),
  );

  const open = onOpen
    ? h(
        'button',
        {
          class: 'ps-story-card__open',
          type: 'button',
          attrs: { 'aria-label': `Ver ${caption}` },
          onClick: () => onOpen(story),
        },
        media,
        stats,
      )
    : h('div', { class: 'ps-story-card__open' }, media, stats);

  const remove = onDelete
    ? h(
        'button',
        {
          class: 'ps-story-card__delete',
          type: 'button',
          attrs: { 'aria-label': `Eliminar ${caption}` },
          onClick: () => onDelete(story),
        },
        createIcon('trash-2', { size: 16 }),
      )
    : null;

  return h('article', { class: 'ps-story-card' }, open, remove);
}
