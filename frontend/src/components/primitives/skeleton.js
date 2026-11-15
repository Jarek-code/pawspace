import { h } from '@/lib/dom.js';

/**
 * CMP-07 — Skeleton.
 * Bloque de carga con shimmer. Reemplaza al contenido real mientras se resuelve
 * el mock o la API; el estado de carga se anuncia en el contenedor.
 */
export function createSkeleton({
  width = '100%',
  height = '16px',
  radius = 'var(--ps-radius-sm)',
  className = '',
} = {}) {
  return h('span', {
    class: `ps-skeleton ${className}`.trim(),
    attrs: { 'aria-hidden': 'true' },
    style: { width, height, borderRadius: radius },
  });
}
