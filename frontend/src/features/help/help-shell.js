import { createAppShell } from '@/components/layout/app-shell.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createModal } from '@/components/primitives/modal.js';
import { currentSession, logout } from '@/services/auth.js';
import { getCurrentPet, listPets } from '@/services/pets.js';
import { h } from '@/lib/dom.js';
import { normalizePet, accountFromEmail } from '@/features/feed/feed-view.js';

/**
 * Shell compartido de D31–D33 / M24–M26.
 * La ayuda es una vista anidada de la cuenta: sidebar con Perfil activo,
 * topbar con búsqueda global y sin bottom nav en móvil.
 */
export function mountHelpShell({ router, title, mobileTitle, subtitle, backTo = '' } = {}) {
  const pet = normalizePet(getCurrentPet() || listPets(currentSession().email)[0] || null);
  const account = accountFromEmail(currentSession().email);

  const shell = createAppShell({
    activePath: '/perfil',
    title,
    mobileTitle,
    subtitle,
    pet,
    account,
    backTo,
    hideBottomNav: true,
    notificationCount: 3,
    onCompose: () => router.navigate('/publicar'),
    onSearch: (query) => goSearch(router, query),
    onLogout: () => {
      logout();
      router.navigate('/', { replace: true });
    },
    rail: h('span', { class: 'ps-sr-only', text: 'Cargando ayuda…' }),
    children: createHelpLoading(),
  });

  return {
    shell,
    pet,
    account,
    content: shell.querySelector('.ps-shell__content'),
    rail: shell.querySelector('.ps-rail'),
    subtitle: shell.querySelector('.ps-topbar__subtitle'),
  };
}

export function createHelpLoading() {
  return h(
    'div',
    { class: 'ps-help-loading', attrs: { role: 'status', 'aria-live': 'polite' } },
    h('span', { class: 'ps-sr-only', text: 'Cargando ayuda…' }),
    h('span', { class: 'ps-help-loading__line ps-help-loading__line--title' }),
    h('span', { class: 'ps-help-loading__line' }),
    h('span', { class: 'ps-help-loading__line ps-help-loading__line--short' }),
    h('span', { class: 'ps-help-loading__card' }),
    h('span', { class: 'ps-help-loading__card' }),
  );
}

export function createHelpError({ title, body, onRetry } = {}) {
  return createEmptyState({
    icon: 'alert',
    title,
    body,
    action: createButton({
      label: 'Reintentar',
      variant: 'secondary',
      onClick: onRetry,
    }).element,
  });
}

export function createHelpBack({ href, label = 'Centro de ayuda' } = {}) {
  return h('a', { class: 'ps-help-back', href }, createIcon('arrow-left', { size: 18 }), label);
}

export function goSearch(router, query) {
  const clean = String(query || '').trim();
  router.navigate(clean ? `/buscar?q=${encodeURIComponent(clean)}` : '/buscar');
}

const STATUS_TONES = {
  Operativo: 'success',
  Degradado: 'warning',
  Incidencia: 'danger',
};

export function openStatusHistory(status) {
  if (!status?.historial?.length) {
    return null;
  }

  const modal = createModal({
    title: 'Historial de estado',
    description: 'Últimos cambios del servicio en las 72 horas previas.',
    onClose: () => modal.element.remove(),
  });

  modal.body.append(
    h(
      'ol',
      { class: 'ps-status-history' },
      status.historial.map((item) =>
        h(
          'li',
          { class: 'ps-status-history__row' },
          h(
            'div',
            { class: 'ps-status-history__head' },
            h('span', { class: 'ps-status-history__date', text: item.fecha }),
            h('span', {
              class: `ps-status-pill ps-status-pill--${STATUS_TONES[item.estado] || 'success'}`,
              text: item.estado,
            }),
          ),
          h('p', { class: 'ps-status-history__detail', text: item.detalle }),
        ),
      ),
    ),
  );

  document.body.append(modal.element);
  modal.open();
  return modal;
}
