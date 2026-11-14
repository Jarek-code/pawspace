/**
 * Almacenamiento de sesión, tema y mascota activa.
 *
 * La sesión vive en localStorage si la persona marcó "Mantener sesión
 * iniciada"; si no, en sessionStorage. Nunca se guarda la contraseña.
 * Los accesos se protegen con try/catch para navegadores con almacenamiento
 * restringido.
 */

const KEYS = {
  token: 'pawspace.token',
  tokenType: 'pawspace.token_tipo',
  sessionId: 'pawspace.sesion',
  email: 'pawspace.email',
  theme: 'pawspace.theme',
  activePet: 'pawspace.activePet',
};

function safeGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
    // Sin almacenamiento disponible la sesión dura lo que la pestaña.
  }
}

function safeRemove(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // Nada que limpiar.
  }
}

function readFrom(storage, key) {
  return safeGet(storage, key);
}

function clearStorage(storage) {
  for (const key of Object.values(KEYS)) {
    safeRemove(storage, key);
  }
}

export function setSession({ token_acceso, token_tipo, sesion_id, email }, remember = false) {
  const destination = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;

  clearStorage(other);

  safeSet(destination, KEYS.token, token_acceso || '');
  safeSet(destination, KEYS.tokenType, token_tipo || 'bearer');
  safeSet(destination, KEYS.sessionId, sesion_id || '');
  safeSet(destination, KEYS.email, email || '');
}

export function getSession() {
  const token = readFrom(sessionStorage, KEYS.token) || readFrom(localStorage, KEYS.token);
  const storage = readFrom(sessionStorage, KEYS.token) ? sessionStorage : localStorage;

  return {
    token,
    tokenType: readFrom(storage, KEYS.tokenType) || 'bearer',
    sessionId: readFrom(storage, KEYS.sessionId),
    email: readFrom(storage, KEYS.email),
  };
}

export function getToken() {
  return getSession().token;
}

export function clearSession() {
  clearStorage(localStorage);
  clearStorage(sessionStorage);
}

export function getTheme() {
  const theme = safeGet(localStorage, KEYS.theme);
  return theme === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme) {
  safeSet(localStorage, KEYS.theme, theme === 'dark' ? 'dark' : 'light');
}

export function getActivePet() {
  const value = safeGet(localStorage, KEYS.activePet) || safeGet(sessionStorage, KEYS.activePet);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function setActivePet(pet) {
  const value = pet ? JSON.stringify(pet) : '';
  safeSet(localStorage, KEYS.activePet, value);
}
