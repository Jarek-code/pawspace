import { createAppShell } from '@/components/layout/app-shell.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createSkeleton } from '@/components/primitives/skeleton.js';
import { showToast } from '@/components/primitives/toast.js';
import { createPetCard } from '@/components/explore/pet-card.js';
import { h } from '@/lib/dom.js';
import { currentSession, logout } from '@/services/auth.js';
import { getCurrentPet, listPets } from '@/services/pets.js';
import { toggleFollow } from '@/services/profiles.js';
import { addRecentSearch, clearRecentSearches, loadExplore } from '@/services/explore.js';
import { accountFromEmail } from '@/features/feed/feed-view.js';

/**
 * D22 / M15 — Explorar.
 * Buscador, temas populares, mascotas sugeridas y categorías por especie.
 */
export function createPage({ router } = {}) {
  const stored = getCurrentPet() || listPets(currentSession().email)[0] || null;
  const pet = stored ? { ...stored, handle: `@${stored.usuario}` } : null;
  const account = accountFromEmail(currentSession().email);

  const shell = createAppShell({
    activePath: '/explorar',
    title: 'Explorar',
    subtitle: 'Encuentra mascotas, razas y temas',
    pet,
    account,
    notificationCount: 3,
    onCompose: () => router.navigate('/publicar'),
    onSearch: (query) => goSearch(router, query),
    onLogout: () => {
      logout();
      router.navigate('/', { replace: true });
    },
    rail: recentRail([], () => router.navigate('/explorar', { replace: true })),
    children: exploreLoading(),
  });

  const content = shell.querySelector('.ps-shell__content');
  const rail = shell.querySelector('.ps-rail');

  loadExplore()
    .then((data) => {
      render(data);
    })
    .catch(() => {
      rail.replaceChildren();
      content.replaceChildren(
        createEmptyState({
          icon: 'alert',
          title: 'No pudimos cargar explorar',
          body: 'Revisa tu conexión e intenta de nuevo.',
          action: createButton({
            label: 'Reintentar',
            variant: 'secondary',
            onClick: () => router.navigate('/explorar', { replace: true }),
          }).element,
        }),
      );
    });

  function render(data) {
    const searchInput = h('input', {
      class: 'ps-explore__input',
      type: 'search',
      placeholder: 'Busca mascotas, razas o temas',
      attrs: { 'aria-label': 'Buscar mascotas, razas o temas' },
    });

    const recentHost = h('div', { class: 'ps-explore__recent' });

    function refreshRail(items) {
      rail.replaceChildren(
        ...recentRail(items, () => {
          const next = clearRecentSearches();
          paintRecent(next);
          refreshRail(next);
        }),
        aboutRail(),
      );
    }

    function paintRecent(items) {
      recentHost.replaceChildren();

      if (!items.length) {
        recentHost.append(
          h('p', {
            class: 'ps-explore__recent-empty',
            text: 'Tus búsquedas aparecerán aquí.',
          }),
        );
        return;
      }

      recentHost.append(
        h(
          'div',
          { class: 'ps-chip-row' },
          items.map((term) =>
            h(
              'button',
              {
                class: 'ps-chip',
                type: 'button',
                onClick: () => goSearch(router, term),
              },
              createIcon('clock', { size: 14 }),
              h('span', { text: term }),
            ),
          ),
        ),
        h(
          'button',
          {
            class: 'ps-link-button',
            type: 'button',
            onClick: () => {
              const next = clearRecentSearches();
              paintRecent(next);
              refreshRail(next);
            },
          },
          'Limpiar búsquedas',
        ),
      );
    }

    paintRecent(data.busquedasRecientes || []);
    refreshRail(data.busquedasRecientes || []);

    const hero = h(
      'section',
      { class: 'ps-explore__hero' },
      h('p', { class: 'ps-explore__kicker', text: 'Descubre' }),
      h('h2', { class: 'ps-explore__title', text: 'Nuevas mascotas, nuevas historias' }),
      h('p', {
        class: 'ps-explore__lead',
        text: 'Busca por nombre, raza o tema, y encuentra a la próxima mascota que querrás seguir.',
      }),
      h(
        'form',
        {
          class: 'ps-explore__search',
          role: 'search',
          onSubmit: (event) => {
            event.preventDefault();
            submitSearch(router, searchInput.value);
          },
        },
        h(
          'span',
          { class: 'ps-explore__search-icon', 'aria-hidden': 'true' },
          createIcon('search', { size: 20 }),
        ),
        searchInput,
        createButton({ label: 'Buscar', type: 'submit' }).element,
      ),
      recentHost,
    );

    const trends = h(
      'section',
      { class: 'ps-explore__section', attrs: { 'aria-labelledby': 'explore-trends' } },
      h(
        'div',
        { class: 'ps-explore__section-head' },
        h('h2', {
          class: 'ps-explore__section-title',
          id: 'explore-trends',
          text: 'Temas populares',
        }),
        h('p', {
          class: 'ps-explore__section-note',
          text: 'Lo que más se comparte esta semana.',
        }),
      ),
      h(
        'div',
        { class: 'ps-trend-grid' },
        data.tendencias.map((trend) =>
          h(
            'button',
            {
              class: 'ps-trend-card',
              type: 'button',
              onClick: () => goSearch(router, trend.tag),
            },
            h('span', { class: 'ps-trend-card__tag', text: trend.tag }),
            h('span', { class: 'ps-trend-card__count', text: trend.count }),
            h(
              'span',
              { class: 'ps-trend-card__arrow', 'aria-hidden': 'true' },
              createIcon('arrow-right', { size: 16 }),
            ),
          ),
        ),
      ),
    );

    const pets = h(
      'section',
      { class: 'ps-explore__section', attrs: { 'aria-labelledby': 'explore-pets' } },
      h(
        'div',
        { class: 'ps-explore__section-head' },
        h('h2', {
          class: 'ps-explore__section-title',
          id: 'explore-pets',
          text: 'Mascotas para seguir',
        }),
        h('p', {
          class: 'ps-explore__section-note',
          text: 'Perfiles activos que quizá no conoces.',
        }),
      ),
      h(
        'div',
        { class: 'ps-pet-grid' },
        data.sugerencias.map((item) =>
          createPetCard({
            pet: item,
            onOpen: () => router.navigate(`/mascota/${item.handle.replace(/^@/, '')}`),
            onFollow: (profile) => toggleFollow(profile.handle),
            onFollowError: (error) =>
              showToast(error?.message || 'No pudimos actualizar el seguimiento.', {
                variant: 'error',
              }),
          }),
        ),
      ),
    );

    const categories = h(
      'section',
      { class: 'ps-explore__section', attrs: { 'aria-labelledby': 'explore-categories' } },
      h(
        'div',
        { class: 'ps-explore__section-head' },
        h('h2', {
          class: 'ps-explore__section-title',
          id: 'explore-categories',
          text: 'Explora por especie',
        }),
      ),
      h(
        'div',
        { class: 'ps-category-grid' },
        data.categorias.map((category) =>
          h(
            'button',
            {
              class: 'ps-category-card',
              type: 'button',
              onClick: () =>
                router.navigate(`/buscar?especie=${encodeURIComponent(category.value)}`),
            },
            h(
              'span',
              { class: 'ps-category-card__icon', 'aria-hidden': 'true' },
              createIcon(category.icon, { size: 24 }),
            ),
            h('span', { class: 'ps-category-card__label', text: category.label }),
            h('span', { class: 'ps-category-card__count', text: category.count }),
          ),
        ),
      ),
    );

    content.replaceChildren(h('div', { class: 'ps-explore' }, hero, trends, pets, categories));
  }

  return shell;
}

function recentRail(items, onClear) {
  const cards = [
    h(
      'section',
      { class: 'ps-rail__card' },
      h('h2', { class: 'ps-rail__title', text: 'Búsquedas recientes' }),
      items.length
        ? h(
            'ul',
            { class: 'ps-rail__list' },
            items.map((term) =>
              h(
                'li',
                { class: 'ps-rail__row' },
                h('span', { class: 'ps-rail__row-handle', text: term }),
              ),
            ),
          )
        : h('p', {
            class: 'ps-explore__recent-empty',
            text: 'Tus búsquedas aparecerán aquí.',
          }),
      items.length
        ? h('button', { class: 'ps-rail__link', type: 'button', onClick: onClear }, 'Limpiar')
        : null,
    ),
  ];

  return cards;
}

function aboutRail() {
  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Cómo explorar' }),
    h(
      'ul',
      { class: 'ps-story-tips' },
      h('li', { text: 'Busca por nombre, raza o tema.' }),
      h('li', { text: 'Filtra por especie desde las categorías.' }),
      h('li', { text: 'Sigue perfiles para verlos en tu feed.' }),
    ),
  );
}

function exploreLoading() {
  return h(
    'div',
    { class: 'ps-explore', attrs: { 'aria-busy': 'true', 'aria-label': 'Cargando explorar' } },
    h(
      'section',
      { class: 'ps-explore__hero' },
      createSkeleton({ width: '20%', height: '14px' }),
      createSkeleton({ width: '58%', height: '34px' }),
      createSkeleton({ width: '80%', height: '16px' }),
      createSkeleton({ height: '52px', radius: 'var(--ps-radius-md)' }),
    ),
    h(
      'div',
      { class: 'ps-pet-grid' },
      ...Array.from({ length: 3 }, () =>
        createSkeleton({ height: '230px', radius: 'var(--ps-radius-lg)' }),
      ),
    ),
  );
}

function submitSearch(router, value) {
  const clean = String(value || '').trim();

  if (clean.length < 2) {
    showToast('Escribe al menos 2 caracteres para buscar.', { variant: 'error' });
    return;
  }

  addRecentSearch(clean);
  goSearch(router, clean);
}

function goSearch(router, query) {
  const clean = String(query || '').trim();
  router.navigate(clean ? `/buscar?q=${encodeURIComponent(clean)}` : '/buscar');
}
