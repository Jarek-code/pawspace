import { createAvatar } from '@/components/primitives/avatar.js';
import { h } from '@/lib/dom.js';
import { formatAge } from '@/lib/format.js';

/**
 * Vista previa de D18/M11. Refleja los campos editables sin guardar.
 */
export function createProfilePreview(profile) {
  const avatarHost = h('div', { class: 'ps-preview__avatar' });
  const name = h('h2', { class: 'ps-preview__name' });
  const handle = h('p', { class: 'ps-preview__handle' });
  const meta = h('p', { class: 'ps-preview__meta' });
  const bio = h('p', { class: 'ps-preview__bio' });

  const element = h(
    'section',
    { class: 'ps-rail__card ps-preview', attrs: { 'aria-label': 'Vista previa del perfil' } },
    h('h2', { class: 'ps-rail__title', text: 'Vista previa' }),
    avatarHost,
    name,
    handle,
    meta,
    bio,
  );

  function update(next) {
    avatarHost.replaceChildren(
      createAvatar({ name: next.nombre || profile.nombre, src: next.avatar, size: 'lg' }),
    );
    name.textContent = next.nombre || profile.nombre;
    handle.textContent = next.usuario ? `@${next.usuario}` : profile.handle;
    meta.textContent = [next.especie || profile.especie, next.raza || profile.raza]
      .filter(Boolean)
      .join(' · ');
    bio.textContent = next.bio || 'Tu biografía aparecerá aquí.';
    bio.classList.toggle('is-empty', !next.bio);
    const age = formatAge(next.fechaNacimiento || profile.fechaNacimiento);

    if (age !== 'Edad no indicada') {
      meta.textContent = `${meta.textContent}${meta.textContent ? ' · ' : ''}${age}`;
    }
  }

  update(profile);

  return { element, update };
}
