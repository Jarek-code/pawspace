import { clearSession, getSession, setSession } from '@/lib/storage.js';
import { post } from '@/services/http.js';

/**
 * Servicio de autenticación de la persona.
 * La mascota activa se elige después del login; no se maneja aquí.
 */
export async function login({ email, password, remember = false }) {
  const data = await post(
    '/usuarios/login',
    {
      email: email.trim(),
      contrasena: password,
    },
    { auth: false },
  );

  setSession({ ...data, email: email.trim() }, remember);
  return data;
}

export async function register({ nombre, email, password }) {
  return post(
    '/usuarios/registro',
    {
      nombre: nombre.trim(),
      email: email.trim(),
      contrasena: password,
    },
    { auth: false },
  );
}

/**
 * La API de registro no devuelve tokens; después de crear la cuenta se inicia
 * sesión con las mismas credenciales para continuar al onboarding.
 */
export async function registerAndLogin({ nombre, email, password, remember = false }) {
  await register({ nombre, email, password });
  return login({ email, password, remember });
}

export function logout() {
  clearSession();
}

export function hasSession() {
  return Boolean(getSession().token);
}

export function currentSession() {
  return getSession();
}
