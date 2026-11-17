import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { h } from '@/lib/dom.js';

/**
 * Riel derecho del feed: tarjeta de mascota activa, sugerencias para seguir,
 * tendencias y pie. Información secundaria que no compite con el contenido.
 */
export function createRail({ pet, sugerencias = [], tendencias = [], onChangePet = null } = {}) {
  const cards = [createActivePetCard(pet, onChangePet)];

  if (sugerencias.length) {
    cards.push(createSugerenciasCard(sugerencias));
  }

  if (tendencias.length) {
    cards.push(createTendenciasCard(tendencias));
  }

  cards.push(h('p', { class: 'ps-rail__footer' }, 'Acerca de · Ayuda · Privacidad'));

  return cards.filter(Boolean);
}

export function createActivePetCard(pet, onChangePet) {
  if (!pet) {
    return null;
  }

  const visibility = pet.privacidad === 'publico' ? 'Perfil público' : 'Perfil privado';

  return h(
    'section',
    { class: 'ps-rail__card', attrs: { 'aria-label': 'Mascota activa' } },
    h(
      'div',
      { class: 'ps-rail__pet' },
      createAvatar({ name: pet.nombre, size: 'md' }),
      h(
        'div',
        { class: 'ps-rail__pet-info' },
        h('span', { class: 'ps-rail__pet-name', text: pet.nombre }),
        h('span', { class: 'ps-rail__pet-handle', text: pet.handle }),
        h('span', { class: 'ps-rail__pet-visibility', text: visibility }),
      ),
      h('button', { class: 'ps-rail__link', type: 'button', onClick: onChangePet }, 'Cambiar'),
    ),
  );
}

function createSugerenciasCard(sugerencias) {
  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Sugerencias para seguir' }),
    h(
      'ul',
      { class: 'ps-rail__list' },
      sugerencias.map((pet) =>
        h(
          'li',
          { class: 'ps-rail__row' },
          createAvatar({ name: pet.nombre, size: 'sm' }),
          h(
            'div',
            { class: 'ps-rail__row-info' },
            h('span', { class: 'ps-rail__row-name', text: pet.nombre }),
            h('span', { class: 'ps-rail__row-handle', text: pet.handle }),
          ),
          createButton({ label: 'Seguir', size: 'sm' }).element,
        ),
      ),
    ),
  );
}

function createTendenciasCard(tendencias) {
  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Tendencias' }),
    h(
      'ul',
      { class: 'ps-rail__list' },
      tendencias.map((trend) =>
        h(
          'li',
          { class: 'ps-rail__trend' },
          h('span', { class: 'ps-rail__trend-tag', text: trend.tag }),
          h('span', { class: 'ps-rail__trend-count', text: trend.count }),
        ),
      ),
    ),
  );
}
