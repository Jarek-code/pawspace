import { h } from '@/lib/dom.js';

const TONES = {
  operativo: 'success',
  degradado: 'warning',
  incidencia: 'danger',
};

/**
 * CMP-94 — SupportStatus.
 * Punto de estado + texto, última comprobación e historial. El color nunca es
 * la única señal: el estado se escribe con palabras.
 */
export function createSupportStatus({ status, onHistory = null } = {}) {
  const tone = TONES[status?.estado] || 'success';

  return h(
    'section',
    { class: 'ps-support-status' },
    h(
      'div',
      { class: 'ps-support-status__head', attrs: { role: 'status', 'aria-live': 'polite' } },
      h('span', { class: 'ps-support-status__dot', dataset: { tone }, 'aria-hidden': 'true' }),
      h('span', {
        class: 'ps-support-status__title',
        text: status?.title || 'Estado del servicio',
      }),
    ),
    h('p', {
      class: 'ps-support-status__checked',
      text: `Última comprobación: ${status?.checked || 'hace unos minutos'}`,
    }),
    h(
      'button',
      {
        class: 'ps-support-status__history',
        type: 'button',
        onClick: () => onHistory?.(),
      },
      'Ver historial de estado',
    ),
  );
}
