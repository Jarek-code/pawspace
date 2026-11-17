import { createAvatar } from '@/components/primitives/avatar.js';
import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';

/**
 * Riel de configuración: resumen de cuenta, sesiones, privacidad, reportes y
 * enlaces de ayuda. Es informativo; las acciones viven en el contenido.
 */
export function createSettingsRail({
  section = 'cuenta',
  data,
  onCloseSession = null,
  onCloseAll = null,
  onUnblock = null,
  onOpenReport = null,
} = {}) {
  const cards = [activePetCard(data)];

  if (section === 'cuenta') {
    cards.push(accountSummary(data));
    cards.push(sessionsCard(data, onCloseSession, onCloseAll));
    cards.push(helpCard());
    return cards;
  }

  if (section === 'privacidad') {
    cards.push(privacyLevelCard(data));
    cards.push(blockedCard(data, onUnblock));
    cards.push(tipsCard());
    return cards;
  }

  cards.push(reportSummaryCard(data, onOpenReport));
  cards.push(quickActionsCard());
  cards.push(helpCard());
  return cards;
}

function activePetCard(data) {
  const pet = data.mascotaActiva || {};

  return h(
    'section',
    { class: 'ps-rail__card ps-settings-rail__pet', attrs: { 'aria-label': 'Mascota activa' } },
    createAvatar({ name: pet.nombre || 'Luna', src: pet.avatar, size: 'md' }),
    h(
      'div',
      { class: 'ps-settings-rail__pet-info' },
      h('span', { class: 'ps-settings-rail__pet-name', text: pet.nombre || 'Luna' }),
      h('span', { class: 'ps-settings-rail__pet-handle', text: pet.handle || '@luna' }),
      h('span', {
        class: 'ps-settings-rail__pet-visibility',
        text: data.privacidad?.perfilPublico ? 'Perfil público' : 'Perfil privado',
      }),
    ),
    h('a', { class: 'ps-settings-rail__link', href: '/elegir-mascota' }, 'Cambiar'),
  );
}

function accountSummary(data) {
  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Resumen de la cuenta' }),
    h(
      'dl',
      { class: 'ps-settings-rail__stats' },
      h('div', {}, h('dt', { text: 'Miembro desde' }), h('dd', { text: data.cuenta.miembroDesde })),
      h('div', {}, h('dt', { text: 'Mascotas' }), h('dd', { text: '1 activa' })),
    ),
  );
}

function sessionsCard(data, onCloseSession, onCloseAll) {
  return h(
    'section',
    { class: 'ps-rail__card', attrs: { 'aria-label': 'Sesiones activas' } },
    h('h2', { class: 'ps-rail__title', text: 'Sesiones activas' }),
    h(
      'ul',
      { class: 'ps-settings-sessions' },
      data.sesiones.map((session) =>
        h(
          'li',
          { class: 'ps-settings-session' },
          h(
            'span',
            { class: 'ps-settings-session__text' },
            h('span', { class: 'ps-settings-session__device', text: session.dispositivo }),
            h('span', {
              class: 'ps-settings-session__meta',
              text: `${session.ubicacion} · ${session.tiempo}`,
            }),
          ),
          h(
            'button',
            {
              class: 'ps-settings-session__close',
              type: 'button',
              attrs: { 'aria-label': `Cerrar sesión de ${session.dispositivo}` },
              onClick: () => onCloseSession?.(session),
            },
            'Cerrar',
          ),
        ),
      ),
    ),
    h(
      'button',
      {
        class: 'ps-settings-rail__danger-link',
        type: 'button',
        onClick: () => onCloseAll?.(),
      },
      'Cerrar todas las sesiones',
    ),
  );
}

function privacyLevelCard(data) {
  const privacy = data.privacidad;
  const level = !privacy.perfilPublico
    ? 'Alto'
    : privacy.mostrarUbicacion || privacy.mensajesDesconocidos
      ? 'Bajo'
      : 'Medio';

  const checks = [
    !privacy.perfilPublico ? 'Perfil solo para seguidores' : 'Perfil revisado',
    privacy.mostrarUbicacion ? 'Ubicación visible' : 'Ubicación oculta',
    privacy.mensajesDesconocidos ? 'Mensajes abiertos' : 'Mensajes limitados',
  ];

  return h(
    'section',
    { class: 'ps-rail__card ps-settings-privacy-level' },
    h('h2', { class: 'ps-rail__title', text: 'Nivel de privacidad' }),
    h('p', { class: 'ps-settings-privacy-level__value', text: level }),
    h('p', {
      class: 'ps-settings-privacy-level__hint',
      text: privacy.perfilPublico
        ? 'Tu perfil y tus historias siguen tus permisos.'
        : 'Tu perfil solo es visible para tus seguidores.',
    }),
    h(
      'ul',
      { class: 'ps-settings-checks' },
      checks.map((text) =>
        h(
          'li',
          { class: 'ps-settings-checks__item' },
          createIcon('check', { size: 16 }),
          h('span', { text }),
        ),
      ),
    ),
  );
}

function blockedCard(data, onUnblock) {
  const accounts = data.bloqueados || [];

  return h(
    'section',
    { class: 'ps-rail__card', attrs: { 'aria-label': 'Cuentas bloqueadas' } },
    h('h2', { class: 'ps-rail__title', text: 'Cuentas bloqueadas' }),
    accounts.length
      ? h(
          'ul',
          { class: 'ps-settings-blocked-preview' },
          accounts.slice(0, 3).map((account) =>
            h(
              'li',
              { class: 'ps-settings-blocked-preview__row' },
              createAvatar({ name: account.nombre, src: account.avatar, size: 'sm' }),
              h(
                'span',
                { class: 'ps-settings-blocked-preview__info' },
                h('span', { class: 'ps-settings-blocked-preview__name', text: account.nombre }),
                h('span', {
                  class: 'ps-settings-blocked-preview__handle',
                  text: account.handle,
                }),
              ),
              h(
                'button',
                {
                  class: 'ps-settings-rail__link',
                  type: 'button',
                  attrs: { 'aria-label': `Desbloquear a ${account.nombre}` },
                  onClick: () => onUnblock?.(account),
                },
                'Desbloquear',
              ),
            ),
          ),
        )
      : h('p', {
          class: 'ps-settings-rail__empty',
          text: 'No has bloqueado ninguna cuenta.',
        }),
    h(
      'a',
      { class: 'ps-settings-rail__link', href: '/ajustes/privacidad' },
      'Gestionar bloqueados',
    ),
  );
}

function tipsCard() {
  const tips = [
    ['Usa una contraseña única', 'No la reutilices en otras cuentas.'],
    ['Revisa las sesiones', 'Cierra las que no reconozcas.'],
    ['Cuidado con los enlaces', 'No compartas datos personales.'],
  ];

  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Consejos de seguridad' }),
    h(
      'ul',
      { class: 'ps-settings-tips' },
      tips.map(([title, body]) =>
        h(
          'li',
          { class: 'ps-settings-tips__item' },
          h('span', { class: 'ps-settings-tips__title', text: title }),
          h('span', { class: 'ps-settings-tips__body', text: body }),
        ),
      ),
    ),
  );
}

function reportSummaryCard(data, onOpenReport) {
  const reports = data.reportes || [];
  const revision = reports.filter((item) =>
    ['PENDIENTE', 'EN_REVISION'].includes(item.estado),
  ).length;
  const resueltos = reports.filter((item) => item.estado === 'RESUELTO').length;

  return h(
    'section',
    { class: 'ps-rail__card', attrs: { 'aria-label': 'Estado de tus reportes' } },
    h('h2', { class: 'ps-rail__title', text: 'Estado de tus reportes' }),
    h('p', { class: 'ps-settings-report-total', text: `${reports.length} reportes enviados` }),
    h(
      'p',
      { class: 'ps-settings-report-split' },
      h('span', {
        class: 'ps-status-pill ps-status-pill--warning',
        text: `${revision} en revisión`,
      }),
      h('span', {
        class: 'ps-status-pill ps-status-pill--success',
        text: `${resueltos} resueltos`,
      }),
    ),
    h('p', { class: 'ps-settings-rail__empty', text: 'Tiempo medio de respuesta: 24 h' }),
    reports[0]
      ? createButton({
          label: 'Ver último reporte',
          variant: 'secondary',
          size: 'sm',
          fullWidth: true,
          onClick: () => onOpenReport?.(reports[0]),
        }).element
      : null,
  );
}

function quickActionsCard() {
  const actions = [
    ['Reportar contenido', 'Elige una publicación o comentario.', '/explorar'],
    ['Bloquear una cuenta', 'Oculta su contenido y sus mensajes.', '/ajustes/privacidad'],
  ];

  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Acciones rápidas' }),
    h(
      'ul',
      { class: 'ps-settings-quick' },
      actions.map(([title, body, href]) =>
        h(
          'li',
          {},
          h(
            'a',
            { class: 'ps-settings-quick__link', href },
            h(
              'span',
              { class: 'ps-settings-quick__text' },
              h('span', { class: 'ps-settings-quick__title', text: title }),
              h('span', { class: 'ps-settings-quick__body', text: body }),
            ),
            createIcon('chevron-right', { size: 18 }),
          ),
        ),
      ),
    ),
  );
}

function helpCard() {
  return h(
    'section',
    { class: 'ps-rail__card' },
    h('h2', { class: 'ps-rail__title', text: 'Ayuda y soporte' }),
    h(
      'ul',
      { class: 'ps-settings-help' },
      h(
        'li',
        {},
        h(
          'a',
          { class: 'ps-settings-quick__link', href: '/ajustes/seguridad' },
          h('span', { class: 'ps-settings-quick__title', text: 'Normas de la comunidad' }),
          createIcon('chevron-right', { size: 18 }),
        ),
      ),
      h(
        'li',
        {},
        h(
          'span',
          { class: 'ps-settings-quick__link is-disabled', attrs: { 'aria-disabled': 'true' } },
          h('span', { class: 'ps-settings-quick__title', text: 'Centro de ayuda' }),
          h('span', {
            class: 'ps-settings-quick__body',
            text: 'Disponible en el bloque de ayuda.',
          }),
        ),
      ),
    ),
  );
}
