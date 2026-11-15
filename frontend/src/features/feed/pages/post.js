import { createCommentItem } from '@/components/feed/comment-item.js';
import { createPostCard } from '@/components/feed/post-card.js';
import { createRail } from '@/components/feed/rail.js';
import { createAppShell } from '@/components/layout/app-shell.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createSkeleton } from '@/components/primitives/skeleton.js';
import { h } from '@/lib/dom.js';
import { currentSession } from '@/services/auth.js';
import { addComment, loadFeed, loadPost, toggleLike } from '@/services/feed.js';
import { getCurrentPet, listPets } from '@/services/pets.js';
import { accountFromEmail, normalizePet } from '@/features/feed/feed-view.js';

/**
 * D15 / M08 — Detalle de una publicación.
 * Publicación, comentarios y formulario para comentar. En móvil la cabecera
 * lleva volver y la barra de comentario queda fija abajo.
 */
export function createPage({ router, params } = {}) {
  const pet = normalizePet(getCurrentPet() || listPets(currentSession().email)[0] || null) || {
    nombre: 'tu mascota',
    handle: '@mascota',
  };

  const shell = createAppShell({
    activePath: '/inicio',
    title: 'Publicación',
    subtitle: 'Conversación',
    pet,
    account: accountFromEmail(currentSession().email),
    notificationCount: 3,
    backTo: '/inicio',
    hideBottomNav: true,
    rail: h('span', { class: 'ps-sr-only', text: 'Cargando sugerencias…' }),
    children: createLoading(),
  });

  const content = shell.querySelector('.ps-shell__content');
  const rail = shell.querySelector('.ps-rail');

  loadPost(params.id)
    .then((detail) => {
      content.replaceChildren(createDetail({ detail, pet, router }));

      loadFeed()
        .then((data) => {
          rail.replaceChildren(
            ...createRail({
              pet,
              ...data,
              onChangePet: () => router.navigate('/elegir-mascota'),
            }),
          );
        })
        .catch(() => {
          rail.replaceChildren();
        });
    })
    .catch(() => {
      rail.replaceChildren();
      content.replaceChildren(
        createEmptyState({
          icon: 'alert',
          title: 'Esta publicación no está disponible',
          body: 'Puede que se haya eliminado o que ya no tengas acceso a ella.',
          action: createButton({
            label: 'Volver al feed',
            variant: 'primary',
            onClick: () => router.navigate('/inicio'),
          }).element,
        }),
      );
    });

  return shell;
}

function createDetail({ detail, pet, router }) {
  const { publicacion, comentarios } = detail;

  const input = h('input', {
    class: 'ps-comment-form__input',
    type: 'text',
    placeholder: 'Escribe un comentario…',
    attrs: { 'aria-label': 'Escribe un comentario' },
  });

  const send = createButton({
    label: 'Enviar',
    variant: 'primary',
    type: 'submit',
    disabled: true,
  });

  const error = h('p', {
    class: 'ps-comment-form__error',
    attrs: { role: 'alert', hidden: true },
  });

  const count = h('span', {
    class: 'ps-comments__count',
    text: String(comentarios.length),
  });

  const list = h('ul', { class: 'ps-comments__list' });

  function renderComments(items) {
    list.replaceChildren(...items.map((comment) => createCommentItem({ comment })));
  }

  renderComments(comentarios);

  if (!comentarios.length) {
    list.append(
      h(
        'li',
        { class: 'ps-comments__empty' },
        'Todavía no hay comentarios. Sé la primera mascota en comentar.',
      ),
    );
  }

  input.addEventListener('input', () => {
    send.setDisabled(input.value.trim().length === 0);
  });

  const postCard = createPostCard({
    post: publicacion,
    onComment: () => input.focus(),
    onLike: () => {
      toggleLike(publicacion.id).catch(() => {});
    },
  });

  const form = h('form', { class: 'ps-comment-form' }, input, send.element);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const texto = input.value.trim();

    if (!texto || send.element.disabled) {
      return;
    }

    error.hidden = true;
    error.textContent = '';
    send.setLoading(true);
    input.disabled = true;

    try {
      const result = await addComment(publicacion.id, {
        texto,
        mascota: { nombre: pet.nombre, handle: pet.handle },
      });

      if (!comentarios.length) {
        list.replaceChildren();
      }

      comentarios.push(result.comentario);
      list.append(createCommentItem({ comment: result.comentario }));
      count.textContent = String(result.comentarios);
      publicacion.comentarios = result.comentarios;
      postCard.comment.setCount(result.comentarios);
      input.value = '';
      send.setDisabled(true);
      input.focus();
    } catch (requestError) {
      error.textContent =
        requestError?.message || 'No pudimos enviar tu comentario. Intenta de nuevo.';
      error.hidden = false;
    } finally {
      send.setLoading(false);
      input.disabled = false;
    }
  });

  const back = h(
    'button',
    {
      class: 'ps-post-detail__back',
      type: 'button',
      onClick: () => router.navigate('/inicio'),
    },
    createIcon('arrow-left', { size: 18 }),
    'Volver al feed',
  );

  return h(
    'div',
    { class: 'ps-post-detail' },
    back,
    postCard.element,
    h(
      'section',
      { class: 'ps-comments', attrs: { 'aria-label': 'Comentarios' } },
      h(
        'header',
        { class: 'ps-comments__header' },
        h('h2', { class: 'ps-comments__title', text: 'Comentarios' }),
        count,
      ),
      list,
      h('div', {}, form, error),
    ),
  );
}

function createLoading() {
  return h(
    'div',
    { class: 'ps-post-detail' },
    createSkeleton({ width: '120px', height: '16px' }),
    h(
      'article',
      { class: 'ps-post-card', attrs: { 'aria-hidden': 'true' } },
      h(
        'div',
        { class: 'ps-post-card__header' },
        createSkeleton({ width: '48px', height: '48px', radius: 'var(--ps-radius-full)' }),
        h(
          'div',
          { class: 'ps-post-card__author' },
          createSkeleton({ width: '40%', height: '14px' }),
          createSkeleton({ width: '60%', height: '12px' }),
        ),
      ),
      createSkeleton({ width: '90%', height: '16px', className: 'ps-post-skeleton__line' }),
      createSkeleton({
        width: '100%',
        height: '168px',
        radius: 'var(--ps-radius-md)',
        className: 'ps-post-skeleton__media',
      }),
    ),
    h(
      'section',
      { class: 'ps-comments', attrs: { 'aria-hidden': 'true' } },
      createSkeleton({ width: '35%', height: '18px' }),
      createSkeleton({ width: '100%', height: '64px', className: 'ps-post-skeleton__line' }),
      createSkeleton({ width: '100%', height: '64px', className: 'ps-post-skeleton__line' }),
    ),
  );
}
