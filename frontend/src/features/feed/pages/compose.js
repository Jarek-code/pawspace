import { createComposerForm } from '@/components/feed/composer-form.js';
import { createRail } from '@/components/feed/rail.js';
import { createAppShell } from '@/components/layout/app-shell.js';
import { createModal } from '@/components/primitives/modal.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';
import { currentSession } from '@/services/auth.js';
import { createPost, loadFeed } from '@/services/feed.js';
import { getCurrentPet, listPets } from '@/services/pets.js';
import {
  accountFromEmail,
  createFeedContent,
  createFeedLoading,
  normalizePet,
} from '@/features/feed/feed-view.js';

/**
 * D14 / M07 — Crear publicación.
 * En escritorio es un modal sobre el feed (ruta /publicar); en móvil ocupa la
 * pantalla completa con la barra de publicación fija abajo.
 */
export function createPage({ router } = {}) {
  const pet = normalizePet(getCurrentPet() || listPets(currentSession().email)[0] || null) || {
    nombre: 'tu mascota',
    handle: '@mascota',
    privacidad: 'publico',
  };

  const close = () => router.navigate('/inicio');
  let modal = null;

  const dismiss = () => {
    if (modal) {
      modal.close();
      return;
    }

    close();
  };

  const form = createComposerForm({
    pet,
    onCancel: dismiss,
    onSubmit: async ({ texto, media }) => {
      form.setError('');
      form.setLoading(true);

      try {
        await createPost({
          texto,
          media,
          mascota: { nombre: pet.nombre, handle: pet.handle },
        });
        dismiss();
      } catch (error) {
        form.setLoading(false);
        form.setError(error?.message || 'No pudimos publicar. Intenta de nuevo.');
      }
    },
  });

  if (isMobile()) {
    return createMobileComposer({ form, close });
  }

  const shell = createAppShell({
    activePath: '/inicio',
    title: 'Inicio',
    subtitle: 'Lo último de tus mascotas',
    pet,
    account: accountFromEmail(currentSession().email),
    notificationCount: 3,
    onCompose: close,
    rail: h('span', { class: 'ps-sr-only', text: 'Cargando sugerencias…' }),
    children: createFeedLoading(),
  });

  const content = shell.querySelector('.ps-shell__content');
  const rail = shell.querySelector('.ps-rail');

  loadFeed()
    .then((data) => {
      rail.replaceChildren(
        ...createRail({ pet, ...data, onChangePet: () => router.navigate('/elegir-mascota') }),
      );
      content.replaceChildren(
        createFeedContent({
          pet,
          data,
          onCompose: close,
          onOpenPost: (post) => router.navigate(`/publicacion/${post.id}`),
        }),
      );
    })
    .catch(() => {
      rail.replaceChildren();
    });

  modal = createModal({
    title: 'Crear publicación',
    size: 'lg',
    children: form.element,
    onClose: close,
  });

  shell.append(modal.element);
  modal.open();

  return shell;
}

function createMobileComposer({ form, close }) {
  return h(
    'div',
    { class: 'ps-compose-page' },
    h('a', { class: 'ps-skip-link', href: '#contenido' }, 'Saltar al contenido'),
    h(
      'header',
      { class: 'ps-compose-page__topbar' },
      h(
        'button',
        {
          class: 'ps-compose-page__back',
          type: 'button',
          attrs: { 'aria-label': 'Cerrar' },
          onClick: close,
        },
        createIcon('x', { size: 22 }),
      ),
      h('h1', { class: 'ps-compose-page__title', text: 'Crear publicación' }),
    ),
    h('main', { id: 'contenido', class: 'ps-compose-page__body', tabindex: '-1' }, form.element),
  );
}

function isMobile() {
  return window.matchMedia('(max-width: 767px) and (orientation: portrait)').matches;
}
