import { h } from '@/lib/dom.js';

/**
 * CMP-84 — SettingsSection.
 * Tarjeta con título, descripción y filas. `danger` separa visualmente las
 * acciones destructivas sin compartir zona con el guardado principal.
 */
export function createSettingsSection({
  title = '',
  description = '',
  danger = false,
  children = null,
  footer = null,
} = {}) {
  return h(
    'section',
    {
      class: ['ps-settings-section', danger ? 'ps-settings-section--danger' : '']
        .filter(Boolean)
        .join(' '),
    },
    h(
      'header',
      { class: 'ps-settings-section__head' },
      h('h2', { class: 'ps-settings-section__title', text: title }),
      description ? h('p', { class: 'ps-settings-section__description', text: description }) : null,
    ),
    children ? h('div', { class: 'ps-settings-section__body' }, children) : null,
    footer ? h('div', { class: 'ps-settings-section__footer' }, footer) : null,
  );
}
