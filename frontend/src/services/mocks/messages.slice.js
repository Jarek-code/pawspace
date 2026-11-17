import { ApiError } from '@/lib/errors.js';
import { conversationRequests, conversations, messageSuggestions } from './fixtures/messages.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export const conversationsState = clone(conversations);
export const requestsState = clone(conversationRequests);
export const messageSuggestionHandles = [...messageSuggestions];

export function normalizeHandle(value) {
  const clean = String(value || '')
    .trim()
    .toLowerCase();
  return clean.startsWith('@') ? clean : `@${clean}`;
}

export function findConversation(handle) {
  const normalized = normalizeHandle(handle);
  return (
    conversationsState.find((item) => item.mascota.handle.toLowerCase() === normalized) || null
  );
}

export function findRequest(handle) {
  const normalized = normalizeHandle(handle);
  return requestsState.find((item) => item.mascota.handle.toLowerCase() === normalized) || null;
}

export function inboxPayload() {
  const visibles = conversationsState.filter((item) => !item.bloqueada);

  return {
    conversaciones: visibles,
    solicitudes: requestsState,
    totales: {
      conversaciones: visibles.length,
      sinLeer: visibles.reduce((total, item) => total + Number(item.noLeidos || 0), 0),
      solicitudes: requestsState.length,
    },
  };
}

export function sendMessage({ handle, body }) {
  const conversation = findConversation(handle);

  if (!conversation) {
    const pending = findRequest(handle);

    if (pending) {
      throw new ApiError('Acepta la solicitud antes de enviar mensajes.', 409, {
        detail: 'Solicitud pendiente',
      });
    }

    throw new ApiError('No encontramos esta conversación.', 404, {
      detail: 'Conversación inexistente',
    });
  }

  const texto = String(body?.texto || '').trim();
  const adjunto = body?.adjunto || null;

  if (!texto && !adjunto) {
    throw new ApiError('Escribe un mensaje antes de enviarlo.', 422, {
      detail: 'Mensaje vacío',
    });
  }

  if (texto.length > 4000) {
    throw new ApiError('El mensaje supera los 4000 caracteres.', 422, {
      detail: 'Mensaje demasiado largo',
    });
  }

  if (conversation.bloqueada) {
    throw new ApiError('Desbloquea esta conversación para enviar mensajes.', 403, {
      detail: 'Conversación bloqueada',
    });
  }

  const hora = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());

  const mensaje = {
    id: `msg_${Date.now()}_${conversation.mensajes.length + 1}`,
    propia: true,
    texto,
    hora,
    fecha: 'Hoy',
    adjunto,
  };

  conversation.mensajes.push(mensaje);
  conversation.ultimoMensaje = texto || adjunto?.nombre || 'Adjunto';
  conversation.tiempo = hora;
  conversation.noLeidos = 0;

  return { mensaje, conversacion: conversation };
}

export function acceptRequest(handle) {
  const request = findRequest(handle);

  if (!request) {
    throw new ApiError('Esta solicitud ya no está disponible.', 404, {
      detail: 'Solicitud inexistente',
    });
  }

  const existente = findConversation(handle);

  if (existente) {
    requestsState.splice(requestsState.indexOf(request), 1);
    return { handle: request.mascota.handle, conversacion: existente };
  }

  const conversacion = {
    id: `conv_${request.mascota.handle.replace(/^@/, '')}`,
    mascota: { ...request.mascota },
    enLinea: true,
    ultimoMensaje: 'Aún no hay mensajes',
    tiempo: 'Ahora',
    noLeidos: 0,
    silenciada: false,
    bloqueada: false,
    archivos: [],
    mensajes: [],
  };

  conversationsState.unshift(conversacion);
  requestsState.splice(requestsState.indexOf(request), 1);

  return { handle: request.mascota.handle, conversacion };
}

export function ignoreRequest(handle) {
  const request = findRequest(handle);

  if (!request) {
    throw new ApiError('Esta solicitud ya no está disponible.', 404, {
      detail: 'Solicitud inexistente',
    });
  }

  requestsState.splice(requestsState.indexOf(request), 1);
  return { handle: request.mascota.handle, ignorada: true };
}

export function toggleSilence(handle) {
  const conversation = findConversation(handle);

  if (!conversation) {
    throw new ApiError('No encontramos esta conversación.', 404, {
      detail: 'Conversación inexistente',
    });
  }

  conversation.silenciada = !conversation.silenciada;
  return { handle: conversation.mascota.handle, silenciada: conversation.silenciada };
}

export function toggleBlock(handle) {
  const conversation = findConversation(handle);

  if (!conversation) {
    throw new ApiError('No encontramos esta conversación.', 404, {
      detail: 'Conversación inexistente',
    });
  }

  conversation.bloqueada = !conversation.bloqueada;

  if (conversation.bloqueada) {
    conversation.noLeidos = 0;
  }

  return { handle: conversation.mascota.handle, bloqueada: conversation.bloqueada };
}

export function reportConversation(handle) {
  const conversation = findConversation(handle);

  if (!conversation) {
    throw new ApiError('No encontramos esta conversación.', 404, {
      detail: 'Conversación inexistente',
    });
  }

  conversation.reportada = true;
  return { handle: conversation.mascota.handle, reportado: true };
}
