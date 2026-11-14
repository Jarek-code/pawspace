import { clear, h } from '@/lib/dom.js';

/**
 * Router con History API. Las rutas se declaran en main.js y cada página se
 * carga con import() dinámico para que el bundle inicial sea pequeño.
 *
 * Contrato de una ruta:
 *   { path, title?, load?, guard?, redirect? }
 *
 * Contrato de una página:
 *   export function createPage({ router, params, query }) => HTMLElement
 */

function normalizePath(pathname) {
  const clean = pathname.replace(/\/+$/, '');
  return clean === '' ? '/' : clean;
}

function matchPath(pattern, pathname) {
  if (pattern === '*') {
    return {};
  }

  const patternParts = normalizePath(pattern).split('/').filter(Boolean);
  const pathParts = normalizePath(pathname).split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params = {};

  for (let index = 0; index < patternParts.length; index += 1) {
    const expected = patternParts[index];
    const actual = pathParts[index];

    if (expected.startsWith(':')) {
      params[expected.slice(1)] = decodeURIComponent(actual);
      continue;
    }

    if (expected !== actual) {
      return null;
    }
  }

  return params;
}

function createErrorView(error) {
  const isNetwork = error && error.status === 0;

  return h(
    'main',
    { id: 'contenido', class: 'ps-route-error' },
    h('h1', { class: 'ps-h2' }, 'Algo salió mal'),
    h(
      'p',
      { class: 'ps-body' },
      isNetwork
        ? 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.'
        : 'No pudimos cargar esta pantalla. Intenta de nuevo.',
    ),
    h('p', {}, h('a', { href: '/', class: 'ps-body' }, 'Volver al inicio')),
  );
}

export function createRouter({ routes, outlet, guards = {}, onAfterRender }) {
  let renderToken = 0;
  const api = { navigate, start, render };

  function findRoute(pathname) {
    for (const route of routes) {
      const params = matchPath(route.path, pathname);

      if (params !== null) {
        return { route, params };
      }
    }

    return null;
  }

  function navigate(to, { replace = false } = {}) {
    if (!to) {
      return;
    }

    if (replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }

    return render();
  }

  async function render() {
    const token = ++renderToken;
    const pathname = normalizePath(window.location.pathname);
    const found = findRoute(pathname);

    if (!found) {
      clear(outlet).append(createErrorView({ status: 404 }));
      return;
    }

    const { route, params } = found;
    const query = new URLSearchParams(window.location.search);

    if (route.redirect) {
      const target =
        typeof route.redirect === 'function' ? route.redirect({ params, query }) : route.redirect;
      await navigate(target, { replace: true });
      return;
    }

    const guard = route.guard ? guards[route.guard] : null;

    if (guard) {
      const redirect = guard({ params, query });

      if (redirect) {
        await navigate(redirect, { replace: true });
        return;
      }
    }

    try {
      const module = await route.load();

      if (token !== renderToken) {
        return;
      }

      const factory = module.createPage || module.default;

      if (typeof factory !== 'function') {
        throw new Error(`La ruta ${route.path} no exporta createPage().`);
      }

      const node = await factory({ router: api, params, query });

      if (token !== renderToken) {
        return;
      }

      clear(outlet).append(node);
      document.title = route.title ? `${route.title} · PawSpace` : 'PawSpace';
      window.scrollTo(0, 0);

      const main = outlet.querySelector('main') || outlet;
      main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });

      if (onAfterRender) {
        onAfterRender({ route, params, query });
      }
    } catch (error) {
      if (token !== renderToken) {
        return;
      }

      console.error(error);
      clear(outlet).append(createErrorView(error));
    }
  }

  function handleClick(event) {
    if (event.defaultPrevented || event.button !== 0) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const anchor = event.target.closest('a');

    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
      return;
    }

    if (anchor.dataset.native !== undefined) {
      return;
    }

    const href = anchor.getAttribute('href');

    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    const url = new URL(anchor.href, window.location.href);

    if (url.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();
    navigate(`${url.pathname}${url.search}${url.hash}`);
  }

  function start() {
    document.addEventListener('click', handleClick);
    window.addEventListener('popstate', render);
    return render();
  }

  return api;
}
