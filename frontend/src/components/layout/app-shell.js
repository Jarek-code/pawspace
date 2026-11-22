import logoUrl from '@/assets/brand/pawspace-logo-light.svg';
import { createAccountMenu } from '@/components/layout/account-menu.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createBadge } from '@/components/primitives/badge.js';
import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createModal } from '@/components/primitives/modal.js';
import { createThemeToggle } from '@/components/primitives/theme-toggle.js';
import { h } from '@/lib/dom.js';

const NAV_ITEMS = [
  { label: 'Inicio', icon: 'home', path: '/inicio' },
  { label: 'Explorar', icon: 'compass', path: '/explorar' },
  { label: 'Notificaciones', icon: 'bell', path: '/notificaciones' },
  { label: 'Mensajes', icon: 'message-circle', path: '/mensajes' },
  { label: 'Perfil', icon: 'user', path: '/perfil' },
];

const BOTTOM_ITEMS = [
  { label: 'Inicio', icon: 'home', path: '/inicio' },
  { label: 'Explorar', icon: 'compass', path: '/explorar' },
  { fab: true, label: 'Crear' },
  { label: 'Avisos', icon: 'bell', path: '/notificaciones' },
  { label: 'Perfil', icon: 'user', path: '/perfil' },
];

/**
 * CMP-34 + CMP-33 + CMP-55 — Shell de la aplicación.
 * Sidebar (escritorio/tablet), top bar, riel (escritorio) y bottom nav (móvil).
 * Las columnas colapsan en orden de importancia: riel → sidebar → bottom nav.
 */
export function createAppShell({
  activePath = '/inicio',
  title = '',
  mobileTitle = '',
  subtitle = '',
  pet = null,
  account = null,
  notificationCount = 0,
  onCompose = null,
  onLogout = null,
  onSearch = null,
  backTo = '',
  hideBottomNav = false,
  layout = 'feed',
  container = false,
  className = '',
  rail = null,
  children = null,
} = {}) {
  const themeToggle = createThemeToggle().element;
  const topbarAccount = account ? createAccountMenu({ pet, account, onLogout }) : null;

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
    ariaLabel: 'Crear publicación',
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
    renderSidebarAccount(pet, account, onLogout),
  );

  const backButton = backTo
    ? h(
        'a',
        {
          class: 'ps-topbar__back',
          href: backTo,
          attrs: { 'aria-label': 'Volver' },
        },
        createIcon('arrow-left', { size: 22 }),
      )
    : null;

  let navSheet = null;

  const menuButton = h(
    'button',
    {
      class: 'ps-icon-button ps-topbar__menu',
      type: 'button',
      attrs: { 'aria-label': 'Menú', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' },
      onClick: () => openNavSheet(),
    },
    createIcon('menu', { size: 22 }),
  );

  function openNavSheet() {
    if (navSheet?.isOpen()) {
      return;
    }

    const modal = createModal({
      title: 'Menú',
      variant: 'sheet',
      onClose: () => {
        menuButton.setAttribute('aria-expanded', 'false');
        modal.element.remove();
        navSheet = null;
      },
    });

    const links = NAV_ITEMS.map((item, index) => {
      const isActive = item.path === activePath;
      const badge =
        item.icon === 'bell' && notificationCount > 0
          ? createBadge({ label: String(notificationCount) })
          : null;

      return h(
        'li',
        {},
        h(
          'a',
          {
            class: `ps-nav-sheet__item${isActive ? ' is-active' : ''}`,
            href: item.path,
            attrs: {
              'aria-current': isActive ? 'page' : null,
              'data-autofocus': index === 0 ? '' : null,
            },
            onClick: () => modal.close(),
          },
          h(
            'span',
            { class: 'ps-nav-sheet__icon', 'aria-hidden': 'true' },
            createIcon(item.icon, { size: 20 }),
          ),
          h('span', { class: 'ps-nav-sheet__label', text: item.label }),
          badge,
        ),
      );
    });

    const createAction = createButton({
      label: 'Crear publicación',
      fullWidth: true,
      iconLeft: createIcon('plus', { size: 18 }),
      onClick: () => {
        modal.close();
        onCompose?.();
      },
    });

    modal.body.append(
      h(
        'nav',
        { class: 'ps-nav-sheet', attrs: { 'aria-label': 'Navegación principal' } },
        h('ul', { class: 'ps-nav-sheet__list' }, links),
        h('div', { class: 'ps-nav-sheet__create' }, createAction.element),
      ),
    );

    document.body.append(modal.element);
    modal.open();
    navSheet = modal;
    menuButton.setAttribute('aria-expanded', 'true');
  }

  const topbar = h(
    'header',
    { class: `ps-topbar${backTo ? ' ps-topbar--nested' : ''}` },
    backButton,
    h('div', { class: 'ps-topbar__mobile-brand' }, brand.cloneNode(true)),
    h('span', { class: 'ps-topbar__mobile-title', text: mobileTitle || title }),
    h(
      'div',
      { class: 'ps-topbar__heading' },
      h('h1', { class: 'ps-topbar__title', text: title }),
      subtitle ? h('p', { class: 'ps-topbar__subtitle', text: subtitle }) : null,
    ),
    renderSearch(onSearch),
    h(
      'div',
      { class: 'ps-topbar__actions' },
      menuButton,
      h(
        'button',
        {
          class: 'ps-icon-button ps-topbar__search-toggle',
          type: 'button',
          attrs: { 'aria-label': 'Buscar' },
          onClick: () => onSearch?.(''),
        },
        createIcon('search', { size: 20 }),
      ),
      themeToggle,
      h(
        'a',
        {
          class: 'ps-icon-button ps-topbar__bell',
          href: '/notificaciones',
          attrs: {
            'aria-label':
              notificationCount > 0 ? `Avisos, ${notificationCount} sin leer` : 'Avisos',
          },
        },
        createIcon('bell', { size: 20 }),
        notificationCount > 0
          ? createBadge({
              label: String(notificationCount),
              className: 'ps-notification-count',
            })
          : null,
      ),
      topbarAccount ? h('div', { class: 'ps-topbar__account' }, topbarAccount.element) : null,
    ),
  );

  const content = h(
    'main',
    {
      id: 'contenido',
      class: ['ps-shell__content', container ? 'ps-shell__content--cq' : '']
        .filter(Boolean)
        .join(' '),
      tabindex: '-1',
    },
    children,
  );

  const railElement = h(
    'aside',
    { class: 'ps-rail', attrs: { 'aria-label': 'Panel lateral' } },
    rail,
  );

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
    {
      class: [
        'ps-app-shell',
        backTo ? 'ps-app-shell--nested' : '',
        hideBottomNav ? 'ps-app-shell--no-bottom' : '',
        layout === 'wide' ? 'ps-app-shell--wide' : '',
        className,
      ]
        .filter(Boolean)
        .join(' '),
    },
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

  const icon = h(
    'span',
    { class: 'ps-nav__icon', 'aria-hidden': 'true' },
    createIcon(item.icon, { size: 20 }),
  );
  const label = h('span', { class: 'ps-nav__label', text: item.label });

  let badgeElement = null;

  if (badge > 0) {
    badgeElement = createBadge({ label: String(badge) });
    badgeElement.dataset.notificationBadge = 'nav';
  }

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
    badgeElement,
  );

  return h('li', {}, link);
}

function renderSidebarPets(pet) {
  if (!pet) {
    return null;
  }

  const change = h(
    'button',
    {
      class: 'ps-sidebar__pets-link',
      type: 'button',
      attrs: { 'aria-disabled': 'true', title: 'Próximamente' },
    },
    '+ Agregar mascota',
  );

  return h(
    'div',
    { class: 'ps-sidebar__pets' },
    h('span', { class: 'ps-sidebar__section-label', text: 'Tus mascotas' }),
    h(
      'div',
      { class: 'ps-sidebar__pet' },
      createAvatar({ name: pet.nombre, src: pet.avatar, size: 'sm' }),
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

function renderSidebarAccount(pet, account, onLogout) {
  if (!account) {
    return null;
  }

  const menu = createAccountMenu({ pet, account, onLogout });

  return h(
    'div',
    { class: 'ps-sidebar__account' },
    menu.element,
    h(
      'div',
      { class: 'ps-sidebar__account-info' },
      h('span', { class: 'ps-sidebar__account-name', text: account.nombre }),
      h('span', { class: 'ps-sidebar__account-email', text: account.email }),
    ),
  );
}

function renderSearch(onSearch) {
  const input = h('input', {
    class: 'ps-topbar__search-input',
    type: 'search',
    placeholder: 'Buscar',
    attrs: { 'aria-label': 'Buscar en PawSpace' },
  });

  const form = h(
    'form',
    {
      class: 'ps-topbar__search',
      role: 'search',
      onSubmit: (event) => {
        event.preventDefault();
        onSearch?.(input.value.trim());
      },
    },
    h(
      'span',
      { class: 'ps-topbar__search-icon', 'aria-hidden': 'true' },
      createIcon('search', { size: 18 }),
    ),
    input,
  );

  return form;
}

function renderBottomItem(item, activePath, onCompose) {
  if (item.fab) {
    const fab = h(
      'button',
      {
        class: 'ps-bottom-nav__fab',
        type: 'button',
        attrs: { 'aria-label': 'Crear publicación' },
        onClick: onCompose,
      },
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
    h(
      'span',
      { class: 'ps-bottom-nav__icon', 'aria-hidden': 'true' },
      createIcon(item.icon, { size: 24 }),
    ),
    h('span', { class: 'ps-bottom-nav__label', text: item.label }),
  );

  return h('li', { class: 'ps-bottom-nav__slot' }, link);
}

/**
 * Actualiza el contador de avisos de la sidebar y del topbar sin re-renderizar
 * la página completa. Se usa al marcar avisos como leídos.
 */
export function setShellNotificationCount(shell, count) {
  const normalized = Math.max(0, Number(count || 0));
  const navItem = shell.querySelector('.ps-nav__item[href="/notificaciones"]');

  if (navItem) {
    navItem.querySelector('[data-notification-badge="nav"]')?.remove();

    if (normalized > 0) {
      const badge = createBadge({ label: String(normalized) });
      badge.dataset.notificationBadge = 'nav';
      navItem.append(badge);
    }
  }

  const bell = shell.querySelector('.ps-topbar__bell');

  if (bell) {
    bell.querySelector('.ps-notification-count')?.remove();
    bell.setAttribute('aria-label', normalized > 0 ? `Avisos, ${normalized} sin leer` : 'Avisos');

    if (normalized > 0) {
      bell.append(createBadge({ label: String(normalized), className: 'ps-notification-count' }));
    }
  }
}
