import { h } from '@/lib/dom.js';

const SIZES = {
  xs: 32,
  sm: 40,
  md: 48,
  lg: 64,
  xl: 96,
};

/**
 * CMP-03 — Avatar.
 * Circular, con foto o con la inicial de la mascota o la persona. Sin foto usa
 * `secondary-soft` de fondo y `secondary` de texto (CMP-40).
 */
export function createAvatar({ name = '', src = null, size = 'md', alt = '' } = {}) {
  const dimension = SIZES[size] || SIZES.md;
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  const style = { width: `${dimension}px`, height: `${dimension}px` };

  let content;

  if (src) {
    content = h('img', {
      class: 'ps-avatar__image',
      src,
      alt: alt || name,
      style,
    });
  } else {
    content = h('span', { class: 'ps-avatar__initial', style, text: initial });
  }

  return h(
    'span',
    { class: `ps-avatar ps-avatar--${size}`, attrs: { 'aria-hidden': 'true' } },
    content,
  );
}
