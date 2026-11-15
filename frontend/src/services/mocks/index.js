import { config } from '@/app/config.js';
import { ApiError } from '@/lib/errors.js';
import { demoUsers } from './fixtures/auth.js';
import {
  feedComments,
  feedPosts,
  feedStories,
  feedSugerencias,
  feedTendencias,
} from './fixtures/feed.js';

/**
 * Adaptador de mocks.
 *
 * Mantiene la misma forma de error que la API real (ApiError) y devuelve
 * payloads realistas para que las pantallas se construyan sin backend de
 * dominio. Cuando exista el endpoint real, se apaga con VITE_USE_MOCKS=false.
 */

function delay(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function normalizePath(path) {
  const clean = path.split('?')[0];
  return clean.startsWith('/') ? clean : `/${clean}`;
}

const registeredUsers = [];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const feedState = clone(feedPosts);
const commentsState = clone(feedComments);
let postCounter = 0;
let commentCounter = 0;

function allUsers() {
  return [...demoUsers, ...registeredUsers];
}

function findUser(email) {
  return allUsers().find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function login({ body }) {
  const email = String(body?.email || '')
    .trim()
    .toLowerCase();
  const password = String(body?.contrasena || '');
  const user = findUser(email);

  if (!user || user.contrasena !== password) {
    throw new ApiError('Correo o contraseña incorrecta.', 401, {
      detail: 'Correo o contrasena incorrecta',
    });
  }

  if (!user.activo) {
    throw new ApiError('Esta cuenta ha sido desactivada.', 403, {
      detail: 'Esta cuenta ha sido desactivada.',
    });
  }

  return {
    token_acceso: `mock.${user.id}.${Date.now()}`,
    token_tipo: 'bearer',
    sesion_id: `ses_demo_${user.id}`,
    email: user.email,
  };
}

function register({ body }) {
  const email = String(body?.email || '').trim();
  const nombre = String(body?.nombre || '').trim();
  const password = String(body?.contrasena || '');

  if (!nombre || !email || !password) {
    throw new ApiError('Revisa los datos del formulario.', 422, {
      detail: [{ msg: 'Nombre, correo y contraseña son obligatorios.' }],
    });
  }

  if (findUser(email)) {
    throw new ApiError('Ese correo ya está registrado.', 400, {
      detail: 'Ese correo ya está registrado.',
    });
  }

  registeredUsers.push({
    id: 100 + registeredUsers.length,
    nombre,
    email: email.toLowerCase(),
    contrasena: password,
    activo: true,
  });

  return { mensaje: 'Usuario creado con exito' };
}

function findPost(id) {
  return feedState.find((post) => post.id === id) || null;
}

function createFeedPost({ body }) {
  const texto = String(body?.texto || '').trim();
  const media = body?.media || null;

  if (!texto && !media) {
    throw new ApiError('Escribe algo o agrega una foto antes de publicar.', 422, {
      detail: 'La publicación está vacía.',
    });
  }

  if (texto.length > 500) {
    throw new ApiError('La publicación supera los 500 caracteres.', 422, {
      detail: 'Texto demasiado largo.',
    });
  }

  postCounter += 1;
  const post = {
    id: `post_nuevo_${Date.now()}_${postCounter}`,
    mascota: body?.mascota || { nombre: 'Tu mascota', handle: '@mascota' },
    tiempo: 'Ahora',
    texto,
    media,
    likes: 0,
    comentarios: 0,
    meGusta: false,
    guardado: false,
  };

  feedState.unshift(post);
  commentsState[post.id] = [];

  return { publicacion: post };
}

function feedPost({ path }) {
  const id = path.split('/')[2];
  const post = findPost(id);

  if (!post) {
    throw new ApiError('Esta publicación ya no está disponible.', 404, {
      detail: 'Publicación inexistente',
    });
  }

  post.comentarios = (commentsState[id] || []).length;

  return {
    publicacion: post,
    comentarios: commentsState[id] || [],
  };
}

function createComment({ path, body }) {
  const id = path.split('/')[2];
  const post = findPost(id);

  if (!post) {
    throw new ApiError('Esta publicación ya no está disponible.', 404, {
      detail: 'Publicación inexistente',
    });
  }

  const texto = String(body?.texto || '').trim();

  if (!texto) {
    throw new ApiError('Escribe un comentario antes de enviarlo.', 422, {
      detail: 'El comentario está vacío.',
    });
  }

  commentCounter += 1;
  const comentario = {
    id: `comment_nuevo_${Date.now()}_${commentCounter}`,
    mascota: body?.mascota || { nombre: 'Tu mascota', handle: '@mascota' },
    tiempo: 'Ahora',
    texto,
  };

  commentsState[id] = [...(commentsState[id] || []), comentario];
  post.comentarios = commentsState[id].length;

  return { comentario, comentarios: post.comentarios };
}

function togglePostLike({ path }) {
  const id = path.split('/')[2];
  const post = findPost(id);

  if (!post) {
    throw new ApiError('Esta publicación ya no está disponible.', 404, {
      detail: 'Publicación inexistente',
    });
  }

  post.meGusta = !post.meGusta;
  post.likes = Math.max(0, post.likes + (post.meGusta ? 1 : -1));

  return { meGusta: post.meGusta, likes: post.likes };
}

const routes = [
  {
    method: 'POST',
    pattern: /^\/usuarios\/login$/,
    handler: login,
  },
  {
    method: 'POST',
    pattern: /^\/usuarios\/registro$/,
    handler: register,
  },
  {
    method: 'GET',
    pattern: /^\/health$/,
    handler: () => ({ status: 'healthy' }),
  },
  {
    method: 'GET',
    pattern: /^\/feed$/,
    handler: () => ({ publicaciones: feedState }),
  },
  {
    method: 'POST',
    pattern: /^\/feed$/,
    handler: createFeedPost,
  },
  {
    method: 'GET',
    pattern: /^\/feed\/[^/]+$/,
    handler: feedPost,
  },
  {
    method: 'POST',
    pattern: /^\/feed\/[^/]+\/comentarios$/,
    handler: createComment,
  },
  {
    method: 'POST',
    pattern: /^\/feed\/[^/]+\/me-gusta$/,
    handler: togglePostLike,
  },
  {
    method: 'GET',
    pattern: /^\/historias$/,
    handler: () => ({ historias: feedStories }),
  },
  {
    method: 'GET',
    pattern: /^\/sugerencias$/,
    handler: () => ({ sugerencias: feedSugerencias }),
  },
  {
    method: 'GET',
    pattern: /^\/tendencias$/,
    handler: () => ({ tendencias: feedTendencias }),
  },
];

export async function mockRequest(path, { method = 'GET', body } = {}) {
  const normalized = normalizePath(path);
  const route = routes.find(
    (candidate) => candidate.method === method && candidate.pattern.test(normalized),
  );

  await delay(config.mockLatency);

  if (!route) {
    throw new ApiError('Este recurso todavía no está disponible en el modo de demostración.', 404, {
      detail: 'Mock no implementado',
    });
  }

  return route.handler({ body, path: normalized });
}
