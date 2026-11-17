import { h } from '@/lib/dom.js';
import { createSettingsRow } from './settings-row.js';

/**
 * CMP-86 — PrivacyControls.
 * Agrupa perfil, ubicación, mensajes e historias. Cada control explica el
 * efecto; ubicación solo está disponible con perfil público.
 */
export function createPrivacyControls({ privacy = {}, onChange = null } = {}) {
  const rows = {};

  function row(key, title, description) {
    const disabled = key === 'mostrarUbicacion' && !privacy.perfilPublico;
    const control = createSettingsRow({
      variant: 'switch',
      title,
      description,
      checked: Boolean(privacy[key]),
      disabled,
      onChange: (next) => onChange?.(key, next),
    });
    rows[key] = control;
    return control;
  }

  const perfil = row(
    'perfilPublico',
    'Perfil público',
    'Cualquier persona puede ver la información de tu mascota.',
  );
  const ubicacion = row(
    'mostrarUbicacion',
    'Mostrar ubicación',
    privacy.perfilPublico
      ? 'Muestra la ciudad en el perfil público.'
      : 'Actívalo con el perfil público para mostrar la ciudad.',
  );
  const mensajes = row(
    'mensajesDesconocidos',
    'Permitir mensajes de desconocidos',
    'Las mascotas que no sigues pueden iniciar una conversación.',
  );
  const historias = row(
    'compartirHistorias',
    'Compartir historias con seguidores',
    'Solo las mascotas que te siguen ven tus historias.',
  );

  return {
    element: h('div', { class: 'ps-settings-rows' }, perfil, ubicacion, mensajes, historias),
    update(nextPrivacy) {
      privacy = nextPrivacy;
      rows.perfilPublico.querySelector('.ps-switch').setChecked(nextPrivacy.perfilPublico);
      rows.mostrarUbicacion.querySelector('.ps-switch').setChecked(nextPrivacy.mostrarUbicacion);
      rows.mensajesDesconocidos
        .querySelector('.ps-switch')
        .setChecked(nextPrivacy.mensajesDesconocidos);
      rows.compartirHistorias
        .querySelector('.ps-switch')
        .setChecked(nextPrivacy.compartirHistorias);

      const ubicacionSwitch = rows.mostrarUbicacion.querySelector('.ps-switch');
      ubicacionSwitch.disabled = !nextPrivacy.perfilPublico;
      ubicacionSwitch
        .closest('.ps-switch-field')
        .classList.toggle('is-disabled', !nextPrivacy.perfilPublico);
    },
  };
}
