import { getTheme, setTheme } from '@/lib/storage.js';

/**
 * El tema claro es el predeterminado. El oscuro solo se aplica si la persona
 * lo eligió antes; no se hereda de prefers-color-scheme para respetar la
 * decisión del producto.
 */
export function applyTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  setTheme(next);
  return next;
}

export function initTheme() {
  return applyTheme(getTheme());
}

export function toggleTheme() {
  return applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}
