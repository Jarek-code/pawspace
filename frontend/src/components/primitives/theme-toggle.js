import { toggleTheme } from '@/app/theme.js';
import { h } from '@/lib/dom.js';
import { createIcon } from './icon.js';

/**
 * Botón de tema claro/oscuro. El color sale de tokens semánticos, así que el
 * cambio es un simple data-theme en <html>; no hay un CSS duplicado por tema.
 */
export function createThemeToggle() {
  const label = h('span', { class: 'ps-sr-only' });

  const element = h('button', {
    class: 'ps-theme-toggle',
    type: 'button',
    onClick: () => {
      toggleTheme();
      sync();
    },
  });

  function sync() {
    const dark = document.documentElement.dataset.theme === 'dark';
    element.replaceChildren(createIcon(dark ? 'sun' : 'moon', { size: 20 }), label);
    element.setAttribute('aria-label', dark ? 'Activar tema claro' : 'Activar tema oscuro');
    label.textContent = dark ? 'Activar tema claro' : 'Activar tema oscuro';
  }

  sync();

  return { element };
}
