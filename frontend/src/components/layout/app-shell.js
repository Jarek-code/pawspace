import logoUrl from '@/assets/brand/pawspace-logo-light.svg';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createBadge } from '@/components/primitives/badge.js';
import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createThemeToggle } from '@/components/primitives/theme-toggle.js';
import { h } from '@/lib/dom.js';

const NAV_ITEMS = [
  { label: 'Inicio', icon: 'home', path: '/inicio' },
  { label: 'Explorar', icon: 'compass', path: '/explorar', disabled: true },
  { label: 'Notificaciones', icon: 'bell', path: '/notificaciones', disabled: true },
  { label: 'Mensajes', icon: 'message-circle', path: '/mensajes', disabled: true },
  { label: 'Perfil', icon: 'user', path: '/perfil', disabled: true },
];

const BOTTOM_ITEMS = [
  { label: 'Inicio', icon: 'home', path: '/inicio' },
  { label: 'Explorar', icon: 'compass', path: '/explorar', disabled: true },
  { fab: true, label: 'Crear' },
  { label: 'Avisos', icon: 'bell', path: '/notificaciones', disabled: true },
  { label: 'Perfil', icon: 'user', path: '/perfil', disabled: true },
];

/**
 * CMP-34 + CMP-33 + CMP-55 — Shell de la aplicación.
 * Sidebar (escritorio/tablet), top bar, riel (escritorio) y bottom nav (móvil).
 * Las columnas colapsan en orden de importancia: riel → sidebar → bottom nav.
 */
export function createAppShell({
  activePath = '/inicio',
  title = '',
  subtitle = '',
  pet = null,
  account = null,
  notificationCount = 0,
  onCompose = null,
  onLogout = null,
  rail = null,
  children = null,
} = {}) {
  const themeToggle = createThemeToggle().element;

  const brand = h(
    'div',
    { class: 'ps-shell__brand' },
    h('img', { class: 'ps-shell__logo', src: logoUrl, alt: '', width: 32, height: 42 }),
    h('span', { class: 'ps-shell__wordmark', text: 'PawSpace' }),
  );

  const navList = h(
    'nav',
    { class: 'ps-nav', attrs: { 'aria-label': 'Navegación principal' } },
    h(
      'ul',
      { class: 'ps-nav__list' },
      NAV_ITEMS.map((item) => renderNavItem(item, activePath, notificationCount)),
    ),
  );

  const create = createButton({
    label: 'Crear publicación',
    variant: 'primary',
    fullWidth: true,
    iconLeft: createIcon('plus', { size: 18 }),
    onClick: onCompose,
  });

  const sidebar = h(
    'aside',
    { class: 'ps-sidebar', attrs: { 'aria-label': 'Barra lateral' } },
    brand,
    navList,
    h('div', { class: 'ps-sidebar__create' }, create.element),
    renderSidebarPets(pet),
    renderSidebarAccount(account, onLogout),
  );

  const topbar = h(
    'header',
    { class: 'ps-topbar' },
    h('div', { class: 'ps-topbar__mobile-brand' }, brand.cloneNode(true)),
    h(
      'div',
      { class: 'ps-topbar__heading' },
      h('h1', { class: 'ps-topbar__title', text: title }),
      subtitle ? h('p', { class: 'ps-topbar__subtitle', text: subtitle }) : null,
    ),
    renderSearch(),
    h(
      'div',
      { class: 'ps-topbar__actions' },
      themeToggle,
      h(
        'button',
        {
          class: 'ps-icon-button ps-topbar__bell',
          type: 'button',
          attrs: {
            'aria-label': notificationCount > 0 ? `Avisos, ${notificationCount} sin leer` : 'Avisos',
          },
        },
        createIcon('bell', { size: 20 }),
        notificationCount > 0 ? createBadge({ label: String(notificationCount) }) : null,
      ),
    ),
  );

  const content = h('main', { id: 'contenido', class: 'ps-shell__content', tabindex: '-1' }, children);

  const railElement = h('aside', { class: 'ps-rail', attrs: { 'aria-label': 'Panel lateral' } }, rail);

  const bottomNav = h(
    'nav',
    { class: 'ps-bottom-nav', attrs: { 'aria-label': 'Navegación principal' } },
    h(
      'ul',
      { class: 'ps-bottom-nav__list' },
      BOTTOM_ITEMS.map((item) => renderBottomItem(item, activePath, onCompose)),
    ),
  );

  return h(
    'div',
    { class: 'ps-app-shell' },
    h('a', { class: 'ps-skip-link', href: '#contenido' }, 'Saltar al contenido'),
    sidebar,
    h('div', { class: 'ps-shell__main' }, topbar, content),
    railElement,
    bottomNav,
  );
}

function renderNavItem(item, activePath, notificationCount) {
  const isActive = item.path === activePath;
  const badge = item.icon === 'bell' && notificationCount > 0 ? notificationCount : 0;

  const icon = h('span', { class: 'ps-nav__icon', 'aria-hidden': 'true' }, createIcon(item.icon, { size: 20 }));
  const label = h('span', { class: 'ps-nav__label', text: item.label });

  const link = h(
    item.disabled ? 'button' : 'a',
    {
      class: `ps-nav__item${isActive ? ' is-active' : ''}`,
      ...(item.disabled
        ? { type: 'button', attrs: { 'aria-disabled': 'true', title: 'Próximamente' } }
        : { href: item.path, attrs: { 'aria-current': isActive ? 'page' : null } }),
    },
    icon,
    label,
    badge > 0 ? createBadge({ label: String(badge) }) : null,
  );

  return h('li', {}, link);
}

function renderSidebarPets(pet) {
  if (!pet) {
    return null;
  }

  const change = h(
    'button',
    { class: 'ps-sidebar__pets-link', type: 'button', attrs: { 'aria-disabled': 'true', title: 'Próximamente' } },
    '+ Agregar mascota',
  );

  return h(
    'div',
    { class: 'ps-sidebar__pets' },
    h('span', { class: 'ps-sidebar__section-label', text: 'Tus mascotas' }),
    h(
      'div',
      { class: 'ps-sidebar__pet' },
      createAvatar({ name: pet.nombre, size: 'sm' }),
      h(
        'div',
        { class: 'ps-sidebar__pet-info' },
        h('span', { class: 'ps-sidebar__pet-name', text: pet.nombre }),
        h('span', { class: 'ps-sidebar__pet-handle', text: pet.handle }),
      ),
    ),
    change,
  );
}

function renderSidebarAccount(account, onLogout) {
  if (!account) {
    return null;
  }

  return h(
    'div',
    { class: 'ps-sidebar__account' },
    createAvatar({ name: account.nombre, size: 'sm' }),
    h(
      'div',
      { class: 'ps-sidebar__account-info' },
      h('span', { class: 'ps-sidebar__account-name', text: account.nombre }),
      h('span', { class: 'ps-sidebar__account-email', text: account.email }),
    ),
    h(
      'button',
      {
        class: 'ps-icon-button ps-sidebar__logout',
        type: 'button',
        attrs: { 'aria-label': 'Cerrar sesión' },
        onClick: onLogout,
      },
      createIcon('log-out', { size: 20 }),
    ),
  );
}

function renderSearch() {
  return h(
    'div',
    { class: 'ps-topbar__search', role: 'search' },
    h('span', { class: 'ps-topbar__search-icon', 'aria-hidden': 'true' }, createIcon('search', { size: 18 })),
    h('input', {
      class: 'ps-topbar__search-input',
      type: 'search',
      placeholder: 'Buscar',
      attrs: { 'aria-label': 'Buscar en PawSpace' },
    }),
  );
}

function renderBottomItem(item, activePath, onCompose) {
  if (item.fab) {
    const fab = h(
      'button',
      { class: 'ps-bottom-nav__fab', type: 'button', attrs: { 'aria-label': 'Crear publicación' }, onClick: onCompose },
      createIcon('plus', { size: 24 }),
    );
    return h('li', { class: 'ps-bottom-nav__item ps-bottom-nav__item--fab' }, fab);
  }

  const isActive = item.path === activePath;

  const link = h(
    item.disabled ? 'button' : 'a',
    {
      class: `ps-bottom-nav__item${isActive ? ' is-active' : ''}`,
      ...(item.disabled
        ? { type: 'button', attrs: { 'aria-disabled': 'true', title: 'Próximamente' } }
        : { href: item.path, attrs: { 'aria-current': isActive ? 'page' : null } }),
    },
    h('span', { class: 'ps-bottom-nav__icon', 'aria-hidden': 'true' }, createIcon(item.icon, { size: 24 })),
    h('span', { class: 'ps-bottom-nav__label', text: item.label }),
  );

  return h('li', { class: 'ps-bottom-nav__slot' }, link);
}
