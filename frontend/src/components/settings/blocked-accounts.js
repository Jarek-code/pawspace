import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

/**
 * CMP-87 — BlockedAccounts.
 * Lista alfabética con búsqueda cuando hay más de ocho cuentas. El estado
 * vacío explica que el contenido de esas cuentas vuelve a estar disponible.
 */
export function createBlockedAccounts({ accounts = [], onUnblock = null } = {}) {
  let list = [...accounts];
  let query = '';

  const search = h('input', {
    class: 'ps-settings-search__input',
    type: 'search',
    placeholder: 'Buscar cuenta bloqueada',
    attrs: { 'aria-label': 'Buscar cuenta bloqueada' },
  });

  const searchHost = h(
    'div',
    { class: 'ps-settings-search' },
    h(
      'span',
      { class: 'ps-settings-search__icon', 'aria-hidden': 'true' },
      createIcon('search', { size: 18 }),
    ),
    search,
  );

  const host = h('div', { class: 'ps-blocked-accounts' });

  function render() {
    const normalized = query.trim().toLowerCase();
    const visible = list.filter(
      (account) =>
        !normalized ||
        account.nombre.toLowerCase().includes(normalized) ||
        account.handle.toLowerCase().includes(normalized),
    );

    searchHost.hidden = list.length <= 8;

    if (!list.length) {
      host.replaceChildren(
        createEmptyState({
          icon: 'ban',
          title: 'No hay cuentas bloqueadas',
          body: 'Cuando bloquees una cuenta, aparecerá aquí y podrás desbloquearla.',
        }),
      );
      return;
    }

    if (!visible.length) {
      host.replaceChildren(
        createEmptyState({
          icon: 'search',
          title: 'Sin resultados',
          body: 'Prueba con otro nombre o handle.',
        }),
      );
      return;
    }

    host.replaceChildren(
      h(
        'ul',
        { class: 'ps-blocked-accounts__list', attrs: { 'aria-label': 'Cuentas bloqueadas' } },
        visible.map((account) =>
          h(
            'li',
            { class: 'ps-blocked-account' },
            createAvatar({ name: account.nombre, src: account.avatar, size: 'md' }),
            h(
              'span',
              { class: 'ps-blocked-account__info' },
              h('span', { class: 'ps-blocked-account__name', text: account.nombre }),
              h('span', { class: 'ps-blocked-account__handle', text: account.handle }),
            ),
            createButton({
              label: 'Desbloquear',
              variant: 'secondary',
              size: 'sm',
              onClick: () => onUnblock?.(account),
            }).element,
          ),
        ),
      ),
    );
  }

  search.addEventListener('input', () => {
    query = search.value;
    render();
  });

  render();

  return {
    element: h('div', { class: 'ps-blocked-accounts-wrap' }, searchHost, host),
    setAccounts(next) {
      list = [...next].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      render();
    },
  };
}
