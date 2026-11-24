import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';
import { formatAge, formatCount } from '@/lib/format.js';
import { createFollowButton } from './follow-button.js';

/**
 * CMP-56 — ProfileHeader.
 * Cabecera del perfil propio y del público. La portada es un bloque neutro:
 * database/schema.sql no guarda una portada editable.
 */
export function createProfileHeader({
  profile,
  variant = 'own',
  readOnly = false,
  onEdit = null,
  onShare = null,
  onFollow = null,
  onMessage = null,
  onMore = null,
  onUnblock = null,
  onFollowError = null,
} = {}) {
  const own = variant === 'own' || profile.esPropia;
  const meta = [profile.especie, profile.raza, formatAge(profile.fechaNacimiento)].filter(Boolean);

  const actions = [];

  if (own) {
    if (!readOnly) {
      actions.push(
        createButton({
          label: 'Editar perfil',
          size: 'md',
          iconLeft: createIcon('pencil', { size: 18 }),
          onClick: onEdit,
        }).element,
      );
    }

    actions.push(
      createButton({
        label: 'Compartir',
        variant: 'secondary',
        size: 'md',
        iconLeft: createIcon('share-2', { size: 18 }),
        onClick: onShare,
      }).element,
    );
  } else if (profile.bloqueado) {
    actions.push(
      createButton({
        label: 'Desbloquear',
        size: 'md',
        iconLeft: createIcon('lock', { size: 18 }),
        onClick: onUnblock,
      }).element,
    );
  } else {
    const follow = createFollowButton({
      siguiendo: profile.siguiendo,
      pendiente: profile.pendiente,
      privado: profile.privacidad === 'privado',
      onToggle: onFollow,
      onError: onFollowError,
    });

    actions.push(
      follow.element,
      createButton({
        label: 'Mensaje',
        variant: 'secondary',
        size: 'md',
        iconLeft: createIcon('message-circle', { size: 18 }),
        onClick: onMessage,
      }).element,
    );
  }

  if (!own && !readOnly) {
    actions.push(
      h(
        'button',
        {
          class: 'ps-icon-button ps-profile__more',
          type: 'button',
          attrs: { 'aria-label': 'Más opciones del perfil' },
          onClick: onMore,
        },
        createIcon('more-horizontal', { size: 20 }),
      ),
    );
  }

  return h(
    'section',
    {
      class: `ps-profile-header ps-profile-header--${own ? 'own' : 'public'}`,
      attrs: { 'aria-label': `Perfil de ${profile.nombre}` },
    },
    h(
      'div',
      { class: 'ps-profile__cover', attrs: { 'aria-hidden': 'true' } },
      createIcon('paw-print', { size: 56 }),
    ),
    h(
      'div',
      { class: 'ps-profile__identity' },
      h(
        'div',
        { class: 'ps-profile__avatar' },
        createAvatar({
          name: profile.nombre,
          src: profile.avatar,
          size: 'xl',
        }),
      ),
      h(
        'div',
        { class: 'ps-profile__identity-body' },
        h(
          'div',
          { class: 'ps-profile__title-row' },
          h('h1', { class: 'ps-profile__name', text: profile.nombre }),
          profile.privacidad === 'privado'
            ? h(
                'span',
                { class: 'ps-badge ps-badge--neutral ps-profile__privacy' },
                createIcon('lock', { size: 14 }),
                h('span', { text: 'Perfil privado' }),
              )
            : null,
        ),
        h('p', { class: 'ps-profile__handle', text: profile.handle }),
        h('p', { class: 'ps-profile__meta', text: meta.join(' · ') }),
      ),
      h('div', { class: 'ps-profile__actions' }, ...actions),
    ),
    profile.bio ? h('p', { class: 'ps-profile__bio', text: profile.bio }) : null,
    profile.tutor ? h('p', { class: 'ps-profile__tutor', text: tutorLine(profile, own) }) : null,
    h(
      'ul',
      { class: 'ps-profile__stats' },
      stat('Publicaciones', formatCount(profile.stats?.publicaciones)),
      stat('Seguidores', formatCount(profile.stats?.seguidores)),
      stat('Siguiendo', formatCount(profile.stats?.siguiendo)),
    ),
  );
}

function tutorLine(profile, own) {
  const name = profile.tutor.nombre;

  if (own) {
    return `Cuenta de ${name}`;
  }

  return `Tutor: ${name} · ${profile.tutor.handle}`;
}

function stat(label, value) {
  return h(
    'li',
    { class: 'ps-profile__stat' },
    h('span', { class: 'ps-profile__stat-value', text: value }),
    h('span', { class: 'ps-profile__stat-label', text: label }),
  );
}
