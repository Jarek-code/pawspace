import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { h } from '@/lib/dom.js';
import { formatAge, formatCount } from '@/lib/format.js';

/**
 * CMP-59 / CMP-62 — ProfileStats e InfoList.
 * Riel del perfil: mascota activa, progreso, sugerencias, información y
 * mascotas similares. La información solo usa campos del esquema.
 */
export function createProfileRail({
  profile,
  own = false,
  suggestions = [],
  similares = [],
  onChangePet = null,
  onEdit = null,
  onOpenProfile = null,
} = {}) {
  const cards = [];

  if (own) {
    cards.push(activePetCard(profile, onChangePet));
    cards.push(completionCard(profile, onEdit));

    if (suggestions.length) {
      cards.push(peopleCard('Sugerencias para seguir', suggestions, onOpenProfile));
    }
  } else {
    cards.push(infoCard(profile));

    if (similares.length) {
      cards.push(peopleCard('Mascotas similares', similares, onOpenProfile));
    }
  }

  cards.push(h('p', { class: 'ps-rail__footer', text: 'Acerca de · Ayuda · Privacidad' }));
  return cards;
}

function activePetCard(profile, onChangePet) {
  return h(
    'section',
    { class: 'ps-rail__card', attrs: { 'aria-label': 'Mascota activa' } },
    h(
      'div',
      { class: 'ps-rail__pet' },
      createAvatar({ name: profile.nombre, src: profile.avatar, size: 'md' }),
      h(
        'div',
        { class: 'ps-rail__pet-info' },
        h('span', { class: 'ps-rail__pet-name', text: profile.nombre }),
        h('span', { class: 'ps-rail__pet-handle', text: profile.handle }),
        h('span', {
          class: 'ps-rail__pet-visibility',
          text: profile.privacidad === 'privado' ? 'Perfil privado' : 'Perfil público',
        }),
      ),
      h('button', { class: 'ps-rail__link', type: 'button', onClick: onChangePet }, 'Cambiar'),
    ),
  );
}

function completionCard(profile, onEdit) {
  const checks = [profile.avatar, profile.bio, profile.fechaNacimiento, profile.raza];
  const percent = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return h(
    'section',
    { class: 'ps-rail__card ps-completion' },
    h('h2', { class: 'ps-rail__title', text: 'Completa tu perfil' }),
    h('p', { class: 'ps-completion__value', text: `${percent}%` }),
    h(
      'div',
      {
        class: 'ps-completion__track',
        attrs: {
          role: 'progressbar',
          'aria-valuemin': '0',
          'aria-valuemax': '100',
          'aria-valuenow': String(percent),
          'aria-label': 'Perfil completado',
        },
      },
      h('span', { class: 'ps-completion__bar', style: { width: `${percent}%` } }),
    ),
    h('p', {
      class: 'ps-completion__hint',
      text:
        percent === 100
          ? 'Tu perfil está completo.'
          : 'Agrega foto, biografía y fecha de nacimiento.',
    }),
    createButton({
      label: percent === 100 ? 'Revisar perfil' : 'Completar perfil',
      variant: 'secondary',
      size: 'sm',
      fullWidth: true,
      onClick: onEdit,
    }).element,
  );
}

function infoCard(profile) {
  const rows = [
    ['Especie', profile.especie],
    ['Raza', profile.raza],
    ['Sexo', profile.sexo],
    ['Edad', formatAge(profile.fechaNacimiento)],
    ['Tutor', profile.tutor?.nombre],
    ['Privacidad', profile.privacidad === 'privado' ? 'Privado' : 'Público'],
  ].filter(([, value]) => value);

  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: `Sobre ${profile.nombre}` }),
    h(
      'dl',
      { class: 'ps-info-list' },
      rows.map(([label, value]) =>
        h(
          'div',
          { class: 'ps-info-list__row' },
          h('dt', { class: 'ps-info-list__label', text: label }),
          h('dd', { class: 'ps-info-list__value', text: value }),
        ),
      ),
    ),
    h('p', {
      class: 'ps-info-list__footnote',
      text: `${formatCount(profile.stats?.seguidores)} seguidores · ${formatCount(profile.stats?.publicaciones)} publicaciones`,
    }),
  );
}

function peopleCard(title, people, onOpenProfile) {
  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: title }),
    h(
      'ul',
      { class: 'ps-rail__list' },
      people.map((pet) =>
        h(
          'li',
          { class: 'ps-rail__row' },
          createAvatar({ name: pet.nombre, src: pet.avatar, size: 'sm' }),
          h(
            'div',
            { class: 'ps-rail__row-info' },
            h('span', { class: 'ps-rail__row-name', text: pet.nombre }),
            h('span', { class: 'ps-rail__row-handle', text: pet.handle }),
          ),
          h(
            'button',
            {
              class: 'ps-rail__link',
              type: 'button',
              attrs: { 'aria-label': `Ver perfil de ${pet.nombre}` },
              onClick: () => onOpenProfile?.(pet),
            },
            'Ver',
          ),
        ),
      ),
    ),
  );
}
