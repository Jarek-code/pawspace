import { ApiError } from '@/lib/errors.js';
import {
  helpArticles,
  helpCategories,
  helpFaqs,
  helpGuides,
  helpPopularTopics,
  helpSuggestions,
  supportFixture,
} from './fixtures/help.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

const state = {
  tickets: clone(supportFixture.tickets),
  feedback: {},
};

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function categoryById(id) {
  return helpCategories.find((category) => category.id === id) || null;
}

function categoryLabel(id) {
  return categoryById(id)?.title || id;
}

function articleBySlug(slug) {
  return helpArticles.find((article) => article.slug === slug) || null;
}

function categoriesWithCounts() {
  return helpCategories.map((category) => ({
    ...category,
    count: helpArticles.filter((article) => article.category === category.id).length,
  }));
}

function guideArticles() {
  return helpGuides.map((slug) => articleBySlug(slug)).filter(Boolean);
}

function articleText(article) {
  const steps = (article.sections || [])
    .flatMap((section) => [
      section.title,
      ...(section.steps || []).flatMap((step) => [step.title, step.body]),
    ])
    .join(' ');

  return normalize(
    [
      article.title,
      article.summary,
      article.intro,
      ...(article.keywords || []),
      steps,
      categoryLabel(article.category),
    ].join(' '),
  );
}

function matches(haystack, query) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => haystack.includes(token));
}

function searchResults(query) {
  const clean = String(query || '').trim();

  if (!clean) {
    return { query: '', articulos: [], categorias: [], preguntas: [], total: 0 };
  }

  const articulos = helpArticles
    .filter((article) => matches(articleText(article), clean))
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      category: article.category,
      categoryTitle: categoryLabel(article.category),
      readingTime: article.readingTime,
    }));

  const categorias = categoriesWithCounts().filter((category) =>
    matches(
      normalize([category.title, category.description, ...(category.keywords || [])].join(' ')),
      clean,
    ),
  );

  const preguntas = helpFaqs.filter((faq) =>
    matches(
      normalize(
        [faq.question, faq.answer, categoryLabel(articleBySlug(faq.slug)?.category)].join(' '),
      ),
      clean,
    ),
  );

  return {
    query: clean,
    articulos,
    categorias,
    preguntas,
    total: articulos.length + categorias.length + preguntas.length,
  };
}

function basePayload() {
  return {
    categorias: categoriesWithCounts(),
    populares: clone(helpPopularTopics),
    preguntasFrecuentes: clone(helpFaqs),
    guias: clone(guideArticles()),
    estado: clone(supportFixture.status),
    sugerencias: [...helpSuggestions],
  };
}

export function helpCenterPayload({ q = '', categoria = '' } = {}) {
  const payload = basePayload();
  const query = String(q || '').trim();
  const category = String(categoria || '').trim();

  if (query) {
    return { ...payload, resultados: searchResults(query) };
  }

  if (category) {
    const found = categoryById(category);

    if (!found) {
      throw new ApiError('No encontramos esa categoría.', 404, { detail: 'Categoría inexistente' });
    }

    const articulos = helpArticles
      .filter((article) => article.category === category)
      .map((article) => ({
        slug: article.slug,
        title: article.title,
        summary: article.summary,
        category: article.category,
        categoryTitle: categoryLabel(article.category),
        readingTime: article.readingTime,
      }));

    return {
      ...payload,
      categoriaActiva: {
        ...categoriesWithCounts().find((item) => item.id === category),
      },
      articulos,
    };
  }

  return payload;
}

export function helpArticlePayload(slug) {
  const article = articleBySlug(slug);

  if (!article) {
    throw new ApiError('No encontramos ese artículo.', 404, { detail: 'Artículo inexistente' });
  }

  const relacionados = (article.related || [])
    .map((relatedSlug) => articleBySlug(relatedSlug))
    .filter(Boolean)
    .map((related) => ({
      slug: related.slug,
      title: related.title,
      summary: related.summary,
      readingTime: related.readingTime,
      category: related.category,
      categoryTitle: categoryLabel(related.category),
    }));

  return {
    articulo: clone(article),
    categoria: clone(categoryById(article.category)),
    relacionados,
    feedback: state.feedback[article.slug] || null,
    estado: clone(supportFixture.status),
  };
}

export function registerHelpFeedback(slug, value) {
  if (!articleBySlug(slug)) {
    throw new ApiError('No encontramos ese artículo.', 404, { detail: 'Artículo inexistente' });
  }

  if (!['si', 'no'].includes(value)) {
    throw new ApiError('Respuesta de ayuda inválida.', 422, { detail: 'Valor no permitido' });
  }

  const previous = state.feedback[slug];

  if (previous) {
    return { feedback: previous, yaEnviado: true };
  }

  state.feedback[slug] = value;
  return { feedback: value, yaEnviado: false };
}

function supportTickets() {
  return clone(state.tickets);
}

/**
 * Bandeja compartida con administración. El panel reutiliza los tickets que la
 * persona crea en /soporte para no duplicar datos de demostración.
 */
export function listSupportTickets() {
  return clone(state.tickets);
}

export function supportPayload() {
  return {
    topics: clone(supportFixture.topics),
    beforeWriting: [...supportFixture.beforeWriting],
    responseTime: clone(supportFixture.responseTime),
    status: clone(supportFixture.status),
    tickets: supportTickets(),
  };
}

function validateTicket(body = {}) {
  const tema = String(body.tema || '').trim();
  const correo = String(body.correo || '').trim();
  const asunto = String(body.asunto || '').trim();
  const descripcion = String(body.descripcion || '').trim();
  const privacidad = Boolean(body.privacidad);
  const adjunto = body.adjunto || null;

  if (!supportFixture.topics.some((topic) => topic.value === tema)) {
    throw new ApiError('Elige un tema para tu solicitud.', 422, { detail: 'Tema obligatorio' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw new ApiError('Escribe un correo de contacto válido.', 422, { detail: 'Correo inválido' });
  }

  if (!asunto) {
    throw new ApiError('Escribe un asunto.', 422, { detail: 'Asunto obligatorio' });
  }

  if (asunto.length > 120) {
    throw new ApiError('El asunto no puede superar los 120 caracteres.', 422, {
      detail: 'Asunto demasiado largo',
    });
  }

  if (!descripcion) {
    throw new ApiError('Cuéntanos qué ocurrió.', 422, { detail: 'Descripción obligatoria' });
  }

  if (descripcion.length > 2000) {
    throw new ApiError('La descripción no puede superar los 2.000 caracteres.', 422, {
      detail: 'Descripción demasiado larga',
    });
  }

  if (!privacidad) {
    throw new ApiError('Acepta la política de privacidad para enviar.', 422, {
      detail: 'Privacidad obligatoria',
    });
  }

  if (adjunto) {
    if (!['image/png', 'image/jpeg'].includes(adjunto.type)) {
      throw new ApiError('La captura debe ser PNG o JPG.', 422, { detail: 'Tipo no permitido' });
    }

    if (Number(adjunto.size) > 5 * 1024 * 1024) {
      throw new ApiError('La captura no puede superar los 5 MB.', 422, {
        detail: 'Adjunto demasiado grande',
      });
    }
  }

  return { tema, correo, asunto, descripcion, adjunto };
}

export function createSupportTicket(body = {}) {
  const data = validateTicket(body);
  const topic = supportFixture.topics.find((item) => item.value === data.tema);
  const nextNumber =
    state.tickets.reduce((max, ticket) => Math.max(max, Number(ticket.id)), 1000) + 1;
  const id = String(nextNumber).padStart(4, '0');

  const ticket = {
    id,
    tema: data.tema,
    asunto: data.asunto,
    fecha: 'Ahora',
    estado: 'ABIERTA',
    ultimoMovimiento: 'Recibimos tu solicitud.',
    detalle: data.descripcion,
    adjunto: data.adjunto
      ? { nombre: data.adjunto.name, tamano: data.adjunto.size, tipo: data.adjunto.type }
      : null,
    cronologia: [{ fecha: 'Ahora', texto: 'Enviaste la solicitud.' }],
  };

  state.tickets = [ticket, ...state.tickets];

  return {
    ticket: clone(ticket),
    temaLabel: topic?.label || data.tema,
    correo: data.correo,
    plazo: '48 horas laborables',
    mensaje: 'Recibimos tu solicitud.',
  };
}

export function reopenSupportTicket(id) {
  const ticket = state.tickets.find((item) => item.id === String(id));

  if (!ticket) {
    throw new ApiError('No encontramos esa solicitud.', 404, { detail: 'Solicitud inexistente' });
  }

  if (!['RESUELTA', 'CERRADA'].includes(ticket.estado)) {
    throw new ApiError('Esta solicitud todavía está abierta.', 409, {
      detail: 'Solicitud abierta',
    });
  }

  ticket.estado = 'ABIERTA';
  ticket.ultimoMovimiento = 'Reabriste la solicitud.';
  ticket.cronologia = [...ticket.cronologia, { fecha: 'Ahora', texto: 'Reabriste la solicitud.' }];

  return { ticket: clone(ticket), tickets: supportTickets() };
}

export function resetHelpState() {
  state.tickets = clone(supportFixture.tickets);
  state.feedback = {};
}

/**
 * Edición de tickets desde la bandeja de administración. El panel comparte los
 * tickets creados en /soporte: responder y cambiar estado aquí se refleja en la
 * vista de la persona.
 */
export function respondUserTicket(id, mensaje) {
  const ticket = state.tickets.find((item) => item.id === String(id));

  if (!ticket) {
    throw new ApiError('No encontramos esa solicitud.', 404, { detail: 'Solicitud inexistente' });
  }

  ticket.ultimoMovimiento = mensaje;
  ticket.cronologia = [...ticket.cronologia, { fecha: 'Ahora', texto: mensaje, propio: true }];

  return clone(ticket);
}

export function setUserTicketState(id, estado) {
  const ticket = state.tickets.find((item) => item.id === String(id));

  if (!ticket) {
    throw new ApiError('No encontramos esa solicitud.', 404, { detail: 'Solicitud inexistente' });
  }

  ticket.estado = estado;
  ticket.ultimoMovimiento = `Estado: ${estado}`;
  ticket.cronologia = [
    ...ticket.cronologia,
    { fecha: 'Ahora', texto: `Estado: ${estado}`, propio: true },
  ];

  return clone(ticket);
}
