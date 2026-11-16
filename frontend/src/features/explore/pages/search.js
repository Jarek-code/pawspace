import { createAppShell } from '@/components/layout/app-shell.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createModal } from '@/components/primitives/modal.js';
import { createSkeleton } from '@/components/primitives/skeleton.js';
import { createTabs } from '@/components/primitives/tabs.js';
import { showToast } from '@/components/primitives/toast.js';
import { createPetCard } from '@/components/explore/pet-card.js';
import { createSearchFilters } from '@/components/explore/search-filters.js';
import { createPostCard } from '@/components/feed/post-card.js';
import { h } from '@/lib/dom.js';
import { currentSession, logout } from '@/services/auth.js';
import { getCurrentPet, listPets } from '@/services/pets.js';
import { addRecentSearch, search } from '@/services/explore.js';
import { toggleFollow } from '@/services/profiles.js';
import { toggleLike } from '@/services/feed.js';
import { accountFromEmail } from '@/features/feed/feed-view.js';

const TYPES = ['todo', 'mascotas', 'publicaciones', 'etiquetas'];
const SUGGESTIONS = ['adopta', 'siamés', 'golden retriever', 'gatos'];

/**
 * D23–D24 / M16–M17 — Resultados de búsqueda.
 * Pestañas por tipo, filtros de especie/raza/orden y estado sin resultados.
 */
export function createPage({ router, query } = {}) {
  const params = query || new URLSearchParams();
  const q = (params.get('q') || '').trim();
  const tipo = TYPES.includes(params.get('tipo')) ? params.get('tipo') : 'todo';
  const especie = params.get('especie') || '';
  const raza = (params.get('raza') || '').trim();
  const orden = params.get('orden') || 'relevancia';

  const stored = getCurrentPet() || listPets(currentSession().email)[0] || null;
  const pet = stored ? { ...stored, handle: `@${stored.usuario}` } : null;
  const account = accountFromEmail(currentSession().email);

  const filterCard = createFilterCard({ especie, raza, orden, onApply: applyFilters });
  const relatedCard = createRelatedCard(router, q);

  const shell = createAppShell({
    activePath: '/explorar',
    title: 'Buscar',
    subtitle: q ? `Resultados para “${q}”` : 'Encuentra mascotas, razas y temas',
    pet,
    account,
    notificationCount: 3,
    backTo: '/explorar',
    onCompose: () => router.navigate('/publicar'),
    onSearch: (value) => submitSearch(router, value, params),
    onLogout: () => {
      logout();
      router.navigate('/', { replace: true });
    },
    rail: h('div', { class: 'ps-search__rail' }, filterCard, relatedCard),
    children: searchLoading(),
  });

  const content = shell.querySelector('.ps-shell__content');
  const rail = shell.querySelector('.ps-rail');

  if (!q && !especie && !raza) {
    content.replaceChildren(
      h(
        'div',
        { class: 'ps-search' },
        searchHeader('Buscar en PawSpace', 'Escribe un nombre, una raza o un tema.'),
        createEmptyState({
          icon: 'search',
          title: '¿Qué quieres encontrar?',
          body: 'Busca mascotas, razas o temas, o empieza por una especie.',
          action: suggestionChips(router, SUGGESTIONS, params),
        }),
      ),
    );
    return shell;
  }

  search({ q, especie, raza, orden })
    .then((data) => render(data))
    .catch(() => {
      rail.replaceChildren();
      content.replaceChildren(
        createEmptyState({
          icon: 'alert',
          title: 'No pudimos completar la búsqueda',
          body: 'Revisa tu conexión e intenta de nuevo.',
          action: createButton({
            label: 'Reintentar',
            variant: 'secondary',
            onClick: () => window.location.reload(),
          }).element,
        }),
      );
    });

  function applyFilters(partial = {}) {
    const next = new URLSearchParams(window.location.search);

    for (const [key, value] of Object.entries(partial)) {
      if (value === '' || value === null || value === undefined) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }

    if (!('tipo' in partial)) {
      next.delete('tipo');
    }

    router.navigate(`/buscar${next.toString() ? `?${next}` : ''}`);
  }

  function render(data) {
    const tabs = createTabs({
      tabs: [
        { value: 'todo', label: `Todo (${data.totales.todo})`, active: tipo === 'todo' },
        {
          value: 'mascotas',
          label: `Mascotas (${data.totales.mascotas})`,
          active: tipo === 'mascotas',
        },
        {
          value: 'publicaciones',
          label: `Publicaciones (${data.totales.publicaciones})`,
          active: tipo === 'publicaciones',
        },
        {
          value: 'etiquetas',
          label: `Etiquetas (${data.totales.etiquetas})`,
          active: tipo === 'etiquetas',
        },
      ],
      onChange: (value) => applyFilters({ tipo: value === 'todo' ? '' : value }),
    });

    const mobileFilters = createButton({
      label: 'Filtros',
      variant: 'secondary',
      iconLeft: createIcon('sliders-horizontal', { size: 18 }),
      onClick: () => openFilters(),
    });
    mobileFilters.element.classList.add('ps-search__filter-button');

    const header = searchHeader(
      q ? `Resultados para “${q}”` : 'Búsqueda por filtros',
      `${data.totales.todo} ${data.totales.todo === 1 ? 'resultado' : 'resultados'}`,
      (value) => submitSearch(router, value, params),
      q,
      mobileFilters.element,
    );

    const panel = data.totales.todo
      ? renderResults({ data, tipo, router, q, applyFilters })
      : emptyResults({ router, q, especie, raza, applyFilters });

    content.replaceChildren(
      h(
        'div',
        { class: 'ps-search' },
        header,
        h('div', { class: 'ps-search__tabs' }, tabs.element),
        panel,
      ),
    );

    if (q) {
      addRecentSearch(q);
    }
  }

  function openFilters() {
    const body = createSearchFilters({
      especie,
      raza,
      orden,
      onApply: (partial) => {
        modal.close();
        applyFilters(partial);
      },
    });
    const modal = createModal({
      title: 'Filtros',
      description: 'Ajusta especie, raza y orden.',
      variant: 'sheet',
      size: 'sm',
      children: body,
    });

    document.body.append(modal.element);
    modal.open();
  }

  return shell;
}

function submitSearch(router, value, params) {
  const clean = String(value || '').trim();

  if (clean.length < 2) {
    showToast('Escribe al menos 2 caracteres para buscar.', { variant: 'error' });
    return;
  }

  const next = new URLSearchParams(params.toString());
  next.set('q', clean);
  next.delete('tipo');
  addRecentSearch(clean);
  router.navigate(`/buscar?${next}`);
}

function searchHeader(title, subtitle, onSubmit = null, value = '', action = null) {
  const input = h('input', {
    class: 'ps-search__input',
    type: 'search',
    value,
    placeholder: 'Busca mascotas, razas o temas',
    attrs: { 'aria-label': 'Buscar mascotas, razas o temas' },
  });

  const form = onSubmit
    ? h(
        'form',
        {
          class: 'ps-search__form',
          role: 'search',
          onSubmit: (event) => {
            event.preventDefault();
            onSubmit(input.value);
          },
        },
        h(
          'span',
          { class: 'ps-search__form-icon', 'aria-hidden': 'true' },
          createIcon('search', { size: 20 }),
        ),
        input,
        createButton({ label: 'Buscar', type: 'submit' }).element,
      )
    : null;

  return h(
    'section',
    { class: 'ps-search__header' },
    h('h2', { class: 'ps-search__title', text: title }),
    h('p', { class: 'ps-search__subtitle', text: subtitle }),
    h('div', { class: 'ps-search__toolbar' }, form, action),
  );
}

function renderResults({ data, tipo, router, q, applyFilters }) {
  if (tipo === 'mascotas') {
    return h(
      'div',
      { class: 'ps-pet-grid' },
      data.mascotas.map((item) => petCard(item, router)),
    );
  }

  if (tipo === 'publicaciones') {
    return postList(data.publicaciones, router);
  }

  if (tipo === 'etiquetas') {
    return tagGrid(data.etiquetas, router, q);
  }

  return h(
    'div',
    { class: 'ps-search__sections' },
    data.mascotas.length
      ? resultSection(
          'Mascotas',
          h(
            'div',
            { class: 'ps-pet-grid' },
            data.mascotas.slice(0, 3).map((item) => petCard(item, router)),
          ),
          data.totales.mascotas > 3 ? viewAll(() => applyFilters({ tipo: 'mascotas' })) : null,
        )
      : null,
    data.publicaciones.length
      ? resultSection(
          'Publicaciones',
          postList(data.publicaciones.slice(0, 3), router),
          data.totales.publicaciones > 3
            ? viewAll(() => applyFilters({ tipo: 'publicaciones' }))
            : null,
        )
      : null,
    data.etiquetas.length
      ? resultSection(
          'Etiquetas',
          tagGrid(data.etiquetas.slice(0, 8), router, q),
          data.totales.etiquetas > 8 ? viewAll(() => applyFilters({ tipo: 'etiquetas' })) : null,
        )
      : null,
  );
}

function resultSection(title, body, action) {
  return h(
    'section',
    { class: 'ps-search__section' },
    h(
      'div',
      { class: 'ps-search__section-head' },
      h('h2', { class: 'ps-search__section-title', text: title }),
      action,
    ),
    body,
  );
}

function viewAll(onClick) {
  return createButton({
    label: 'Ver todo',
    variant: 'ghost',
    size: 'sm',
    iconRight: createIcon('arrow-right', { size: 16 }),
    onClick,
  }).element;
}

function petCard(pet, router) {
  return createPetCard({
    pet,
    onOpen: () => router.navigate(`/mascota/${pet.handle.replace(/^@/, '')}`),
    onFollow: (profile) => toggleFollow(profile.handle),
    onFollowError: (error) =>
      showToast(error?.message || 'No pudimos actualizar el seguimiento.', { variant: 'error' }),
  });
}

function postList(posts, router) {
  return h(
    'div',
    { class: 'ps-search__posts' },
    posts.map((post) =>
      createPostCard({
        post,
        onOpen: () => router.navigate(`/publicacion/${post.id}`),
        onLike: () => toggleLike(post.id),
      }),
    ),
  );
}

function tagGrid(tags, router, q) {
  return h(
    'div',
    { class: 'ps-tag-grid' },
    tags.map((tag) =>
      h(
        'button',
        {
          class: 'ps-tag-card',
          type: 'button',
          onClick: () => {
            const next = new URLSearchParams();
            next.set('q', tag.tag);
            router.navigate(`/buscar?${next}`);
          },
        },
        h('span', { class: 'ps-tag-card__hash', 'aria-hidden': 'true' }, '#'),
        h('span', { class: 'ps-tag-card__label', text: tag.tag }),
        h('span', { class: 'ps-tag-card__count', text: `${tag.count} publicaciones` }),
      ),
    ),
    q ? null : null,
  );
}

function emptyResults({ router, q, especie, raza, applyFilters }) {
  const hasFilters = Boolean(especie || raza);
  const title = q ? `Sin resultados para “${q}”` : 'Sin coincidencias';
  const body = hasFilters
    ? 'Prueba con otra palabra o quita los filtros de especie y raza.'
    : 'Prueba con otra palabra o revisa los temas populares.';

  const actions = h(
    'div',
    { class: 'ps-search__empty-actions' },
    suggestionChips(router, SUGGESTIONS, new URLSearchParams(q ? { q } : {})),
    h(
      'div',
      { class: 'ps-search__empty-buttons' },
      hasFilters
        ? createButton({
            label: 'Quitar filtros',
            variant: 'secondary',
            onClick: () => applyFilters({ especie: '', raza: '', orden: 'relevancia' }),
          }).element
        : null,
      createButton({
        label: 'Explorar mascotas',
        variant: hasFilters ? 'ghost' : 'primary',
        onClick: () => router.navigate('/explorar'),
      }).element,
    ),
  );

  return createEmptyState({
    icon: 'search',
    title,
    body,
    action: actions,
  });
}

function suggestionChips(router, suggestions, params) {
  return h(
    'div',
    { class: 'ps-chip-row' },
    suggestions.map((term) =>
      h(
        'button',
        {
          class: 'ps-chip',
          type: 'button',
          onClick: () => {
            const next = new URLSearchParams(params.toString());
            next.set('q', term);
            next.delete('tipo');
            router.navigate(`/buscar?${next}`);
          },
        },
        createIcon('hash', { size: 14 }),
        h('span', { text: term }),
      ),
    ),
  );
}

function createFilterCard({ especie, raza, orden, onApply }) {
  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Filtros' }),
    createSearchFilters({ especie, raza, orden, onApply }),
  );
}

function createRelatedCard(router, q) {
  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Búsquedas relacionadas' }),
    h(
      'div',
      { class: 'ps-chip-row' },
      SUGGESTIONS.filter((term) => term !== q).map((term) =>
        h(
          'button',
          {
            class: 'ps-chip',
            type: 'button',
            onClick: () => router.navigate(`/buscar?q=${encodeURIComponent(term)}`),
          },
          h('span', { text: term }),
        ),
      ),
    ),
  );
}

function searchLoading() {
  return h(
    'div',
    { class: 'ps-search', attrs: { 'aria-busy': 'true', 'aria-label': 'Buscando' } },
    createSkeleton({ width: '40%', height: '30px' }),
    createSkeleton({ height: '48px', radius: 'var(--ps-radius-md)' }),
    h(
      'div',
      { class: 'ps-pet-grid' },
      ...Array.from({ length: 3 }, () =>
        createSkeleton({ height: '230px', radius: 'var(--ps-radius-lg)' }),
      ),
    ),
  );
}
