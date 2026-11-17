import { h } from '@/lib/dom.js';

const SECTIONS = [
  { value: 'cuenta', label: 'Cuenta', href: '/ajustes/cuenta' },
  { value: 'privacidad', label: 'Privacidad', href: '/ajustes/privacidad' },
  { value: 'seguridad', label: 'Seguridad', href: '/ajustes/seguridad' },
];

/**
 * CMP-83 — SettingsNav.
 * Las tres secciones se enlazan por URL para permitir enlaces directos y
 * conservar la sección al volver. La activa se marca con aria-current y
 * subrayado, no solo con color.
 */
export function createSettingsNav({ active = 'cuenta' } = {}) {
  const links = SECTIONS.map((section) =>
    h(
      'a',
      {
        class: `ps-settings-nav__item${section.value === active ? ' is-active' : ''}`,
        href: section.href,
        attrs: { 'aria-current': section.value === active ? 'page' : null },
      },
      section.label,
    ),
  );

  return h(
    'nav',
    { class: 'ps-settings-nav', attrs: { 'aria-label': 'Secciones de configuración' } },
    ...links,
  );
}
