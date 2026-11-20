import { ApiError } from '@/lib/errors.js';
import { supportFixture } from '../fixtures/help.js';

export const clone = (value) => JSON.parse(JSON.stringify(value));
export const ACTIVE_TICKET_STATES = new Set(['ABIERTA', 'EN_REVISION', 'ESPERANDO_USUARIO']);

const CATEGORIAS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'ACOSO', label: 'Acoso' },
  { value: 'CONTENIDO_INAPROPIADO', label: 'Contenido inapropiado' },
  { value: 'VIOLENCIA', label: 'Violencia' },
  { value: 'SUPLANTACION', label: 'Suplantación' },
  { value: 'DERECHOS_AUTOR', label: 'Derechos de autor' },
  { value: 'OTRO', label: 'Otro' },
];
const TIPO_LABEL = {
  publicacion: 'Publicación',
  historia: 'Historia',
  comentario: 'Comentario',
  mensaje: 'Mensaje',
};

export function adminCategorias() {
  return clone(CATEGORIAS);
}

export function tipoLabel(tipo) {
  return TIPO_LABEL[tipo] || 'Contenido';
}

function topicLabel(value) {
  return supportFixture.topics.find((topic) => topic.value === value)?.label || value;
}

export function userTicketToAdmin(ticket) {
  return {
    ...ticket,
    persona: 'Sofía Ramírez',
    correo: 'sofia.ramirez@example.com',
    temaLabel: topicLabel(ticket.tema),
    hace: ticket.hace || ticket.fecha || 'Sin fecha',
    recencia: ticket.fecha === 'Ahora' ? 2 : 0,
  };
}

export function requireMotivo(value) {
  const motivo = String(value || '').trim();

  if (motivo.length < 10 || motivo.length > 500) {
    throw new ApiError('Escribe un motivo de al menos 10 caracteres.', 422, {
      detail: 'Motivo inválido',
    });
  }

  return motivo;
}
