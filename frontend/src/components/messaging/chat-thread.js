import { createEmptyState } from '@/components/primitives/empty-state.js';
import { h } from '@/lib/dom.js';
import { createMessageBubble } from './message-bubble.js';

/**
 * CMP-80 — ChatThread.
 * Separadores de día, burbujas agrupadas por emisor y auto-scroll al final.
 * El contenedor es un registro accesible para anunciar mensajes nuevos.
 */
export function createChatThread({ mensajes = [], onRetry = null } = {}) {
  const list = h('div', {
    class: 'ps-chat-thread',
    attrs: { role: 'log', 'aria-label': 'Mensajes de la conversación' },
  });

  if (!mensajes.length) {
    list.append(
      createEmptyState({
        icon: 'message-circle',
        title: 'Aún no hay mensajes',
        body: 'Escribe el primero para empezar la conversación.',
      }),
    );
    return { element: list, scrollToEnd: () => {} };
  }

  let currentDate = '';
  let previousSender = null;

  for (const mensaje of mensajes) {
    if (mensaje.fecha && mensaje.fecha !== currentDate) {
      currentDate = mensaje.fecha;
      previousSender = null;
      list.append(
        h(
          'div',
          { class: 'ps-chat-thread__date' },
          h('span', { class: 'ps-chat-thread__date-label', text: currentDate }),
        ),
      );
    }

    const bubble = createMessageBubble({ mensaje, onRetry });

    if (previousSender === Boolean(mensaje.propia)) {
      bubble.classList.add('ps-message--stacked');
    }

    previousSender = Boolean(mensaje.propia);
    list.append(bubble);
  }

  function scrollToEnd() {
    list.scrollTop = list.scrollHeight;
  }

  window.requestAnimationFrame(scrollToEnd);

  return { element: list, scrollToEnd };
}
