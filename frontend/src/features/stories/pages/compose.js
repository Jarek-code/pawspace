import { createAlert } from '@/components/primitives/alert.js';
import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';
import { showToast } from '@/components/primitives/toast.js';
import { h } from '@/lib/dom.js';
import { getCurrentPet, listPets } from '@/services/pets.js';
import { currentSession } from '@/services/auth.js';
import { createStory } from '@/services/stories.js';

const MAX_SIZE = 100 * 1024 * 1024;
const ACCEPTED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

/**
 * D20 / M13 — Crear historia.
 * La historia es solo media: sin texto superpuesto ni controles de audiencia.
 */
export function createPage({ router } = {}) {
  const stored = getCurrentPet() || listPets(currentSession().email)[0] || null;
  const pet = stored
    ? { nombre: stored.nombre, handle: `@${stored.usuario}` }
    : { nombre: 'Tu mascota', handle: '@mascota' };

  let media = null;

  const alert = createAlert();
  const input = h('input', {
    type: 'file',
    accept: ACCEPTED.join(','),
    hidden: true,
    attrs: { 'aria-label': 'Elegir foto o video para la historia' },
  });

  const previewHost = h('div', { class: 'ps-story-picker__media' });
  const picker = h(
    'button',
    {
      class: 'ps-story-picker__empty',
      type: 'button',
      onClick: () => input.click(),
    },
    h(
      'span',
      { class: 'ps-story-picker__icon', 'aria-hidden': 'true' },
      createIcon('image', { size: 36 }),
    ),
    h('span', { class: 'ps-story-picker__title', text: 'Elige una foto o un video' }),
    h('span', {
      class: 'ps-story-picker__help',
      text: 'JPG, PNG, WEBP, MP4 o WEBM. Máximo 100 MB.',
    }),
  );

  const clear = createButton({
    label: 'Quitar archivo',
    variant: 'secondary',
    size: 'sm',
    iconLeft: createIcon('x', { size: 16 }),
    onClick: () => resetMedia(),
  });
  clear.element.hidden = true;

  const publish = createButton({
    label: 'Publicar',
    disabled: true,
    onClick: submit,
  });

  const close = h(
    'button',
    {
      class: 'ps-icon-button ps-story-compose__close',
      type: 'button',
      attrs: { 'aria-label': 'Cerrar' },
      onClick: () => {
        releaseMedia();
        router.navigate('/inicio');
      },
    },
    createIcon('x', { size: 22 }),
  );

  function paint() {
    previewHost.replaceChildren();

    if (!media) {
      previewHost.append(picker);
      clear.element.hidden = true;
      publish.setDisabled(true);
      return;
    }

    const node =
      media.type === 'video'
        ? h('video', {
            class: 'ps-story-picker__preview',
            src: media.url,
            controls: true,
            muted: true,
            playsinline: true,
            attrs: { 'aria-label': media.alt },
          })
        : h('img', {
            class: 'ps-story-picker__preview',
            src: media.url,
            alt: media.alt,
          });

    previewHost.append(node);
    clear.element.hidden = false;
    publish.setDisabled(false);
  }

  function releaseMedia() {
    if (media?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(media.url);
    }

    media = null;
  }

  function resetMedia() {
    releaseMedia();
    input.value = '';
    alert.hide();
    paint();
  }

  function accept(file) {
    alert.hide();

    if (!file) {
      return;
    }

    if (!ACCEPTED.includes(file.type)) {
      alert.show('Formato no compatible', 'Elige un JPG, PNG, WEBP, MP4 o WEBM.');
      return;
    }

    if (file.size > MAX_SIZE) {
      alert.show('Archivo demasiado grande', 'El máximo es 100 MB.');
      return;
    }

    releaseMedia();
    media = {
      type: file.type.startsWith('video/') ? 'video' : 'image',
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      alt: file.name,
    };
    paint();
  }

  input.addEventListener('change', () => {
    accept(input.files?.[0] || null);
    input.value = '';
  });

  picker.addEventListener('dragover', (event) => {
    event.preventDefault();
    picker.classList.add('is-dragging');
  });
  picker.addEventListener('dragleave', () => picker.classList.remove('is-dragging'));
  picker.addEventListener('drop', (event) => {
    event.preventDefault();
    picker.classList.remove('is-dragging');
    accept(event.dataTransfer?.files?.[0] || null);
  });

  async function submit() {
    if (!media) {
      return;
    }

    alert.hide();
    publish.setLoading(true);

    try {
      await createStory({ media, mascota: pet });
      showToast('Tu historia ya está visible.');
      router.navigate('/inicio');
    } catch (error) {
      publish.setLoading(false);
      alert.show('No pudimos publicar la historia', error?.message || 'Intenta de nuevo.');
      alert.focus();
    }
  }

  paint();

  const root = h(
    'div',
    { class: 'ps-story-compose' },
    h(
      'header',
      { class: 'ps-story-compose__bar' },
      close,
      h('h1', { class: 'ps-story-compose__title', text: 'Nueva historia' }),
      publish.element,
    ),
    h(
      'main',
      { class: 'ps-story-compose__body' },
      h(
        'section',
        { class: 'ps-story-compose__stage' },
        alert.element,
        h('div', { class: 'ps-story-picker' }, previewHost, input),
        h('div', { class: 'ps-story-compose__tools' }, clear.element),
      ),
      h(
        'aside',
        { class: 'ps-story-compose__aside' },
        h('h2', { class: 'ps-story-compose__aside-title', text: 'Tu historia' }),
        h('p', {
          class: 'ps-story-compose__identity',
          text: `${pet.nombre} · ${pet.handle}`,
        }),
        h(
          'ul',
          { class: 'ps-story-tips' },
          h('li', { text: 'Estará visible durante 24 horas.' }),
          h('li', { text: 'La verán las mascotas que te siguen.' }),
          h('li', { text: 'Puedes eliminarla desde Tus historias.' }),
          h('li', { text: 'No se puede añadir texto ni cambiar la audiencia por historia.' }),
        ),
      ),
    ),
  );

  return root;
}
