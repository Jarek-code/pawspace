import { h } from '@/lib/dom.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';

/**
 * CMP-53 — Composer (compositor del feed).
 * La persona escribe en el prompt y el botón Publicar se habilita con texto.
 * En esta fase el compositor completo (D14) se conecta después.
 */
export function createComposer({ pet, onCompose = null } = {}) {
  const publish = createButton({
    label: 'Publicar',
    variant: 'primary',
    size: 'sm',
    disabled: true,
  });

  const prompt = h(
    'button',
    {
      class: 'ps-composer__prompt',
      type: 'button',
    },
    h('span', { class: 'ps-composer__prompt-text', text: `Comparte algo de ${pet.nombre}…` }),
  );

  const mobileIcon = h(
    'span',
    { class: 'ps-composer__attach', 'aria-hidden': 'true' },
    createIcon('image', { size: 20 }),
  );

  const element = h(
    'div',
    { class: 'ps-composer' },
    createAvatar({ name: pet.nombre, size: 'md' }),
    h(
      'div',
      { class: 'ps-composer__content' },
      prompt,
      h('span', { class: 'ps-composer__hint', text: 'Texto, foto o logro' }),
    ),
    publish.element,
    mobileIcon,
  );

  if (onCompose) {
    prompt.addEventListener('click', onCompose);
  }

  return { element, prompt, publish };
}
