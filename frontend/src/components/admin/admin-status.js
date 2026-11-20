import { h } from '@/lib/dom.js';

const ESTADOS = {
  PENDIENTE: { label: 'Pendiente', tone: 'warning' },
  EN_REVISION: { label: 'En revisión', tone: 'info' },
  ABIERTA: { label: 'Abierta', tone: 'warning' },
  ESPERANDO_USUARIO: { label: 'Esperando', tone: 'neutral' },
  RESUELTA: { label: 'Resuelta', tone: 'success' },
  CERRADA: { label: 'Cerrada', tone: 'neutral' },
  RESUELTO: { label: 'Resuelto', tone: 'success' },
  RECHAZADO: { label: 'Rechazado', tone: 'neutral' },
  RECHAZADA: { label: 'Rechazada', tone: 'neutral' },
  ACEPTADA: { label: 'Aceptada', tone: 'success' },
  ACTIVA: { label: 'Activa', tone: 'success' },
  SUSPENDIDA: { label: 'Suspendida', tone: 'danger' },
  INACTIVA: { label: 'Inactiva', tone: 'neutral' },
  ELIMINADA: { label: 'Eliminada', tone: 'neutral' },
  BORRADOR: { label: 'Borrador', tone: 'warning' },
  PUBLICADO: { label: 'Publicado', tone: 'success' },
  RETIRADO: { label: 'Retirado', tone: 'neutral' },
};

/**
 * Píldora de estado del panel. Reutiliza los tonos suaves de CMP-04 y siempre
 * acompaña el color con texto; ningún estado depende solo del color.
 */
export function createAdminStatus(estado) {
  const meta = ESTADOS[estado] || { label: estado || 'Sin estado', tone: 'neutral' };

  return h('span', {
    class: `ps-status-pill ps-status-pill--${meta.tone}`,
    text: meta.label,
  });
}

export function adminStatusLabel(estado) {
  return (ESTADOS[estado] || { label: estado || 'Sin estado' }).label;
}
