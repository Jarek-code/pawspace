import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

/**
 * CMP-52 — MessageBubble.
 * Entrante en superficie blanca, saliente en coral. La hora va al pie y los
 * mensajes propios muestran el estado de envío. Un fallo conserva el texto y
 * ofrece reintentar.
 */
export function createMessageBubble({ mensaje, onRetry = null } = {}) {
  const propia = Boolean(mensaje.propia);
  const adjunto = mensaje.adjunto || null;
  const estado = mensaje.estado || (propia ? 'enviado' : '');

  const attachment = adjunto
    ? h(
        'span',
        { class: 'ps-message__attachment' },
        adjunto.tipo === 'image' && adjunto.url
          ? h('img', {
              class: 'ps-message__attachment-image',
              src: adjunto.url,
              alt: adjunto.nombre || 'Imagen adjunta',
            })
          : h(
              'span',
              { class: 'ps-message__attachment-icon', 'aria-hidden': 'true' },
              createIcon('image', { size: 24 }),
            ),
        h(
          'span',
          { class: 'ps-message__attachment-info' },
          h('span', {
            class: 'ps-message__attachment-name',
            text: adjunto.nombre || (adjunto.tipo === 'image' ? 'Foto' : 'Archivo'),
          }),
          adjunto.tamano
            ? h('span', { class: 'ps-message__attachment-size', text: adjunto.tamano })
            : null,
        ),
      )
    : null;

  const retry =
    estado === 'error'
      ? h(
          'button',
          {
            class: 'ps-message__retry',
            type: 'button',
            onClick: () => onRetry?.(mensaje),
          },
          createIcon('rotate-ccw', { size: 14 }),
          'Reintentar',
        )
      : null;

  return h(
    'div',
    {
      class: [
        'ps-message',
        propia ? 'ps-message--out' : 'ps-message--in',
        adjunto ? 'ps-message--attachment' : '',
        estado === 'error' ? 'is-error' : '',
      ]
        .filter(Boolean)
        .join(' '),
    },
    h('span', { class: 'ps-sr-only', text: propia ? 'Tú: ' : '' }),
    mensaje.texto ? h('p', { class: 'ps-message__text', text: mensaje.texto }) : null,
    attachment,
    h(
      'span',
      { class: 'ps-message__footer' },
      estado === 'enviando' ? h('span', { text: 'Enviando…' }) : null,
      h('time', { class: 'ps-message__time', text: mensaje.hora || '' }),
      propia && estado !== 'enviando' && estado !== 'error'
        ? h(
            'span',
            { class: 'ps-message__status' },
            createIcon('check-check', { size: 14 }),
            h('span', { class: 'ps-sr-only', text: 'Enviado' }),
          )
        : null,
    ),
    retry,
  );
}
