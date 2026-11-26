import { createAvatar } from '@/components/primitives/avatar.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createThemeToggle } from '@/components/primitives/theme-toggle.js';
import { h } from '@/lib/dom.js';
import { isAdmin } from '@/services/auth.js';

let menuCounter = 0;

function isMobileSheet() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 767px) and (orientation: portrait)').matches
  );
}

/**
 * CMP-109 — AccountMenu.
 * Burbuja de cuenta que abre un menú con la mascota activa, la persona y los
 * accesos a configuración, ayuda y cierre de sesión. En escritorio y tablet es
 * un popover anclado; en móvil vertical es una hoja inferior con overlay.
 */
export function createAccountMenu({
  pet = null,
  account = null,
  onLogout = null,
  triggerClass = '',
} = {}) {
  menuCounter += 1;
  const menuId = `ps-account-menu-${menuCounter}`;
  const label = 'Menú de cuenta';

  const trigger = h(
    'button',
    {
      class: ['ps-account-menu__trigger', triggerClass].filter(Boolean).join(' '),
      type: 'button',
      attrs: {
        'aria-label': label,
        'aria-haspopup': 'menu',
        'aria-expanded': 'false',
        'aria-controls': menuId,
      },
    },
    createAvatar({
      name: account?.nombre || pet?.nombre || '',
      src: account?.avatar || null,
      size: 'sm',
    }),
  );

  const identity = h(
    'div',
    { class: 'ps-account-menu__identity' },
    createAvatar({
      name: pet?.nombre || account?.nombre || '',
      src: pet?.avatar || null,
      size: 'lg',
    }),
    h(
      'div',
      { class: 'ps-account-menu__identity-copy' },
      h('span', { class: 'ps-account-menu__pet-name', text: pet?.nombre || account?.nombre || '' }),
      pet?.handle ? h('span', { class: 'ps-account-menu__pet-handle', text: pet.handle }) : null,
      h('span', { class: 'ps-account-menu__person', text: account?.nombre || '' }),
      account?.email ? h('span', { class: 'ps-account-menu__email', text: account.email }) : null,
    ),
  );

  const adminItem = isAdmin()
    ? h(
        'a',
        {
          class: 'ps-account-menu__item',
          href: '/admin',
          attrs: { role: 'menuitem' },
          onClick: () => close({ returnFocus: false }),
        },
        createIcon('layout-dashboard', { size: 20 }),
        h('span', { text: 'Panel de administración' }),
      )
    : null;

  const configItem = h(
    'a',
    {
      class: 'ps-account-menu__item',
      href: '/ajustes/cuenta',
      attrs: { role: 'menuitem' },
      onClick: () => close({ returnFocus: false }),
    },
    createIcon('sliders-horizontal', { size: 20 }),
    h('span', { text: 'Configuración y privacidad' }),
  );

  const helpItem = h(
    'a',
    {
      class: 'ps-account-menu__item',
      href: '/ayuda',
      attrs: { role: 'menuitem' },
      onClick: () => close({ returnFocus: false }),
    },
    createIcon('circle-help', { size: 20 }),
    h('span', { text: 'Ayuda y soporte' }),
  );

  const themeToggle = createThemeToggle();
  themeToggle.element.classList.add('ps-account-menu__theme-toggle');
  themeToggle.element.setAttribute('role', 'menuitemcheckbox');

  const themeItem = h(
    'div',
    { class: 'ps-account-menu__theme' },
    h('span', { class: 'ps-account-menu__theme-label', text: 'Modo oscuro' }),
    themeToggle.element,
  );

  const logoutItem = h(
    'button',
    {
      class: 'ps-account-menu__item ps-account-menu__item--danger',
      type: 'button',
      attrs: { role: 'menuitem' },
      onClick: () => {
        close({ returnFocus: false });
        onLogout?.();
      },
    },
    createIcon('log-out', { size: 20 }),
    h('span', { text: 'Cerrar sesión' }),
  );

  const menu = h(
    'div',
    {
      class: 'ps-account-menu__options',
      role: 'menu',
      id: menuId,
      attrs: { 'aria-label': 'Opciones de cuenta' },
    },
    h(
      'ul',
      { class: 'ps-account-menu__list', attrs: { role: 'none' } },
      adminItem ? h('li', { attrs: { role: 'none' } }, adminItem) : null,
      h('li', { attrs: { role: 'none' } }, configItem),
      h('li', { attrs: { role: 'none' } }, helpItem),
      h('li', { attrs: { role: 'none' } }, themeItem),
      h('li', { class: 'ps-account-menu__divider', attrs: { role: 'none' } }),
      h('li', { attrs: { role: 'none' } }, logoutItem),
    ),
  );

  const panel = h(
    'div',
    { class: 'ps-account-menu__panel' },
    h('span', { class: 'ps-account-menu__handle', 'aria-hidden': 'true' }),
    identity,
    menu,
  );

  const backdrop = h('div', { class: 'ps-account-menu__backdrop', 'aria-hidden': 'true' });

  const element = h('div', { class: 'ps-account-menu' }, trigger, backdrop, panel);

  let isOpen = false;
  let previousOverflow = '';
  let lastTrigger = trigger;
  const extraTriggers = [];

  function triggersContain(node) {
    return trigger.contains(node) || extraTriggers.some((item) => item.contains(node));
  }

  function syncExpanded(next) {
    for (const node of element.ownerDocument.querySelectorAll(`[aria-controls="${menuId}"]`)) {
      node.setAttribute('aria-expanded', String(next));
    }
  }

  function bindTrigger(node) {
    if (!node || extraTriggers.includes(node)) {
      return;
    }

    extraTriggers.push(node);
    node.addEventListener('click', () => {
      lastTrigger = node;
      if (isOpen) {
        close();
      } else {
        open();
      }
    });
  }

  function menuItems() {
    return Array.from(
      menu.querySelectorAll('.ps-account-menu__item, .ps-account-menu__theme-toggle'),
    );
  }

  function positionPanel() {
    const rect = trigger.getBoundingClientRect();
    const gap = 8;
    const width = panel.offsetWidth || 300;

    panel.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
    panel.style.bottom = `${Math.max(8, window.innerHeight - rect.top + gap)}px`;
  }

  function open() {
    if (isOpen) {
      return;
    }

    isOpen = true;
    themeToggle.sync();
    const sheet = isMobileSheet();

    if (sheet) {
      panel.classList.add('is-sheet');
      backdrop.classList.add('is-sheet');
    }

    panel.classList.add('is-open');
    backdrop.classList.add('is-open');
    syncExpanded(true);

    document.body.append(backdrop, panel);

    if (sheet) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      positionPanel();
    }

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onDocumentKeyDown);
    window.addEventListener('resize', onViewportChange);

    if (!sheet) {
      window.addEventListener('scroll', onViewportChange, true);
    }

    window.addEventListener('popstate', onPopState);

    window.requestAnimationFrame(() => menuItems()[0]?.focus({ preventScroll: true }));
  }

  function close({ returnFocus = true } = {}) {
    if (!isOpen) {
      return;
    }

    isOpen = false;
    panel.classList.remove('is-open', 'is-sheet');
    backdrop.classList.remove('is-open', 'is-sheet');
    syncExpanded(false);
    document.body.style.overflow = previousOverflow;
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('keydown', onDocumentKeyDown);
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('scroll', onViewportChange, true);
    window.removeEventListener('popstate', onPopState);
    panel.style.removeProperty('left');
    panel.style.removeProperty('bottom');
    element.append(backdrop, panel);

    if (returnFocus) {
      lastTrigger.focus({ preventScroll: true });
    }
  }

  function onPointerDown(event) {
    if (!panel.contains(event.target) && !triggersContain(event.target)) {
      close({ returnFocus: false });
    }
  }

  function onDocumentKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  }

  function onViewportChange() {
    close({ returnFocus: false });
  }

  function onPopState() {
    close({ returnFocus: false });
  }

  function onPanelKeyDown(event) {
    const items = menuItems();
    const index = items.indexOf(document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (event.key === 'Tab') {
      close({ returnFocus: false });
    }
  }

  trigger.addEventListener('click', () => {
    lastTrigger = trigger;
    if (isOpen) {
      close();
    } else {
      open();
    }
  });
  panel.addEventListener('keydown', onPanelKeyDown);

  return { element, trigger, menuId, open, close, bindTrigger };
}
