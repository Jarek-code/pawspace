import { h } from '@/lib/dom.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createIcon } from '@/components/primitives/icon.js';

/**
 * CMP-50 — StoryRing.
 * Anillo de 3 px separado 3 px del avatar. Estados: propia (anillo `primary` +
 * badge de suma), no vista (`primary`) y vista (`secondary` con nombre apagado).
 */
export function createStoryRing({ story, onOpen = null } = {}) {
  const { mascota, estado } = story;

  const avatar = createAvatar({ name: mascota.nombre, size: 'md' });

  const badge =
    estado === 'propia'
      ? h(
          'span',
          { class: 'ps-story-ring__badge', 'aria-hidden': 'true' },
          createIcon('plus', { size: 12 }),
        )
      : null;

  const button = h(
    'button',
    {
      class: `ps-story-ring ps-story-ring--${estado}`,
      type: 'button',
      attrs: { 'aria-label': `Historia de ${mascota.nombre}` },
    },
    h('span', { class: 'ps-story-ring__ring' }, avatar),
    badge,
  );

  const name = h(
    'span',
    { class: 'ps-story-ring__name', text: estado === 'propia' ? 'Tu historia' : mascota.nombre },
  );

  const element = h('li', { class: 'ps-story-ring__item' }, button, name);

  if (onOpen) {
    button.addEventListener('click', () => onOpen(story));
  }

  return { element };
}

/**
 * CMP-50 — fila de historias (contenedor).
 */
export function createStoryRow({ stories = [], onOpen = null } = {}) {
  const items = stories.map((story) => createStoryRing({ story, onOpen }).element);

  return h('ul', { class: 'ps-story-row', attrs: { 'aria-label': 'Historias' } }, items);
}
