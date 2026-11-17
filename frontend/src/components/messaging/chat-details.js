import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

function actionButton({ icon, label, variant = '', onClick, disabled = false }) {
  return h(
    'button',
    {
      class: ['ps-chat-action', variant ? `ps-chat-action--${variant}` : '']
        .filter(Boolean)
        .join(' '),
      type: 'button',
      disabled,
      onClick,
    },
    h(
      'span',
      { class: 'ps-chat-action__icon', 'aria-hidden': 'true' },
      createIcon(icon, { size: 18 }),
    ),
    h('span', { text: label }),
  );
}

/**
 * CMP-82 — ChatDetails.
 * Perfil de la otra mascota, archivos compartidos y acciones de moderación.
 * En escritorio vive en el riel; en móvil se abre como hoja.
 */
export function createChatDetails({
  conversation,
  onOpenProfile = null,
  onSilence = null,
  onBlock = null,
  onReport = null,
} = {}) {
  const mascota = conversation.mascota;
  const archivos = conversation.archivos || [];
  const bloqueada = Boolean(conversation.bloqueada);
  const silenciada = Boolean(conversation.silenciada);
  const reportada = Boolean(conversation.reportada);

  const profile = h(
    'section',
    { class: 'ps-rail__card ps-chat-profile', attrs: { 'aria-label': 'Perfil de la mascota' } },
    h(
      'div',
      { class: 'ps-chat-profile__head' },
      createAvatar({ name: mascota.nombre, src: mascota.avatar, size: 'md' }),
      h(
        'div',
        { class: 'ps-chat-profile__info' },
        h('span', { class: 'ps-chat-profile__name', text: mascota.nombre }),
        h('span', {
          class: 'ps-chat-profile__meta',
          text: [mascota.handle, mascota.raza].filter(Boolean).join(' · '),
        }),
      ),
    ),
    h(
      'p',
      { class: 'ps-chat-profile__status' },
      h('span', {
        class: `ps-status-dot${conversation.enLinea ? ' is-online' : ''}`,
        attrs: { 'aria-hidden': 'true' },
      }),
      conversation.enLinea ? 'En línea' : 'Última actividad reciente',
    ),
    createButton({
      label: 'Ver perfil',
      variant: 'secondary',
      fullWidth: true,
      onClick: onOpenProfile,
    }).element,
  );

  const files = h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Archivos compartidos' }),
    archivos.length
      ? h(
          'div',
          { class: 'ps-chat-files' },
          archivos.map((archivo) =>
            h(
              'div',
              { class: 'ps-chat-file' },
              archivo.url && archivo.tipo === 'image'
                ? h('img', { class: 'ps-chat-file__image', src: archivo.url, alt: archivo.nombre })
                : h(
                    'span',
                    { class: 'ps-chat-file__icon', 'aria-hidden': 'true' },
                    createIcon(archivo.tipo === 'image' ? 'image' : 'bookmark', { size: 20 }),
                  ),
              h('span', { class: 'ps-chat-file__name', text: archivo.nombre }),
              h('span', { class: 'ps-chat-file__date', text: archivo.fecha || '' }),
            ),
          ),
        )
      : h('p', { class: 'ps-chat-empty', text: 'Aún no compartieron archivos.' }),
  );

  const actions = h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Esta conversación' }),
    h(
      'div',
      { class: 'ps-chat-actions' },
      actionButton({
        icon: silenciada ? 'bell' : 'bell-off',
        label: silenciada ? 'Reactivar avisos' : 'Silenciar conversación',
        onClick: onSilence,
      }),
      actionButton({
        icon: 'ban',
        label: bloqueada ? `Desbloquear a ${mascota.nombre}` : `Bloquear a ${mascota.nombre}`,
        variant: 'danger',
        onClick: onBlock,
      }),
      actionButton({
        icon: 'flag',
        label: reportada ? 'Reporte enviado' : `Reportar a ${mascota.nombre}`,
        variant: 'danger',
        disabled: reportada,
        onClick: onReport,
      }),
    ),
  );

  return h('div', { class: 'ps-chat-details' }, profile, files, actions);
}
