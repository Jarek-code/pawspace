import { config } from '@/app/config.js';
import { ApiError } from '@/lib/errors.js';
import { getActivePet, getSession, setSession } from '@/lib/storage.js';
import { demoUsers } from './fixtures/auth.js';
import {
  feedComments,
  feedPosts,
  feedStories,
  feedSugerencias,
  feedTendencias,
} from './fixtures/feed.js';
import { profilePosts } from './fixtures/profiles.js';
import { exploreCategories, exploreTrends, suggestedPets } from './fixtures/explore.js';
import {
  blockedState,
  findProfile,
  followingState,
  pendingState,
  profilesState,
  reportedState,
  similarByHandle,
  suggestionHandles,
} from './profiles.slice.js';
import { archiveState, storyGroupsState } from './stories.slice.js';
import { recentSearchesState } from './explore.slice.js';
import {
  markAllNotificationsRead,
  markNotificationRead,
  notificationsPayload,
} from './notifications.slice.js';
import {
  accountHandle,
  appealReport,
  closeAllSessions,
  closeSession,
  dataDownloadInfo,
  registerPasswordChange,
  settingsPayload,
  unblockAccount,
  updateSettingsAccount,
  updateSettingsFilters,
  updateSettingsPrivacy,
} from './settings.slice.js';
import {
  acceptRequest,
  findConversation,
  findRequest,
  ignoreRequest,
  inboxPayload,
  messageSuggestionHandles,
  reportConversation,
  sendMessage,
  toggleBlock as toggleConversationBlock,
  toggleSilence,
} from './messages.slice.js';
import {
  createSupportTicket,
  helpArticlePayload,
  helpCenterPayload,
  registerHelpFeedback,
  reopenSupportTicket,
  supportPayload,
} from './help.slice.js';
import {
  acceptAdminAppeal,
  adminAppealDetail,
  adminAppealsPayload,
  adminReportDetail,
  adminReportsPayload,
  adminSummaryPayload,
  adminTicketDetail,
  adminTicketsPayload,
  adminArticleDetail,
  adminArticlesPayload,
  adminHelpCategories,
  adminUserDetail,
  adminUsersPayload,
  markAdminReportReview,
  moderateAdminContent,
  moveAdminCategory,
  rejectAdminAppeal,
  rejectAdminReport,
  resolveAdminReport,
  respondAdminTicket,
  saveAdminArticle,
  saveAdminCategory,
  setAdminArticleStatus,
  setAdminTicketState,
  reactivateAdminUser,
  suspendAdminUser,
  toggleAdminCategory,
} from './admin.slice.js';

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

function parseQuery(path) {
  const queryIndex = path.indexOf('?');

  if (queryIndex === -1) {
    return new URLSearchParams();
  }

  return new URLSearchParams(path.slice(queryIndex + 1));
}

const registeredUsers = [];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const feedState = clone(feedPosts);
const commentsState = clone(feedComments);
let postCounter = 0;
let commentCounter = 0;
let storyCounter = 0;

function allUsers() {
  return [...demoUsers, ...registeredUsers];
}

function findUser(email) {
  return allUsers().find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function activeHandle() {
  const pet = getActivePet();
  return pet?.usuario ? `@${pet.usuario}` : '@luna';
}

function ownProfile() {
  const pet = getActivePet();
  const handle = activeHandle();
  const baseHandle = handle === '@tobias' ? '@toby' : handle;
  const base = findProfile(baseHandle);

  return {
    ...(base || {}),
    id: pet?.id || base?.id || 'pet_luna',
    nombre: pet?.nombre || base?.nombre || 'Luna',
    handle,
    especie: pet?.especie || base?.especie || '',
    raza: pet?.raza || base?.raza || '',
    sexo: pet?.sexo || base?.sexo || '',
    fechaNacimiento: pet?.fechaNacimiento || base?.fechaNacimiento || '',
    bio: pet?.bio ?? base?.bio ?? '',
    privacidad: pet?.privacidad || base?.privacidad || 'publico',
    avatar: pet?.avatar || null,
    tutor: base?.tutor || null,
    stats: base?.stats || { publicaciones: 0, seguidores: 0, siguiendo: 0 },
    publicaciones: base?.publicaciones || [],
    esPropia: true,
    siguiendo: false,
  };
}

function profileSummary(profile) {
  return {
    id: profile.id,
    nombre: profile.nombre,
    handle: profile.handle,
    especie: profile.especie,
    raza: profile.raza,
    bio: profile.bio,
    avatar: profile.avatar || null,
    seguidores: profile.stats?.seguidores || 0,
    publicaciones: profile.stats?.publicaciones || 0,
    siguiendo: followingState.has(profile.handle),
    pendiente: pendingState.has(profile.handle),
    esPropia: false,
  };
}

function profilePayload(handle) {
  const normalized = String(handle || '').toLowerCase();
  const own = ownProfile();

  if (normalized === own.handle.toLowerCase()) {
    return {
      ...own,
      sugerencias: suggestionHandles
        .map((item) => profilesState[item])
        .filter(Boolean)
        .map(profileSummary),
    };
  }

  const profile = findProfile(normalized);

  if (!profile) {
    throw new ApiError('No encontramos esta mascota.', 404, {
      detail: 'Perfil inexistente',
    });
  }

  const bloqueado = blockedState.has(profile.handle);
  const siguiendo = followingState.has(profile.handle);
  const privadoBloqueado = profile.privacidad === 'privado' && !siguiendo;
  const similares = (similarByHandle[profile.handle] || [])
    .map((item) => profilesState[item])
    .filter(Boolean)
    .map(profileSummary);

  return {
    ...profile,
    esPropia: false,
    bloqueado,
    siguiendo,
    pendiente: pendingState.has(profile.handle),
    contenidoBloqueado: bloqueado || privadoBloqueado,
    publicaciones: bloqueado || privadoBloqueado ? [] : profile.publicaciones,
    similares: bloqueado ? [] : similares,
  };
}

function updateOwnProfile({ body }) {
  const own = ownProfile();
  const nombre = String(body?.nombre ?? own.nombre).trim();
  const usuario = String(body?.usuario ?? own.handle.replace(/^@/, '')).trim();
  const bio = String(body?.bio ?? own.bio ?? '');

  if (!nombre) {
    throw new ApiError('Escribe el nombre de tu mascota.', 422, {
      detail: 'Nombre obligatorio',
    });
  }

  if (!/^[A-Za-z0-9._]{3,30}$/.test(usuario)) {
    throw new ApiError('Usa entre 3 y 30 caracteres: letras, números, punto o guion bajo.', 422, {
      detail: 'Nombre de usuario inválido',
    });
  }

  if (bio.length > 1000) {
    throw new ApiError('La biografía supera los 1000 caracteres.', 422, {
      detail: 'Biografía demasiado larga',
    });
  }

  const taken = Object.values(profilesState).some(
    (profile) =>
      profile.handle.toLowerCase() === `@${usuario}`.toLowerCase() &&
      profile.handle.toLowerCase() !== own.handle.toLowerCase(),
  );

  if (taken) {
    throw new ApiError('Ese nombre de usuario ya está ocupado.', 409, {
      detail: 'Nombre de usuario ocupado',
    });
  }

  return {
    ...own,
    nombre,
    handle: `@${usuario}`,
    especie: body?.especie ?? own.especie,
    raza: body?.raza ?? own.raza,
    sexo: body?.sexo ?? own.sexo,
    fechaNacimiento: body?.fechaNacimiento ?? own.fechaNacimiento,
    bio,
    privacidad: body?.privacidad ?? own.privacidad,
    avatar: body?.avatar ?? own.avatar,
    esPropia: true,
  };
}

function toggleFollow({ path }) {
  const handle = decodeURIComponent(path.split('/')[2] || '').toLowerCase();

  if (handle === ownProfile().handle.toLowerCase()) {
    throw new ApiError('No puedes seguir a tu propia mascota.', 400, {
      detail: 'Perfil propio',
    });
  }

  if (!findProfile(handle)) {
    throw new ApiError('No encontramos esta mascota.', 404, {
      detail: 'Perfil inexistente',
    });
  }

  const profile = findProfile(handle);

  if (blockedState.has(handle)) {
    throw new ApiError('Desbloquea esta mascota para volver a seguirla.', 403, {
      detail: 'Perfil bloqueado',
    });
  }

  if (pendingState.has(handle)) {
    pendingState.delete(handle);
    return { handle, siguiendo: false, pendiente: false };
  }

  if (followingState.has(handle)) {
    followingState.delete(handle);
    return { handle, siguiendo: false, pendiente: false };
  }

  if (profile.privacidad === 'privado') {
    pendingState.add(handle);
    return { handle, siguiendo: false, pendiente: true };
  }

  followingState.add(handle);

  return { handle, siguiendo: true, pendiente: false };
}

function reportProfile({ path }) {
  const handle = decodeURIComponent(path.split('/')[2] || '').toLowerCase();

  if (!findProfile(handle)) {
    throw new ApiError('No encontramos esta mascota.', 404, {
      detail: 'Perfil inexistente',
    });
  }

  reportedState.add(handle);
  return { reportado: true };
}

function toggleBlock({ path }) {
  const handle = decodeURIComponent(path.split('/')[2] || '').toLowerCase();

  if (!findProfile(handle)) {
    throw new ApiError('No encontramos esta mascota.', 404, {
      detail: 'Perfil inexistente',
    });
  }

  if (blockedState.has(handle)) {
    blockedState.delete(handle);
  } else {
    blockedState.add(handle);
    followingState.delete(handle);
    pendingState.delete(handle);
  }

  return { bloqueado: blockedState.has(handle) };
}

function allStories() {
  return [...storyGroupsState.flatMap((group) => group.stories), ...archiveState];
}

function findStory(id) {
  return allStories().find((item) => item.id === id) || null;
}

function storyViewer({ path }) {
  const handle = decodeURIComponent(path.split('/')[2] || '')
    .toLowerCase()
    .replace(/^@/, '');
  const inicio = storyGroupsState.findIndex(
    (group) => group.handle.toLowerCase().replace(/^@/, '') === handle,
  );

  if (inicio === -1) {
    throw new ApiError('Esta historia ya no está disponible.', 404, {
      detail: 'Historias inexistentes',
    });
  }

  return {
    inicio,
    grupos: storyGroupsState.map((group) => ({
      ...group,
      stories: group.stories.map((item) => ({ ...item, media: { ...item.media } })),
    })),
  };
}

function createStory({ body }) {
  const media = body?.media;

  if (!media?.url || !media?.type) {
    throw new ApiError('Elige una foto o un video para tu historia.', 422, {
      detail: 'Historia sin contenido',
    });
  }

  if (media.type === 'video' && Number(media.size || 0) > 100 * 1024 * 1024) {
    throw new ApiError('El video supera los 100 MB.', 422, {
      detail: 'Archivo demasiado grande',
    });
  }

  const handle = body?.mascota?.handle || activeHandle();
  const nombre = body?.mascota?.nombre || getActivePet()?.nombre || 'Tu mascota';
  let group = storyGroupsState.find(
    (item) => item.handle.toLowerCase() === String(handle).toLowerCase(),
  );

  if (!group) {
    group = { handle, nombre, propia: true, stories: [] };
    storyGroupsState.unshift(group);
  }

  storyCounter += 1;
  const historia = {
    id: `story_nueva_${Date.now()}_${storyCounter}`,
    media: { ...media },
    vistas: 0,
    likes: 0,
    meGusta: false,
    propia: true,
    creadoEn: 'Ahora',
    venceEn: 24,
  };

  group.stories.unshift(historia);

  return { historia };
}

function storyView({ path }) {
  const id = path.split('/')[2];
  const historia = findStory(id);

  if (!historia) {
    throw new ApiError('Esta historia ya no está disponible.', 404, {
      detail: 'Historia inexistente',
    });
  }

  historia.vistas = Number(historia.vistas || 0) + 1;

  return { id, vistas: historia.vistas };
}

function toggleStoryLike({ path }) {
  const id = path.split('/')[2];
  const historia = findStory(id);

  if (!historia) {
    throw new ApiError('Esta historia ya no está disponible.', 404, {
      detail: 'Historia inexistente',
    });
  }

  historia.meGusta = !historia.meGusta;
  historia.likes = Math.max(0, Number(historia.likes || 0) + (historia.meGusta ? 1 : -1));

  return { id, meGusta: historia.meGusta, likes: historia.likes };
}

function storyArchive() {
  const own = storyGroupsState.find(
    (group) => group.handle.toLowerCase() === activeHandle().toLowerCase(),
  );

  return {
    activas: own ? own.stories.map((item) => ({ ...item, media: { ...item.media } })) : [],
    archivadas: archiveState.map((item) => ({ ...item, media: { ...item.media } })),
  };
}

function deleteStory({ path }) {
  const id = path.split('/')[2];

  for (const group of storyGroupsState) {
    const index = group.stories.findIndex((item) => item.id === id);

    if (index !== -1) {
      group.stories.splice(index, 1);
      return { eliminada: true, id };
    }
  }

  const archiveIndex = archiveState.findIndex((item) => item.id === id);

  if (archiveIndex !== -1) {
    archiveState.splice(archiveIndex, 1);
    return { eliminada: true, id };
  }

  throw new ApiError('Esta historia ya no está disponible.', 404, {
    detail: 'Historia inexistente',
  });
}

function explorePayload() {
  return {
    tendencias: exploreTrends,
    categorias: exploreCategories,
    sugerencias: suggestedPets
      .map((handle) => findProfile(handle))
      .filter(Boolean)
      .map(profileSummary),
    busquedasRecientes: [...recentSearchesState],
  };
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function searchPayload({ query }) {
  const consulta = String(query.get('q') || '').trim();
  const especie = String(query.get('especie') || '').trim();
  const raza = String(query.get('raza') || '').trim();
  const orden = String(query.get('orden') || 'relevancia');
  const needle = normalizeText(consulta);

  if (consulta.length < 2 && !especie && !raza) {
    return {
      consulta,
      totales: { todo: 0, mascotas: 0, publicaciones: 0, etiquetas: 0 },
      mascotas: [],
      publicaciones: [],
      etiquetas: [],
    };
  }

  const own = ownProfile();
  const allProfiles = [own, ...Object.values(profilesState)];

  let mascotas = allProfiles.filter((profile) => {
    const haystack = normalizeText(
      [profile.nombre, profile.handle, profile.especie, profile.raza, profile.bio].join(' '),
    );
    return haystack.includes(needle);
  });

  if (especie) {
    mascotas = mascotas.filter((profile) => profile.especie === especie);
  }

  if (raza) {
    mascotas = mascotas.filter((profile) => normalizeText(profile.raza) === normalizeText(raza));
  }

  const speciesByHandle = new Map(
    allProfiles.map((profile) => [profile.handle.toLowerCase(), profile.especie]),
  );

  let publicaciones = [...feedState, ...profilePosts].filter((post) => {
    const haystack = normalizeText(
      [post.texto, post.media?.caption, post.mascota?.nombre, post.mascota?.handle].join(' '),
    );
    return haystack.includes(needle);
  });

  if (especie) {
    publicaciones = publicaciones.filter(
      (post) => speciesByHandle.get(post.mascota?.handle?.toLowerCase()) === especie,
    );
  }

  if (orden === 'recientes') {
    publicaciones = [...publicaciones].reverse();
  }

  const etiquetas = exploreTrends.filter((trend) =>
    normalizeText(trend.tag).includes(needle.replace(/^#/, '')),
  );

  const seen = new Set();

  mascotas = mascotas
    .filter((profile) => {
      const key = profile.handle.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((profile) =>
      profile.esPropia
        ? {
            ...profileSummary(profile),
            esPropia: true,
          }
        : profileSummary(profile),
    );

  return {
    consulta,
    totales: {
      todo: mascotas.length + publicaciones.length + etiquetas.length,
      mascotas: mascotas.length,
      publicaciones: publicaciones.length,
      etiquetas: etiquetas.length,
    },
    mascotas,
    publicaciones: publicaciones.slice(0, 18),
    etiquetas,
  };
}

function suggestionSummaries(handles) {
  return handles
    .map((handle) => profilesState[handle])
    .filter(Boolean)
    .map(profileSummary);
}

function notificationsResponse() {
  return {
    ...notificationsPayload(),
    sugerencias: suggestionSummaries(['@milo', '@nala', '@kira']),
  };
}

function messagesResponse() {
  return {
    ...inboxPayload(),
    sugerencias: suggestionSummaries(messageSuggestionHandles),
  };
}

function conversationHandle(path) {
  return decodeURIComponent(path.split('/')[2] || '');
}

function messageThread({ path }) {
  const handle = conversationHandle(path);
  const conversation = findConversation(handle);

  if (!conversation) {
    if (findRequest(handle)) {
      throw new ApiError('Acepta la solicitud antes de abrir la conversación.', 409, {
        detail: 'Solicitud pendiente',
      });
    }

    throw new ApiError('No encontramos esta conversación.', 404, {
      detail: 'Conversación inexistente',
    });
  }

  return {
    conversacion: conversation,
    mensajes: conversation.mensajes,
  };
}

function createMessage({ path, body }) {
  return sendMessage({ handle: conversationHandle(path), body });
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
    es_admin: Boolean(user.es_admin),
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

function settingsResponse() {
  return settingsPayload();
}

function settingsAccountUpdate({ body }) {
  const nextEmail = String(body?.email || '')
    .trim()
    .toLowerCase();
  const current = String(settingsPayload().cuenta.email || '').toLowerCase();

  if (nextEmail && nextEmail !== current && findUser(nextEmail)) {
    throw new ApiError('Ese correo ya está registrado.', 409, {
      detail: 'Ese correo ya está registrado.',
    });
  }

  const result = updateSettingsAccount(body);
  const session = getSession();
  const user = findUser(session.email);

  if (user) {
    user.nombre = result.cuenta.nombre;
    user.email = result.cuenta.email;

    if (session.token) {
      setSession(
        {
          token_acceso: session.token,
          token_tipo: session.tokenType,
          sesion_id: session.sessionId,
          email: result.cuenta.email,
        },
        Boolean(window.localStorage.getItem('pawspace.token')),
      );
    }
  }

  return result;
}

function settingsPassword({ body }) {
  const actual = String(body?.actual || '');
  const nueva = String(body?.nueva || '');

  if (nueva.length < 8) {
    throw new ApiError('La contraseña nueva debe tener al menos 8 caracteres.', 422, {
      detail: 'Contraseña demasiado corta.',
    });
  }

  if (actual === nueva) {
    throw new ApiError('La contraseña nueva debe ser distinta de la actual.', 422, {
      detail: 'Contraseña repetida.',
    });
  }

  const user = findUser(getSession().email);

  if (!user || user.contrasena !== actual) {
    throw new ApiError('La contraseña actual no es correcta.', 422, {
      detail: 'Contraseña actual incorrecta.',
    });
  }

  user.contrasena = nueva;
  closeAllSessions();
  return registerPasswordChange();
}

function settingsDelete({ query }) {
  const handle = String(query.get('handle') || '')
    .trim()
    .toLowerCase();

  if (handle !== accountHandle().toLowerCase()) {
    throw new ApiError('Escribe el nombre de usuario exacto para confirmar.', 422, {
      detail: 'Confirmación incorrecta.',
    });
  }

  const user = findUser(getSession().email);

  if (user) {
    user.activo = false;
  }

  return { mensaje: 'Tu cuenta fue eliminada.' };
}

function findPost(id) {
  return (
    feedState.find((post) => post.id === id) || profilePosts.find((post) => post.id === id) || null
  );
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
    pattern: /^\/historias\/archivo$/,
    handler: storyArchive,
  },
  {
    method: 'POST',
    pattern: /^\/historias$/,
    handler: createStory,
  },
  {
    method: 'GET',
    pattern: /^\/historias\/[^/]+$/,
    handler: storyViewer,
  },
  {
    method: 'POST',
    pattern: /^\/historias\/[^/]+\/vista$/,
    handler: storyView,
  },
  {
    method: 'POST',
    pattern: /^\/historias\/[^/]+\/me-gusta$/,
    handler: toggleStoryLike,
  },
  {
    method: 'DELETE',
    pattern: /^\/historias\/[^/]+$/,
    handler: deleteStory,
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
  {
    method: 'GET',
    pattern: /^\/ajustes$/,
    handler: settingsResponse,
  },
  {
    method: 'PATCH',
    pattern: /^\/ajustes\/cuenta$/,
    handler: settingsAccountUpdate,
  },
  {
    method: 'PATCH',
    pattern: /^\/ajustes\/privacidad$/,
    handler: ({ body }) => updateSettingsPrivacy(body),
  },
  {
    method: 'PATCH',
    pattern: /^\/ajustes\/seguridad$/,
    handler: ({ body }) => updateSettingsFilters(body),
  },
  {
    method: 'POST',
    pattern: /^\/ajustes\/contrasena$/,
    handler: settingsPassword,
  },
  {
    method: 'POST',
    pattern: /^\/ajustes\/descargar$/,
    handler: () => dataDownloadInfo(),
  },
  {
    method: 'POST',
    pattern: /^\/ajustes\/reportes\/[^/]+\/apelar$/,
    handler: ({ path }) => appealReport(decodeURIComponent(path.split('/')[3] || '')),
  },
  {
    method: 'DELETE',
    pattern: /^\/ajustes\/sesiones\/[^/]+$/,
    handler: ({ path }) => closeSession(decodeURIComponent(path.split('/')[3] || '')),
  },
  {
    method: 'DELETE',
    pattern: /^\/ajustes\/sesiones$/,
    handler: () => closeAllSessions(),
  },
  {
    method: 'DELETE',
    pattern: /^\/ajustes\/bloqueos\/[^/]+$/,
    handler: ({ path }) => unblockAccount(decodeURIComponent(path.split('/')[3] || '')),
  },
  {
    method: 'DELETE',
    pattern: /^\/ajustes\/cuenta$/,
    handler: settingsDelete,
  },
  {
    method: 'GET',
    pattern: /^\/ayuda$/,
    handler: ({ query }) =>
      helpCenterPayload({
        q: query.get('q') || '',
        categoria: query.get('categoria') || '',
      }),
  },
  {
    method: 'GET',
    pattern: /^\/ayuda\/[^/]+$/,
    handler: ({ path }) => helpArticlePayload(decodeURIComponent(path.split('/')[2] || '')),
  },
  {
    method: 'POST',
    pattern: /^\/ayuda\/[^/]+\/feedback$/,
    handler: ({ path, body }) =>
      registerHelpFeedback(decodeURIComponent(path.split('/')[2] || ''), body?.valor),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/resumen$/,
    handler: () => adminSummaryPayload(),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/reportes$/,
    handler: ({ query }) =>
      adminReportsPayload({
        estado: query.get('estado') || 'todos',
        categoria: query.get('categoria') || '',
        tipo: query.get('tipo') || '',
        fecha: query.get('fecha') || '',
        q: query.get('q') || '',
        page: query.get('page') || 1,
      }),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/reportes\/[^/]+$/,
    handler: ({ path }) => adminReportDetail(decodeURIComponent(path.split('/')[3] || '')),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/reportes\/[^/]+\/en-revision$/,
    handler: ({ path }) => markAdminReportReview(decodeURIComponent(path.split('/')[3] || '')),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/reportes\/[^/]+\/resolver$/,
    handler: ({ path, body }) =>
      resolveAdminReport(decodeURIComponent(path.split('/')[3] || ''), body?.nota),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/reportes\/[^/]+\/rechazar$/,
    handler: ({ path, body }) =>
      rejectAdminReport(decodeURIComponent(path.split('/')[3] || ''), body?.motivo),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/reportes\/[^/]+\/moderar$/,
    handler: ({ path, body }) =>
      moderateAdminContent(decodeURIComponent(path.split('/')[3] || ''), body),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/apelaciones$/,
    handler: ({ query }) =>
      adminAppealsPayload({
        estado: query.get('estado') || 'todos',
        q: query.get('q') || '',
        page: query.get('page') || 1,
      }),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/apelaciones\/[^/]+$/,
    handler: ({ path }) => adminAppealDetail(decodeURIComponent(path.split('/')[3] || '')),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/apelaciones\/[^/]+\/aceptar$/,
    handler: ({ path, body }) =>
      acceptAdminAppeal(decodeURIComponent(path.split('/')[3] || ''), body?.resolucion),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/apelaciones\/[^/]+\/rechazar$/,
    handler: ({ path, body }) =>
      rejectAdminAppeal(decodeURIComponent(path.split('/')[3] || ''), body?.resolucion),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/soporte$/,
    handler: ({ query }) =>
      adminTicketsPayload({
        estado: query.get('estado') || '',
        tema: query.get('tema') || '',
        q: query.get('q') || '',
        page: query.get('page') || 1,
      }),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/soporte\/[^/]+$/,
    handler: ({ path }) => adminTicketDetail(decodeURIComponent(path.split('/')[3] || '')),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/soporte\/[^/]+\/responder$/,
    handler: ({ path, body }) =>
      respondAdminTicket(decodeURIComponent(path.split('/')[3] || ''), body?.mensaje),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/soporte\/[^/]+\/estado$/,
    handler: ({ path, body }) =>
      setAdminTicketState(decodeURIComponent(path.split('/')[3] || ''), body?.estado),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/usuarios$/,
    handler: ({ query }) =>
      adminUsersPayload({
        filtro: query.get('filtro') || 'todos',
        q: query.get('q') || '',
        page: query.get('page') || 1,
      }),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/usuarios\/[^/]+$/,
    handler: ({ path }) => adminUserDetail(decodeURIComponent(path.split('/')[3] || '')),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/usuarios\/[^/]+\/suspender$/,
    handler: ({ path, body }) =>
      suspendAdminUser(decodeURIComponent(path.split('/')[3] || ''), body?.motivo),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/usuarios\/[^/]+\/reactivar$/,
    handler: ({ path }) => reactivateAdminUser(decodeURIComponent(path.split('/')[3] || '')),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/ayuda$/,
    handler: ({ query }) =>
      adminArticlesPayload({
        q: query.get('q') || '',
        categoria: query.get('categoria') || '',
        estado: query.get('estado') || '',
        page: query.get('page') || 1,
      }),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/ayuda\/categorias$/,
    handler: () => ({ categorias: adminHelpCategories() }),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/ayuda\/categorias$/,
    handler: ({ body }) => saveAdminCategory(body),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/ayuda\/categorias\/[^/]+\/alternar$/,
    handler: ({ path }) => toggleAdminCategory(decodeURIComponent(path.split('/')[4] || '')),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/ayuda\/categorias\/[^/]+\/mover$/,
    handler: ({ path, body }) =>
      moveAdminCategory(decodeURIComponent(path.split('/')[4] || ''), body?.direction),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/ayuda\/[^/]+$/,
    handler: ({ path }) => adminArticleDetail(decodeURIComponent(path.split('/')[3] || '')),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/ayuda$/,
    handler: ({ body }) => saveAdminArticle(body),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/ayuda\/[^/]+\/estado$/,
    handler: ({ path, body }) =>
      setAdminArticleStatus(decodeURIComponent(path.split('/')[3] || ''), body?.estado),
  },
  {
    method: 'GET',
    pattern: /^\/soporte$/,
    handler: () => supportPayload(),
  },
  {
    method: 'POST',
    pattern: /^\/soporte$/,
    handler: ({ body }) => createSupportTicket(body),
  },
  {
    method: 'POST',
    pattern: /^\/soporte\/[^/]+\/reabrir$/,
    handler: ({ path }) => reopenSupportTicket(decodeURIComponent(path.split('/')[2] || '')),
  },
  {
    method: 'GET',
    pattern: /^\/perfiles\/mios$/,
    handler: () => profilePayload(activeHandle()),
  },
  {
    method: 'PATCH',
    pattern: /^\/perfiles\/mios$/,
    handler: updateOwnProfile,
  },
  {
    method: 'POST',
    pattern: /^\/perfiles\/[^/]+\/seguir$/,
    handler: toggleFollow,
  },
  {
    method: 'POST',
    pattern: /^\/perfiles\/[^/]+\/reportar$/,
    handler: reportProfile,
  },
  {
    method: 'POST',
    pattern: /^\/perfiles\/[^/]+\/bloquear$/,
    handler: toggleBlock,
  },
  {
    method: 'GET',
    pattern: /^\/perfiles\/[^/]+$/,
    handler: ({ path }) => profilePayload(decodeURIComponent(path.split('/')[2] || '')),
  },
  {
    method: 'GET',
    pattern: /^\/explorar$/,
    handler: explorePayload,
  },
  {
    method: 'GET',
    pattern: /^\/buscar$/,
    handler: searchPayload,
  },
  {
    method: 'GET',
    pattern: /^\/notificaciones$/,
    handler: notificationsResponse,
  },
  {
    method: 'POST',
    pattern: /^\/notificaciones\/leer-todas$/,
    handler: () => markAllNotificationsRead(),
  },
  {
    method: 'POST',
    pattern: /^\/notificaciones\/[^/]+\/leer$/,
    handler: ({ path }) => markNotificationRead(decodeURIComponent(path.split('/')[2] || '')),
  },
  {
    method: 'GET',
    pattern: /^\/mensajes$/,
    handler: messagesResponse,
  },
  {
    method: 'POST',
    pattern: /^\/mensajes\/solicitudes\/[^/]+\/aceptar$/,
    handler: ({ path }) => acceptRequest(conversationHandle(path.replace('/solicitudes', ''))),
  },
  {
    method: 'POST',
    pattern: /^\/mensajes\/solicitudes\/[^/]+\/ignorar$/,
    handler: ({ path }) => ignoreRequest(conversationHandle(path.replace('/solicitudes', ''))),
  },
  {
    method: 'GET',
    pattern: /^\/mensajes\/[^/]+$/,
    handler: messageThread,
  },
  {
    method: 'POST',
    pattern: /^\/mensajes\/[^/]+$/,
    handler: createMessage,
  },
  {
    method: 'POST',
    pattern: /^\/mensajes\/[^/]+\/silenciar$/,
    handler: ({ path }) => toggleSilence(conversationHandle(path)),
  },
  {
    method: 'POST',
    pattern: /^\/mensajes\/[^/]+\/bloquear$/,
    handler: ({ path }) => toggleConversationBlock(conversationHandle(path)),
  },
  {
    method: 'POST',
    pattern: /^\/mensajes\/[^/]+\/reportar$/,
    handler: ({ path }) => reportConversation(conversationHandle(path)),
  },
];

export async function mockRequest(path, { method = 'GET', body } = {}) {
  const normalized = normalizePath(path);
  const query = parseQuery(path);
  const route = routes.find(
    (candidate) => candidate.method === method && candidate.pattern.test(normalized),
  );

  await delay(config.mockLatency);

  if (!route) {
    throw new ApiError('Este recurso todavía no está disponible en el modo de demostración.', 404, {
      detail: 'Mock no implementado',
    });
  }

  return route.handler({ body, path: normalized, query });
}
