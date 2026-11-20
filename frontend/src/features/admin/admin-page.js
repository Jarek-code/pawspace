import { createAdminShell } from '@/components/admin/admin-shell.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { accountFromEmail } from '@/features/feed/feed-view.js';
import { h } from '@/lib/dom.js';
import { currentSession, logout } from '@/services/auth.js';
import { loadAdminSummary } from '@/services/admin.js';

/**
 * Montaje compartido de las pantallas de administración.
 * Carga el resumen una vez para alimentar los badges del shell y delega el
 * contenido a cada sección. El guard ya comprobó la sesión antes de llegar.
 */
export function mountAdminPage({ active, title, subtitle, router, createContent }) {
  const session = currentSession();
  const account = {
    ...accountFromEmail(session.email),
    rol: 'Administradora',
  };

  const shell = createAdminShell({
    active,
    title,
    subtitle,
    account,
    onLogout: () => {
      logout();
      router.navigate('/', { replace: true });
    },
    onSearch: (query) => {
      const clean = String(query || '').trim();
      router.navigate(clean ? `/admin/reportes?q=${encodeURIComponent(clean)}` : '/admin/reportes');
    },
    children: createAdminLoading(),
  });

  const body = shell.querySelector('.ps-admin__content-body');
  let current = null;

  function paint() {
    body.replaceChildren(createContent({ data: current, refresh, router }));
  }

  function syncShell(data) {
    shell.updateAdminShell?.({
      badges: {
        reportes: data.metricas.reportesPendientes.valor,
        apelaciones: data.metricas.apelacionesPendientes.valor,
        soporte: data.metricas.ticketsAbiertos.valor,
      },
      system: data.sistema,
    });
  }

  function refresh() {
    return loadAdminSummary()
      .then((data) => {
        current = data;
        syncShell(data);
        paint();
        return current;
      })
      .catch(() => {
        body.replaceChildren(
          createEmptyState({
            icon: 'alert',
            title: 'No pudimos cargar el panel',
            body: 'Revisa tu conexión e intenta de nuevo.',
            action: createButton({
              label: 'Reintentar',
              variant: 'secondary',
              onClick: () => refresh(),
            }).element,
          }),
        );
      });
  }

  refresh();

  return shell;
}

function createAdminLoading() {
  return h(
    'div',
    { class: 'ps-admin-loading', attrs: { role: 'status', 'aria-live': 'polite' } },
    h('span', { class: 'ps-sr-only', text: 'Cargando panel de administración…' }),
    h(
      'div',
      { class: 'ps-admin-loading__metrics', 'aria-hidden': 'true' },
      Array.from({ length: 4 }, () => h('div', { class: 'ps-admin-loading__card' })),
    ),
    h(
      'div',
      { class: 'ps-admin-loading__panels', 'aria-hidden': 'true' },
      h('div', { class: 'ps-admin-loading__panel' }),
      h('div', { class: 'ps-admin-loading__panel' }),
    ),
  );
}
