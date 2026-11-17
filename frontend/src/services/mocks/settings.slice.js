import { ApiError } from '@/lib/errors.js';
import { settingsFixture } from './fixtures/settings.js';
import { blockedState, findProfile, profilesState } from './profiles.slice.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

const state = {
  cuenta: clone(settingsFixture.cuenta),
  sesiones: clone(settingsFixture.sesiones),
  privacidad: clone(settingsFixture.privacidad),
  filtros: clone(settingsFixture.filtros),
  reportes: clone(settingsFixture.reportes),
};

export function settingsPayload() {
  const bloqueados = Array.from(blockedState)
    .map((handle) => findProfile(handle))
    .filter(Boolean)
    .map((profile) => ({
      id: profile.id,
      nombre: profile.nombre,
      handle: profile.handle,
      avatar: profile.avatar || null,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  return {
    cuenta: clone(state.cuenta),
    sesiones: clone(state.sesiones),
    privacidad: clone(state.privacidad),
    filtros: clone(state.filtros),
    reportes: clone(state.reportes),
    bloqueados,
  };
}

export function updateSettingsAccount(body = {}) {
  const nombre = String(body.nombre ?? state.cuenta.nombre).trim();
  const email = String(body.email ?? state.cuenta.email)
    .trim()
    .toLowerCase();
  const telefono = String(body.telefono ?? state.cuenta.telefono).trim();
  const ubicacion = String(body.ubicacion ?? state.cuenta.ubicacion).trim();
  const bio = String(body.bio ?? state.cuenta.bio).trim();
  const avatar = body.avatar === undefined ? state.cuenta.avatar : body.avatar;

  if (!nombre) {
    throw new ApiError('Escribe tu nombre.', 422, { detail: 'Nombre obligatorio' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError('Escribe un correo electrónico válido.', 422, {
      detail: 'Correo inválido',
    });
  }

  if (bio.length > 300) {
    throw new ApiError('La biografía supera los 300 caracteres.', 422, {
      detail: 'Biografía demasiado larga',
    });
  }

  state.cuenta = {
    ...state.cuenta,
    nombre,
    email,
    telefono,
    ubicacion,
    bio,
    avatar,
  };

  return { cuenta: clone(state.cuenta) };
}

export function updateSettingsPrivacy(body = {}) {
  state.privacidad = {
    ...state.privacidad,
    ...Object.fromEntries(Object.entries(body).filter(([key]) => key in state.privacidad)),
  };

  if (!state.privacidad.perfilPublico) {
    state.privacidad.mostrarUbicacion = false;
  }

  return { privacidad: clone(state.privacidad) };
}

export function updateSettingsFilters(body = {}) {
  state.filtros = {
    ...state.filtros,
    ...Object.fromEntries(Object.entries(body).filter(([key]) => key in state.filtros)),
  };

  return { filtros: clone(state.filtros) };
}

export function closeSession(id) {
  const session = state.sesiones.find((item) => item.id === id);

  if (!session) {
    throw new ApiError('Esa sesión ya no está activa.', 404, { detail: 'Sesión inexistente' });
  }

  state.sesiones = state.sesiones.filter((item) => item.id !== id);
  return { sesiones: clone(state.sesiones), cerradaActual: session.actual };
}

export function closeAllSessions() {
  state.sesiones = state.sesiones.filter((item) => item.actual);
  return { sesiones: clone(state.sesiones) };
}

export function unblockAccount(handle) {
  const clean = String(handle || '').replace(/^@/, '');
  const normalized = `@${clean}`.toLowerCase();

  if (!blockedState.has(normalized)) {
    throw new ApiError('Esa cuenta no está bloqueada.', 404, { detail: 'Bloqueo inexistente' });
  }

  blockedState.delete(normalized);
  return { bloqueados: settingsPayload().bloqueados };
}

export function appealReport(id) {
  const report = state.reportes.find((item) => item.id === id);

  if (!report) {
    throw new ApiError('No encontramos ese reporte.', 404, { detail: 'Reporte inexistente' });
  }

  if (!['RESUELTO', 'RECHAZADO'].includes(report.estado)) {
    throw new ApiError('Este reporte todavía no se puede apelar.', 409, {
      detail: 'Apelación no disponible',
    });
  }

  report.estado = 'APELADO';
  report.cronologia = [
    ...report.cronologia,
    { fecha: 'Ahora', texto: 'Enviaste una apelación para revisar la decisión.' },
  ];

  return { reporte: clone(report) };
}

export function registerPasswordChange() {
  return { mensaje: 'Contraseña actualizada. Cerramos las demás sesiones.' };
}

export function dataDownloadInfo() {
  return {
    mensaje: 'Preparamos tu descarga. Recibirás un enlace por correo.',
    estado: 'EN_PREPARACION',
  };
}

export function accountHandle() {
  return state.cuenta.handle;
}

export function resetSettingsState() {
  state.cuenta = clone(settingsFixture.cuenta);
  state.sesiones = clone(settingsFixture.sesiones);
  state.privacidad = clone(settingsFixture.privacidad);
  state.filtros = clone(settingsFixture.filtros);
  state.reportes = clone(settingsFixture.reportes);

  for (const handle of Object.keys(profilesState)) {
    blockedState.delete(handle);
  }

  blockedState.add('@toby');
  blockedState.add('@coco');
}
