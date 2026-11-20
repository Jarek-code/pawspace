import { ApiError } from '@/lib/errors.js';
import { helpArticles, helpCategories } from '../fixtures/help.js';
import { clone } from './shared.js';

const INITIAL_CATEGORIES = [
  ...helpCategories.map((category, index) => ({
    id: category.id,
    nombre: category.title,
    slug: category.id,
    descripcion: category.description,
    orden: index + 1,
    activa: true,
  })),
  {
    id: 'historias',
    nombre: 'Historias',
    slug: 'historias',
    descripcion: 'Historias y contenido efímero.',
    orden: 5,
    activa: true,
  },
  {
    id: 'otro',
    nombre: 'Otro',
    slug: 'otro',
    descripcion: 'Otros temas de la comunidad.',
    orden: 6,
    activa: true,
  },
];

const INITIAL_ARTICLES = helpArticles.map((article, index) => ({
  id: `a_${article.slug}`,
  slug: article.slug,
  titulo: article.title,
  categoriaId: article.category,
  resumen: article.summary,
  contenido: article.sections?.map((section) => section.title).join('\n') || article.intro || '',
  minutos: article.readingTime || 4,
  estado: index % 5 === 4 ? 'BORRADOR' : index % 7 === 6 ? 'RETIRADO' : 'PUBLICADO',
  orden: index + 1,
  actualizado: article.updated || '12 nov 2026',
  creado: '01 nov 2026',
}));

export const articlesState = {
  helpCategories: clone(INITIAL_CATEGORIES),
  helpArticles: clone(INITIAL_ARTICLES),
};

export function resetArticlesState() {
  articlesState.helpCategories = clone(INITIAL_CATEGORIES);
  articlesState.helpArticles = clone(INITIAL_ARTICLES);
}

const ARTICLE_STATES = ['BORRADOR', 'PUBLICADO', 'RETIRADO'];

function categoriaNombre(id) {
  return articlesState.helpCategories.find((category) => category.id === id)?.nombre || id;
}

export function adminHelpCategories() {
  return articlesState.helpCategories
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((category) => ({
      ...clone(category),
      articulos: articlesState.helpArticles.filter((article) => article.categoriaId === category.id)
        .length,
    }));
}

export function adminArticlesPayload({
  q = '',
  categoria = '',
  estado = '',
  page = 1,
  pageSize = 8,
} = {}) {
  const articles = articlesState.helpArticles.map((article) => ({
    ...clone(article),
    categoriaNombre: categoriaNombre(article.categoriaId),
  }));

  const conteos = {
    publicados: articles.filter((article) => article.estado === 'PUBLICADO').length,
    borradores: articles.filter((article) => article.estado === 'BORRADOR').length,
    retirados: articles.filter((article) => article.estado === 'RETIRADO').length,
  };

  const needle = q.toLowerCase();
  const filtered = articles
    .filter((article) => (estado ? article.estado === estado : true))
    .filter((article) => (categoria ? article.categoriaId === categoria : true))
    .filter((article) =>
      needle
        ? [article.titulo, article.slug, article.resumen]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(needle))
        : true,
    );

  const total = filtered.length;
  const pagina = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || 8);
  const inicio = (pagina - 1) * size;

  return {
    articulos: filtered
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .slice(inicio, inicio + size),
    total,
    pagina,
    paginaSize: size,
    conteos,
    categorias: adminHelpCategories(),
  };
}

function findAdminArticle(id) {
  const article = articlesState.helpArticles.find((item) => item.id === String(id));

  if (!article) {
    throw new ApiError('No encontramos ese artículo.', 404, { detail: 'Artículo inexistente' });
  }

  return article;
}

export function adminArticleDetail(id) {
  const article = findAdminArticle(id);

  return { ...clone(article), categoriaNombre: categoriaNombre(article.categoriaId) };
}

function validarSlug(slug, exceptId = null) {
  const limpio = String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!limpio) {
    throw new ApiError('Escribe un slug para el artículo.', 422, { detail: 'Slug vacío' });
  }

  const ocupado = articlesState.helpArticles.some(
    (article) => article.slug === limpio && article.id !== exceptId,
  );

  if (ocupado) {
    throw new ApiError(`Ese slug ya está en uso. Prueba con ${limpio}-2.`, 409, {
      detail: 'Slug duplicado',
      sugerencia: `${limpio}-2`,
    });
  }

  return limpio;
}

export function saveAdminArticle(payload = {}) {
  const titulo = String(payload.titulo || '').trim();
  const categoriaId = String(payload.categoriaId || '').trim();
  const resumen = String(payload.resumen || '').trim();
  const contenido = String(payload.contenido || '').trim();
  const estado = ARTICLE_STATES.includes(payload.estado) ? payload.estado : 'BORRADOR';

  if (estado === 'PUBLICADO' && (!titulo || !categoriaId || !resumen || !contenido)) {
    throw new ApiError('Para publicar necesitas título, categoría, resumen y contenido.', 422, {
      detail: 'Artículo incompleto',
    });
  }

  const existing = payload.id ? findAdminArticle(payload.id) : null;
  const slug = validarSlug(payload.slug || titulo, existing?.id || null);

  const data = {
    titulo,
    slug,
    categoriaId,
    resumen,
    contenido,
    minutos: Number(payload.minutos) || 4,
    estado,
    orden: Number(payload.orden) || articlesState.helpArticles.length + 1,
    actualizado: 'Ahora',
  };

  if (existing) {
    Object.assign(existing, data);
    return clone(existing);
  }

  const article = {
    id: `a_${slug}_${Date.now()}`,
    creado: 'Ahora',
    ...data,
  };
  articlesState.helpArticles.push(article);

  return clone(article);
}

export function setAdminArticleStatus(id, estado) {
  if (!ARTICLE_STATES.includes(estado)) {
    throw new ApiError('Elige un estado válido.', 422, { detail: 'Estado inválido' });
  }

  const article = findAdminArticle(id);

  if (
    estado === 'PUBLICADO' &&
    (!article.titulo || !article.categoriaId || !article.resumen || !article.contenido)
  ) {
    throw new ApiError('Para publicar necesitas título, categoría, resumen y contenido.', 422, {
      detail: 'Artículo incompleto',
    });
  }

  article.estado = estado;
  article.actualizado = 'Ahora';

  return clone(article);
}

export function saveAdminCategory(payload = {}) {
  const nombre = String(payload.nombre || '').trim();

  if (!nombre) {
    throw new ApiError('Escribe el nombre de la categoría.', 422, { detail: 'Nombre vacío' });
  }

  const slug = String(payload.slug || nombre)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const existing = payload.id
    ? articlesState.helpCategories.find((item) => item.id === payload.id)
    : null;

  const ocupado = articlesState.helpCategories.some(
    (category) => category.slug === slug && category.id !== existing?.id,
  );

  if (ocupado) {
    throw new ApiError('Ese slug de categoría ya está en uso.', 409, { detail: 'Slug duplicado' });
  }

  const data = {
    nombre,
    slug,
    descripcion: String(payload.descripcion || '').trim(),
    orden: Number(payload.orden) || articlesState.helpCategories.length + 1,
    activa: payload.activa !== false,
  };

  if (existing) {
    Object.assign(existing, data);
    return clone(existing);
  }

  const category = { id: `c_${slug}_${Date.now()}`, ...data };
  articlesState.helpCategories.push(category);

  return clone(category);
}

export function toggleAdminCategory(id) {
  const category = articlesState.helpCategories.find((item) => item.id === String(id));

  if (!category) {
    throw new ApiError('No encontramos esa categoría.', 404, { detail: 'Categoría inexistente' });
  }

  category.activa = !category.activa;

  return clone(category);
}

export function moveAdminCategory(id, direction) {
  const sorted = articlesState.helpCategories.slice().sort((a, b) => a.orden - b.orden);
  const index = sorted.findIndex((category) => category.id === String(id));

  if (index === -1) {
    throw new ApiError('No encontramos esa categoría.', 404, { detail: 'Categoría inexistente' });
  }

  const target = direction === 'up' ? index - 1 : index + 1;

  if (target < 0 || target >= sorted.length) {
    return adminHelpCategories();
  }

  const current = sorted[index];
  const other = sorted[target];
  const temp = current.orden;
  current.orden = other.orden;
  other.orden = temp;

  return adminHelpCategories();
}
