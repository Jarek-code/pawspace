import logoUrl from '@/assets/brand/pawspace-logo-light.svg';
import { createThemeToggle } from '@/components/primitives/theme-toggle.js';
import { h } from '@/lib/dom.js';

/**
 * CMP-35 — SkipLink + CMP-44 — AuthLayout.
 * Dos columnas en escritorio y una en móvil. El panel de marca se oculta por
 * debajo de 1024 px y aparece una cabecera compacta dentro del formulario.
 */
export function createAuthLayout({ brand = null, children } = {}) {
  const mobileBrand = h(
    'div',
    { class: 'ps-auth-layout__mobile-brand' },
    h('img', {
      class: 'ps-auth-layout__mobile-logo',
      src: logoUrl,
      alt: '',
      width: 29,
      height: 38,
    }),
    h('p', { class: 'ps-auth-layout__mobile-name', text: 'PawSpace' }),
  );

  return h(
    'div',
    { class: `ps-auth-layout${brand ? '' : ' ps-auth-layout--centered'}` },
    h('a', { class: 'ps-skip-link', href: '#contenido' }, 'Saltar al contenido'),
    brand ? h('div', { class: 'ps-auth-layout__brand' }, brand) : null,
    h(
      'main',
      { id: 'contenido', class: 'ps-auth-layout__main' },
      createThemeToggle().element,
      mobileBrand,
      children,
    ),
  );
}
