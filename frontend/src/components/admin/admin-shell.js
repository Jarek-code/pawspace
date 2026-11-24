import logoUrl from '@/assets/brand/pawspace-logo-light.svg';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createBadge } from '@/components/primitives/badge.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createThemeToggle } from '@/components/primitives/theme-toggle.js';
import { h } from '@/lib/dom.js';

export const ADMIN_SECTIONS = [
  { key: 'resumen', label: 'Resumen', icon: 'layout-dashboard', path: '/admin' },
  { key: 'reportes', label: 'Reportes', icon: 'flag', path: '/admin/reportes', badge: 'reportes' },
  {
    key: 'apelaciones',
    label: 'Apelaciones',
    icon: 'scale',
    path: '/admin/apelaciones',
    badge: 'apelaciones',
  },
  { key: 'soporte', label: 'Soporte', icon: 'headset', path: '/admin/soporte', badge: 'soporte' },
  { key: 'ayuda', label: 'Ayuda', icon: 'book-open', path: '/admin/ayuda' },
  { key: 'usuarios', label: 'Usuarios', icon: 'users', path: '/admin/usuarios' },
];

/**
 * CMP-95 — AdminShell.
 * Shell propio de administración: sin mascota activa, compositor ni riel del
 * feed. Sidebar forest.900 de 220 px en escritorio; cabecera de 64 px y tira
 * horizontal de secciones en móvil. El contenido conserva una sola acción
 * principal por pantalla.
 */
export function createAdminShell({
  active = 'resumen',
  title = 'Administración',
  subtitle = 'Reportes, soporte y contenido de PawSpace.',
  account = null,
  badges = {},
  system = null,
  onLogout = null,
  onSearch = null,
  children = null,
} = {}) {
  const badgeSlots = new Map();

  const brand = h(
    'a',
    { class: 'ps-admin__brand', href: '/admin' },
    h('img', { class: 'ps-admin__logo', src: logoUrl, alt: '', width: 28, height: 38 }),
    h(
      'span',
      { class: 'ps-admin__brand-text' },
      h('span', { class: 'ps-admin__wordmark', text: 'PawSpace' }),
      h('span', { class: 'ps-admin__brand-role', text: 'ADMINISTRACIÓN' }),
    ),
  );

  const navList = h(
    'ul',
    { class: 'ps-admin__nav-list' },
    ADMIN_SECTIONS.map((item) => {
      const badgeSlot = item.badge ? h('span', { class: 'ps-admin__nav-badge' }) : null;

      if (item.badge) {
        badgeSlots.set(item.badge, badgeSlot);
      }

      return h(
        'li',
        {},
        h(
          'a',
          {
            class: `ps-admin__nav-item${item.key === active ? ' is-active' : ''}`,
            href: item.path,
            attrs: { 'aria-current': item.key === active ? 'page' : null },
          },
          h(
            'span',
            { class: 'ps-admin__nav-icon', 'aria-hidden': 'true' },
            createIcon(item.icon, { size: 20 }),
          ),
          h('span', { class: 'ps-admin__nav-label', text: item.label }),
          badgeSlot,
        ),
      );
    }),
  );

  const systemTitle = h('span', {
    class: 'ps-admin__system-title',
    text: system?.title || 'Consultando estado…',
  });
  const systemMeta = h('span', {
    class: 'ps-admin__system-meta',
    text: system ? `Última revisión: ${system.checked}` : 'Última revisión: —',
  });

  const sidebar = h(
    'aside',
    { class: 'ps-admin__sidebar' },
    brand,
    h(
      'nav',
      { class: 'ps-admin__nav', attrs: { 'aria-label': 'Navegación de administración' } },
      navList,
    ),
    h(
      'div',
      { class: 'ps-admin__system' },
      h('span', { class: 'ps-admin__system-label', text: 'SISTEMA' }),
      h(
        'div',
        { class: 'ps-admin__system-row' },
        h(
          'span',
          { class: 'ps-admin__system-icon', 'aria-hidden': 'true' },
          createIcon('circle-check', { size: 20 }),
        ),
        h('span', { class: 'ps-admin__system-copy' }, systemTitle, systemMeta),
      ),
    ),
    account
      ? h(
          'div',
          { class: 'ps-admin__account' },
          createAvatar({ name: account.nombre, size: 'sm' }),
          h(
            'span',
            { class: 'ps-admin__account-info' },
            h('span', { class: 'ps-admin__account-name', text: account.nombre }),
            h('span', { class: 'ps-admin__account-role', text: account.rol || 'Administradora' }),
          ),
          h(
            'button',
            {
              class: 'ps-admin__account-logout',
              type: 'button',
              attrs: { 'aria-label': 'Cerrar sesión' },
              onClick: onLogout,
            },
            createIcon('log-out', { size: 18 }),
          ),
        )
      : null,
  );

  const searchInput = h('input', {
    class: 'ps-admin__search-input',
    type: 'search',
    placeholder: 'Buscar',
    attrs: { 'aria-label': 'Buscar en administración' },
  });

  const searchForm = h(
    'form',
    {
      class: 'ps-admin__search',
      role: 'search',
      onSubmit: (event) => {
        event.preventDefault();
        onSearch?.(searchInput.value.trim());
      },
    },
    h(
      'span',
      { class: 'ps-admin__search-icon', 'aria-hidden': 'true' },
      createIcon('search', { size: 18 }),
    ),
    searchInput,
  );

  const topbar = h(
    'header',
    { class: 'ps-admin__topbar' },
    h(
      'div',
      { class: 'ps-admin__heading' },
      h('h1', { class: 'ps-admin__title', text: title }),
      subtitle ? h('p', { class: 'ps-admin__subtitle', text: subtitle }) : null,
    ),
    h(
      'div',
      { class: 'ps-admin__topbar-actions' },
      searchForm,
      renderAccountMenu({ account, onLogout }),
    ),
  );

  const mobileHeader = h(
    'header',
    { class: 'ps-admin__mobile-header' },
    h(
      'a',
      { class: 'ps-admin__mobile-brand', href: '/admin' },
      h('img', { class: 'ps-admin__mobile-logo', src: logoUrl, alt: '', width: 24, height: 32 }),
      h(
        'span',
        { class: 'ps-admin__mobile-brand-text' },
        h('span', { class: 'ps-admin__mobile-wordmark', text: 'PawSpace' }),
        h('span', { class: 'ps-admin__mobile-role', text: 'ADMIN' }),
      ),
    ),
    renderAccountMenu({ account, onLogout, compact: true }),
  );

  const mobileNav = h(
    'nav',
    { class: 'ps-admin__mobile-nav', attrs: { 'aria-label': 'Secciones de administración' } },
    h(
      'ul',
      { class: 'ps-admin__mobile-nav-list' },
      ADMIN_SECTIONS.map((item) =>
        h(
          'li',
          {},
          h('a', {
            class: `ps-admin__mobile-nav-item${item.key === active ? ' is-active' : ''}`,
            href: item.path,
            text: item.label,
            attrs: { 'aria-current': item.key === active ? 'page' : null },
          }),
        ),
      ),
    ),
  );

  const content = h(
    'main',
    { id: 'contenido', class: 'ps-admin__content', tabindex: '-1' },
    h(
      'div',
      { class: 'ps-admin__page-heading' },
      h('h1', { class: 'ps-admin__page-title', text: title }),
      subtitle ? h('p', { class: 'ps-admin__page-subtitle', text: subtitle }) : null,
    ),
    h('div', { class: 'ps-admin__content-body' }, children),
  );

  const element = h(
    'div',
    { class: 'ps-admin' },
    h('a', { class: 'ps-skip-link', href: '#contenido' }, 'Saltar al contenido'),
    sidebar,
    h('div', { class: 'ps-admin__main' }, topbar, mobileHeader, mobileNav, content),
  );

  function syncBadges(next = {}) {
    for (const [key, slot] of badgeSlots) {
      const value = Number(next[key] || 0);
      slot.replaceChildren(
        value > 0
          ? createBadge({
              label: String(value),
              variant: 'primary',
              className: 'ps-admin__badge',
            })
          : '',
      );
    }
  }

  function syncSystem(next) {
    systemTitle.textContent = next?.title || 'Todo operativo';
    systemMeta.textContent = next ? `Última revisión: ${next.checked}` : 'Última revisión: —';
  }

  syncBadges(badges);
  syncSystem(system);

  element.updateAdminShell = ({ badges: nextBadges, system: nextSystem } = {}) => {
    if (nextBadges) {
      syncBadges(nextBadges);
    }

    if (nextSystem) {
      syncSystem(nextSystem);
    }
  };

  return element;
}

function renderAccountMenu({ account = null, onLogout = null, compact = false } = {}) {
  const themeToggle = createThemeToggle().element;
  const name = account?.nombre || 'Administración';

  return h(
    'details',
    { class: `ps-admin__account-menu${compact ? ' ps-admin__account-menu--compact' : ''}` },
    h(
      'summary',
      {
        class: 'ps-admin__account-summary',
        attrs: { 'aria-label': `Cuenta de ${name}` },
      },
      createAvatar({ name, size: compact ? 'xs' : 'sm' }),
    ),
    h(
      'div',
      { class: 'ps-admin__account-panel' },
      h(
        'div',
        { class: 'ps-admin__account-panel-head' },
        createAvatar({ name, size: 'md' }),
        h(
          'span',
          { class: 'ps-admin__account-panel-copy' },
          h('span', { class: 'ps-admin__account-panel-name', text: name }),
          h('span', {
            class: 'ps-admin__account-panel-email',
            text: account?.email || 'Sesión de administración',
          }),
          h('span', {
            class: 'ps-admin__account-panel-role',
            text: account?.rol || 'Administradora',
          }),
        ),
      ),
      h(
        'div',
        { class: 'ps-admin__account-links' },
        h(
          'a',
          { class: 'ps-admin__account-link', href: '/perfil' },
          createIcon('user', { size: 18 }),
          h('span', { text: 'Ver mi perfil' }),
        ),
        h(
          'a',
          { class: 'ps-admin__account-link', href: '/inicio' },
          createIcon('home', { size: 18 }),
          h('span', { text: 'Ir a la app' }),
        ),
      ),
      h(
        'div',
        { class: 'ps-admin__account-panel-row' },
        h('span', { class: 'ps-admin__account-panel-label', text: 'Tema' }),
        themeToggle,
      ),
      h(
        'button',
        {
          class: 'ps-admin__account-panel-logout',
          type: 'button',
          onClick: onLogout,
        },
        createIcon('log-out', { size: 18 }),
        h('span', { text: 'Cerrar sesión' }),
      ),
    ),
  );
}
