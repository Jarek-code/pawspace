import { createAppShell } from '@/components/layout/app-shell.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createModal } from '@/components/primitives/modal.js';
import { createTabs } from '@/components/primitives/tabs.js';
import { showToast } from '@/components/primitives/toast.js';
import { createStoryCard } from '@/components/stories/story-card.js';
import { h } from '@/lib/dom.js';
import { currentSession, logout } from '@/services/auth.js';
import { getCurrentPet, listPets } from '@/services/pets.js';
import { deleteStory, loadStoryArchive } from '@/services/stories.js';
import { accountFromEmail } from '@/features/feed/feed-view.js';

/**
 * D21 / M14 — Tus historias: activas y archivo.
 */
export function createPage({ router } = {}) {
  const stored = getCurrentPet() || listPets(currentSession().email)[0] || null;
  const pet = stored ? { ...stored, handle: `@${stored.usuario}` } : null;
  const account = accountFromEmail(currentSession().email);
  const handle = pet?.handle?.replace(/^@/, '') || 'luna';

  const shell = createAppShell({
    activePath: '/perfil',
    title: 'Tus historias',
    subtitle: 'Lo que compartiste en las últimas 24 horas',
    pet,
    account,
    backTo: '/perfil',
    notificationCount: 3,
    onCompose: () => router.navigate('/historias/nueva'),
    onSearch: (query) => goSearch(router, query),
    onLogout: () => {
      logout();
      router.navigate('/', { replace: true });
    },
    rail: storiesRail(),
    children: h('div', { class: 'ps-stories-loading', attrs: { 'aria-busy': 'true' } }),
  });

  const content = shell.querySelector('.ps-shell__content');

  loadStoryArchive()
    .then((data) => render(data))
    .catch(() => {
      content.replaceChildren(
        createEmptyState({
          icon: 'alert',
          title: 'No pudimos cargar tus historias',
          body: 'Revisa tu conexión e intenta de nuevo.',
          action: createButton({
            label: 'Reintentar',
            variant: 'secondary',
            onClick: () => router.navigate('/historias', { replace: true }),
          }).element,
        }),
      );
    });

  function render(data) {
    let activeTab = 'activas';
    const panel = h('div', { class: 'ps-story-grid-host' });
    const tabs = createTabs({
      tabs: [
        { value: 'activas', label: `Activas (${data.activas.length})`, active: true },
        { value: 'archivo', label: `Archivo (${data.archivadas.length})`, active: false },
      ],
      onChange: (value) => {
        activeTab = value;
        paint(value);
      },
    });

    function paint(value) {
      const stories = value === 'activas' ? data.activas : data.archivadas;
      panel.replaceChildren();

      if (!stories.length) {
        panel.append(
          createEmptyState({
            icon: 'image',
            title: value === 'activas' ? 'No hay historias activas' : 'El archivo está vacío',
            body:
              value === 'activas'
                ? 'Comparte un momento de tu mascota. Estará visible 24 horas.'
                : 'Las historias que caduquen aparecerán aquí.',
            action:
              value === 'activas'
                ? createButton({
                    label: 'Crear historia',
                    variant: 'primary',
                    onClick: () => router.navigate('/historias/nueva'),
                  }).element
                : null,
          }),
        );
        return;
      }

      panel.append(
        h(
          'div',
          { class: 'ps-story-grid' },
          stories.map((story) =>
            createStoryCard({
              story,
              onOpen:
                value === 'activas'
                  ? () => router.navigate(`/historias/${handle}?desde=/historias`)
                  : null,
              onDelete: (item) => confirmDelete(item, router),
            }),
          ),
        ),
      );
    }

    content.replaceChildren(
      h(
        'div',
        { class: 'ps-stories-page' },
        h(
          'section',
          { class: 'ps-stories-summary' },
          h(
            'div',
            { class: 'ps-stories-summary__copy' },
            h('h1', { class: 'ps-stories-summary__title', text: 'Historias' }),
            h('p', {
              class: 'ps-stories-summary__body',
              text: `${data.activas.length} activas · ${data.archivadas.length} en el archivo`,
            }),
            h('p', {
              class: 'ps-stories-summary__hint',
              text: 'Las historias desaparecen de tu perfil después de 24 horas; el archivo las conserva solo para ti.',
            }),
          ),
          createButton({
            label: 'Crear historia',
            iconLeft: createIcon('plus', { size: 18 }),
            onClick: () => router.navigate('/historias/nueva'),
          }).element,
        ),
        h(
          'section',
          { class: 'ps-stories-panel', attrs: { 'aria-label': 'Historias' } },
          tabs.element,
          panel,
        ),
      ),
    );

    paint(activeTab);
  }

  return shell;
}

function confirmDelete(story, router) {
  const modal = createModal({
    title: 'Eliminar historia',
    description: 'Esta acción no se puede deshacer.',
    size: 'sm',
    onClose: () => modal.element.remove(),
  });

  const cancel = createButton({
    label: 'Cancelar',
    variant: 'ghost',
    onClick: () => modal.close(),
  });

  const remove = createButton({
    label: 'Eliminar',
    variant: 'danger',
    onClick: async () => {
      remove.setLoading(true);

      try {
        await deleteStory(story.id);
        modal.close();
        showToast('Historia eliminada.');
        router.navigate('/historias', { replace: true });
      } catch (error) {
        remove.setLoading(false);
        showToast(error?.message || 'No pudimos eliminar la historia.', { variant: 'error' });
      }
    },
  });

  modal.body.append(
    h(
      'div',
      { class: 'ps-stories-delete' },
      h('p', {
        class: 'ps-stories-delete__text',
        text: `Se eliminará ${story.media?.alt || 'esta historia'} y sus vistas.`,
      }),
      h('div', { class: 'ps-modal__actions' }, cancel.element, remove.element),
    ),
  );

  document.body.append(modal.element);
  modal.open();
}

function storiesRail() {
  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Historias' }),
    h(
      'ul',
      { class: 'ps-story-tips' },
      h('li', { text: 'Las historias duran 24 horas.' }),
      h('li', { text: 'Quienes te siguen pueden verlas.' }),
      h('li', { text: 'Solo tú puedes ver el archivo.' }),
      h('li', { text: 'Puedes eliminar una historia en cualquier momento.' }),
    ),
  );
}

function goSearch(router, query) {
  const clean = String(query || '').trim();
  router.navigate(clean ? `/buscar?q=${encodeURIComponent(clean)}` : '/buscar');
}
