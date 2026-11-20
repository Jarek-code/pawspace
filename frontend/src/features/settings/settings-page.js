import { createAppShell } from '@/components/layout/app-shell.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { h } from '@/lib/dom.js';
import { currentSession, logout } from '@/services/auth.js';
import { getCurrentPet, listPets } from '@/services/pets.js';
import { loadSettings } from '@/services/settings.js';
import { createSettingsNav } from '@/components/settings/settings-nav.js';
import { createSettingsHelpCard } from '@/components/settings/settings-rail.js';
import { accountFromEmail, normalizePet } from '@/features/feed/feed-view.js';

/**
 * Shell compartido de D28–D30 / M21–M23.
 * Carga los ajustes una vez y permite refrescar contenido y riel tras cada
 * mutación, sin volver a montar la página.
 */
export function mountSettingsPage({
  active = 'cuenta',
  subtitle = 'Cuenta, privacidad y seguridad',
  router,
  createContent,
  createRail,
} = {}) {
  const stored = getCurrentPet() || listPets(currentSession().email)[0] || null;
  const pet = normalizePet(stored);
  const account = accountFromEmail(currentSession().email);

  const shell = createAppShell({
    activePath: '/perfil',
    title: 'Configuración',
    mobileTitle: 'Ajustes',
    subtitle,
    pet,
    account,
    backTo: '/perfil',
    hideBottomNav: true,
    notificationCount: 3,
    onSearch: (query) => goSearch(router, query),
    onLogout: () => {
      logout();
      router.navigate('/', { replace: true });
    },
    rail: h('span', { class: 'ps-sr-only', text: 'Cargando configuración…' }),
    children: createSettingsLoading(),
  });

  const content = shell.querySelector('.ps-shell__content');
  const rail = shell.querySelector('.ps-rail');
  let current = null;

  function paint() {
    const nav = createSettingsNav({ active });
    const body = createContent({
      data: current,
      refresh,
      router,
      onDeleted: () => {
        logout();
        router.navigate('/', { replace: true });
      },
      onLoggedOut: () => {
        logout();
        router.navigate('/', { replace: true });
      },
    });

    const helpMobile = h('div', { class: 'ps-settings-help-mobile' }, createSettingsHelpCard());

    content.replaceChildren(nav, body, helpMobile);

    const cards = createRail({
      data: current,
      refresh,
      onDeleted: () => {
        logout();
        router.navigate('/', { replace: true });
      },
    });

    rail.replaceChildren(...cards);
  }

  function refresh() {
    return loadSettings().then((data) => {
      current = { ...data, mascotaActiva: pet };
      paint();
      return current;
    });
  }

  loadSettings()
    .then((data) => {
      current = { ...data, mascotaActiva: pet };
      paint();
    })
    .catch(() => {
      rail.replaceChildren();
      content.replaceChildren(
        createEmptyState({
          icon: 'alert',
          title: 'No pudimos cargar tu configuración',
          body: 'Revisa tu conexión e intenta de nuevo.',
          action: createButton({
            label: 'Reintentar',
            variant: 'secondary',
            onClick: () => router.navigate(`/ajustes/${active}`, { replace: true }),
          }).element,
        }),
      );
    });

  return shell;
}

function createSettingsLoading() {
  return h(
    'div',
    { class: 'ps-settings-loading', attrs: { role: 'status', 'aria-live': 'polite' } },
    h('span', { class: 'ps-sr-only', text: 'Cargando configuración…' }),
  );
}

function goSearch(router, query) {
  const clean = String(query || '').trim();
  router.navigate(clean ? `/buscar?q=${encodeURIComponent(clean)}` : '/buscar');
}
