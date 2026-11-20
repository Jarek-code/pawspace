import { createHelpArticle } from '@/components/help/help-article.js';
import { createArticleRail } from '@/components/help/help-rail.js';
import { showToast } from '@/components/primitives/toast.js';
import { loadHelpArticle, sendHelpFeedback } from '@/services/help.js';
import { createHelpError, mountHelpShell, openStatusHistory } from '@/features/help/help-shell.js';

/**
 * D32 / M25 — Artículo de ayuda.
 * El índice lateral sigue la sección visible; el feedback es único y el
 * enlace de vuelta conserva la búsqueda o categoría de origen.
 */
export function createPage({ router, params, query } = {}) {
  const slug = String(params?.slug || '');
  const from = String(query?.get('desde') || '');
  const backTo = from.startsWith('/ayuda') ? from : '/ayuda';

  const shell = mountHelpShell({
    router,
    title: 'Centro de ayuda',
    mobileTitle: 'Artículo',
    subtitle: 'Respuestas rápidas y contacto con soporte',
    backTo,
  });

  loadHelpArticle(slug)
    .then((data) => paint(data))
    .catch((error) => {
      if (error?.status === 404) {
        showToast('Este artículo ya no está disponible.', { variant: 'error' });
        router.navigate('/ayuda', { replace: true });
        return;
      }

      shell.content.replaceChildren(
        createHelpError({
          title: 'No pudimos cargar el artículo',
          body: 'Revisa tu conexión e intenta de nuevo.',
          onRetry: () => router.navigate(`/ayuda/${encodeURIComponent(slug)}`, { replace: true }),
        }),
      );
    });

  function paint(data) {
    shell.subtitle.textContent = data.categoria?.title || 'Centro de ayuda';

    const rail = createArticleRail({
      pet: shell.pet,
      data,
      onChangePet: () => router.navigate('/elegir-mascota'),
      onContact: () => router.navigate('/soporte'),
      onStatusHistory: () => openStatusHistory(data.estado),
    });

    shell.rail.replaceChildren(...rail);

    const article = createHelpArticle({
      article: data.articulo,
      category: data.categoria,
      related: data.relacionados,
      feedback: data.feedback,
      backHref: backTo,
      onFeedback: (value) => sendHelpFeedback(slug, value),
    });

    shell.content.replaceChildren(article.element);
    syncIndex(rail.index, article.element);

    const hash = decodeURIComponent(window.location.hash.slice(1));

    if (hash) {
      window.setTimeout(() => {
        const target = document.getElementById(hash);

        if (target) {
          target.scrollIntoView({ block: 'start' });
          rail.index.setActive(hash);
        }
      }, 0);
    }
  }

  return shell.shell;
}

function syncIndex(index, articleElement) {
  if (!index || typeof IntersectionObserver === 'undefined') {
    return;
  }

  const sections = Array.from(
    articleElement.querySelectorAll('#antes-de-empezar, .ps-help-section'),
  );

  if (!sections.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length) {
        index.setActive(visible[0].target.id);
      }
    },
    { rootMargin: '-96px 0px -55% 0px', threshold: [0, 1] },
  );

  for (const section of sections) {
    observer.observe(section);
  }
}
