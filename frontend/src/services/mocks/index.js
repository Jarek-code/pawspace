import { config } from '@/app/config.js';
import { ApiError } from '@/lib/errors.js';
import { demoUsers } from './fixtures/auth.js';

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
