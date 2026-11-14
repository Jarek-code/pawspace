import { config } from '@/app/config.js';
import { ApiError } from '@/lib/errors.js';
import { getToken } from '@/lib/storage.js';
import { mockRequest } from '@/services/mocks/index.js';

const DEFAULT_TIMEOUT = 15_000;

function parseBody(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }

  return response.text().catch(() => null);
}

function messageFrom(data, status) {
  if (data && typeof data.detail === 'string') {
    return data.detail;
  }

  if (data && Array.isArray(data.detail) && data.detail.length > 0) {
    const first = data.detail[0];
    if (first && typeof first.msg === 'string') {
      return first.msg;
    }
  }

  if (status === 401) {
    return 'Correo o contraseña incorrecta.';
  }

  if (status === 403) {
    return 'Esta cuenta ha sido desactivada.';
  }

  if (status === 404) {
    return 'No encontramos lo que buscabas.';
  }

  if (status >= 500) {
    return 'Ocurrió un error en el servidor. Intenta de nuevo.';
  }

  return 'No pudimos completar la solicitud.';
}

export async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    auth = true,
    signal,
    timeout = DEFAULT_TIMEOUT,
    headers: extraHeaders = {},
  } = options;

  if (config.useMocks) {
    try {
      return await mockRequest(path, { method, body, auth });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError('No pudimos completar la solicitud.', 0, null);
    }
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  const abortFromCaller = () => controller.abort();

  if (signal) {
    signal.addEventListener('abort', abortFromCaller, { once: true });
  }

  const headers = {
    Accept: 'application/json',
    ...extraHeaders,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${config.apiBase}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      signal: controller.signal,
    });

    const data = await parseBody(response);

    if (!response.ok) {
      throw new ApiError(messageFrom(data, response.status), response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new ApiError('La solicitud tardó demasiado. Intenta de nuevo.', 0, null);
    }

    throw new ApiError('No pudimos conectar con el servidor.', 0, null);
  } finally {
    window.clearTimeout(timer);

    if (signal) {
      signal.removeEventListener('abort', abortFromCaller);
    }
  }
}

export function get(path, options = {}) {
  return request(path, { ...options, method: 'GET' });
}

export function post(path, body, options = {}) {
  return request(path, { ...options, method: 'POST', body });
}

export function patch(path, body, options = {}) {
  return request(path, { ...options, method: 'PATCH', body });
}

export function del(path, options = {}) {
  return request(path, { ...options, method: 'DELETE' });
}
