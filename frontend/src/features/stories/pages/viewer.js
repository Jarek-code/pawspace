import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createSpinner } from '@/components/primitives/spinner.js';
import { showToast } from '@/components/primitives/toast.js';
import { h } from '@/lib/dom.js';
import { formatCount } from '@/lib/format.js';
import { loadStoryViewer, markStoryView, toggleStoryLike } from '@/services/stories.js';

const IMAGE_DURATION = 5000;

/**
 * D19 / M12 — Visor de historias.
 * Una historia a la vez con progreso, pausa, teclado, gestos y navegación
 * entre grupos. No hay texto superpuesto ni respuestas: el esquema no los
 * almacena.
 */
export function createPage({ router, params, query } = {}) {
  const handle = params?.handle || '';
  const from = safeDestination(query?.get('desde'));

  const root = h(
    'div',
    { class: 'ps-story-viewer' },
    h(
      'div',
      { class: 'ps-story-viewer__loading', attrs: { role: 'status', 'aria-live': 'polite' } },
      createSpinner({ label: 'Cargando historias' }),
      h('p', { class: 'ps-story-viewer__loading-text', text: 'Cargando historias…' }),
    ),
  );

  let data = null;
  let groupIndex = 0;
  let storyIndex = 0;
  let paused = false;
  let raf = 0;
  let startedAt = 0;
  let elapsed = 0;
  let progressHost = null;
  let bars = [];
  let mediaHost = null;
  let headerHost = null;
  let footerHost = null;
  let pauseButton = null;
  let video = null;
  let closed = false;
  const viewed = new Set();

  function cleanup() {
    if (closed) {
      return;
    }

    closed = true;
    window.cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('popstate', cleanup);
    document.body.style.overflow = '';
    video?.pause();
  }

  function close() {
    const destination = from || '/inicio';
    cleanup();
    router.navigate(destination);
  }

  loadStoryViewer(handle)
    .then((payload) => {
      data = payload;
      groupIndex = Math.max(0, payload.inicio || 0);
      storyIndex = 0;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
      window.addEventListener('popstate', cleanup);
      build();
    })
    .catch(() => {
      root.replaceChildren(
        h(
          'div',
          { class: 'ps-story-viewer__error' },
          createEmptyState({
            icon: 'image',
            title: 'No pudimos abrir estas historias',
            body: 'Puede que hayan caducado o que el perfil ya no esté disponible.',
            action: createButton({
              label: 'Volver',
              variant: 'primary',
              onClick: close,
            }).element,
          }),
        ),
      );
    });

  function build() {
    progressHost = h('div', {
      class: 'ps-story-viewer__progress',
      attrs: { role: 'group', 'aria-label': 'Progreso de historias' },
    });
    headerHost = h('div', { class: 'ps-story-viewer__header' });
    mediaHost = h('div', { class: 'ps-story-viewer__media' });
    footerHost = h('div', { class: 'ps-story-viewer__footer' });

    const frame = h(
      'section',
      { class: 'ps-story-viewer__frame', attrs: { 'aria-label': 'Visor de historias' } },
      progressHost,
      headerHost,
      mediaHost,
      h('button', {
        class: 'ps-story-viewer__nav ps-story-viewer__nav--prev',
        type: 'button',
        attrs: { 'aria-label': 'Historia anterior' },
        onClick: previous,
      }),
      h('button', {
        class: 'ps-story-viewer__nav ps-story-viewer__nav--next',
        type: 'button',
        attrs: { 'aria-label': 'Siguiente historia' },
        onClick: next,
      }),
      footerHost,
    );

    root.replaceChildren(frame);
    renderStory();
  }

  function currentGroup() {
    return data?.grupos?.[groupIndex] || null;
  }

  function currentStory() {
    return currentGroup()?.stories?.[storyIndex] || null;
  }

  function ensureStory() {
    while (currentGroup() && !currentGroup().stories.length) {
      if (groupIndex >= data.grupos.length - 1) {
        return false;
      }

      groupIndex += 1;
      storyIndex = 0;
    }

    return Boolean(currentGroup()?.stories?.length);
  }

  function renderStory() {
    if (!data || !ensureStory()) {
      close();
      return;
    }

    const group = currentGroup();
    const story = currentStory();
    const total = group.stories.length;

    bars = group.stories.map((item, index) =>
      h(
        'span',
        { class: 'ps-story-viewer__bar' },
        h('span', {
          class: 'ps-story-viewer__bar-fill',
          style: { width: index < storyIndex ? '100%' : '0%' },
        }),
      ),
    );
    progressHost.replaceChildren(...bars);

    headerHost.replaceChildren(
      createAvatar({ name: group.nombre, size: 'sm' }),
      h(
        'div',
        { class: 'ps-story-viewer__identity' },
        h('p', { class: 'ps-story-viewer__name', text: group.nombre }),
        h('p', {
          class: 'ps-story-viewer__time',
          text: `${story.creadoEn}${group.propia ? ' · Tu historia' : ''}`,
        }),
      ),
      (pauseButton = h(
        'button',
        {
          class: 'ps-story-viewer__control',
          type: 'button',
          attrs: {
            'aria-label': paused ? 'Reanudar historia' : 'Pausar historia',
            'aria-pressed': String(paused),
          },
          onClick: togglePause,
        },
        createIcon(paused ? 'play' : 'pause', { size: 18 }),
      )),
      h(
        'button',
        {
          class: 'ps-story-viewer__control',
          type: 'button',
          attrs: { 'aria-label': 'Cerrar historias' },
          onClick: close,
        },
        createIcon('x', { size: 20 }),
      ),
    );

    video?.pause();
    video = null;
    mediaHost.replaceChildren(buildMedia(story));

    footerHost.replaceChildren(
      story.propia
        ? h(
            'span',
            { class: 'ps-story-viewer__views' },
            createIcon('eye', { size: 16 }),
            h('span', { text: `${formatCount(story.vistas)} vistas` }),
          )
        : buildLike(story),
      h('span', { class: 'ps-story-viewer__position', text: `${storyIndex + 1} de ${total}` }),
    );

    if (!story.propia && !viewed.has(story.id)) {
      viewed.add(story.id);
      markStoryView(story.id)
        .then((result) => {
          story.vistas = result.vistas;
        })
        .catch(() => {});
    }

    paused = false;
    elapsed = 0;
    startedAt = performance.now();

    if (story.media.type === 'video') {
      window.cancelAnimationFrame(raf);
      video?.play?.().catch(() => {});
    } else {
      tick();
    }
  }

  function buildMedia(story) {
    if (story.media.type === 'video') {
      video = h('video', {
        class: 'ps-story-viewer__image',
        src: story.media.url,
        autoplay: true,
        muted: true,
        playsinline: true,
        attrs: { 'aria-label': story.media.alt || 'Historia en video' },
      });

      video.addEventListener('timeupdate', () => {
        if (video?.duration) {
          paintProgress(video.currentTime / video.duration);
        }
      });
      video.addEventListener('ended', next);
      return video;
    }

    return h('img', {
      class: 'ps-story-viewer__image',
      src: story.media.url,
      alt: story.media.alt || 'Historia',
    });
  }

  function buildLike(story) {
    const count = h('span', { text: String(story.likes || 0) });
    const button = h(
      'button',
      {
        class: `ps-story-viewer__like${story.meGusta ? ' is-liked' : ''}`,
        type: 'button',
        attrs: {
          'aria-label': story.meGusta ? 'Quitar me gusta' : 'Me gusta',
          'aria-pressed': String(Boolean(story.meGusta)),
        },
        onClick: async () => {
          const previous = { meGusta: story.meGusta, likes: story.likes };
          story.meGusta = !story.meGusta;
          story.likes = Math.max(0, story.likes + (story.meGusta ? 1 : -1));
          button.classList.toggle('is-liked', story.meGusta);
          button.setAttribute('aria-pressed', String(story.meGusta));
          button.setAttribute('aria-label', story.meGusta ? 'Quitar me gusta' : 'Me gusta');
          count.textContent = String(story.likes);

          try {
            const result = await toggleStoryLike(story.id);
            story.meGusta = result.meGusta;
            story.likes = result.likes;
            button.classList.toggle('is-liked', story.meGusta);
            count.textContent = String(story.likes);
          } catch (error) {
            story.meGusta = previous.meGusta;
            story.likes = previous.likes;
            button.classList.toggle('is-liked', story.meGusta);
            count.textContent = String(story.likes);
            showToast(error?.message || 'No pudimos registrar tu me gusta.', {
              variant: 'error',
            });
          }
        },
      },
      createIcon('heart', { size: 18 }),
      count,
    );

    return button;
  }

  function tick() {
    if (closed) {
      return;
    }

    if (!root.isConnected) {
      cleanup();
      return;
    }

    const story = currentStory();

    if (!story || paused) {
      return;
    }

    const now = performance.now();
    const percent = Math.min(1, (now - startedAt + elapsed) / IMAGE_DURATION);
    paintProgress(percent);

    if (percent >= 1) {
      next();
      return;
    }

    raf = window.requestAnimationFrame(tick);
  }

  function paintProgress(percent) {
    const bar = bars[storyIndex]?.firstElementChild;

    if (bar) {
      bar.style.width = `${Math.min(100, Math.max(0, percent * 100))}%`;
    }
  }

  function togglePause() {
    paused = !paused;

    if (paused) {
      elapsed += performance.now() - startedAt;
      window.cancelAnimationFrame(raf);
      video?.pause();
      pauseButton.replaceChildren(createIcon('play', { size: 18 }));
      pauseButton.setAttribute('aria-label', 'Reanudar historia');
      pauseButton.setAttribute('aria-pressed', 'true');
    } else {
      startedAt = performance.now();
      video?.play?.().catch(() => {});
      pauseButton.replaceChildren(createIcon('pause', { size: 18 }));
      pauseButton.setAttribute('aria-label', 'Pausar historia');
      pauseButton.setAttribute('aria-pressed', 'false');
      tick();
    }
  }

  function next() {
    window.cancelAnimationFrame(raf);
    video?.pause();

    if (storyIndex < currentGroup().stories.length - 1) {
      storyIndex += 1;
      renderStory();
      return;
    }

    if (groupIndex < data.grupos.length - 1) {
      groupIndex += 1;
      storyIndex = 0;
      renderStory();
      return;
    }

    close();
  }

  function previous() {
    window.cancelAnimationFrame(raf);
    video?.pause();

    if (storyIndex > 0) {
      storyIndex -= 1;
      renderStory();
      return;
    }

    if (groupIndex > 0) {
      groupIndex -= 1;
      storyIndex = Math.max(0, currentGroup().stories.length - 1);
      renderStory();
      return;
    }

    storyIndex = 0;
    renderStory();
  }

  function onKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previous();
      return;
    }

    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      togglePause();
    }
  }

  return root;
}

function safeDestination(value) {
  const path = String(value || '');
  return path.startsWith('/') && !path.startsWith('//') ? path : '/inicio';
}
