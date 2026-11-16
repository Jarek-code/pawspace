import { createTabs } from '@/components/primitives/tabs.js';

/**
 * CMP-57 — ProfileTabs.
 * Pestañas del perfil: Publicaciones, Historias, Fotos y Guardados.
 * "Logros" se retiró porque no tiene soporte en database/schema.sql.
 */
export function createProfileTabs({ active = 'publicaciones', own = true, onChange = null } = {}) {
  const tabs = [
    { value: 'publicaciones', label: 'Publicaciones', active: active === 'publicaciones' },
    { value: 'historias', label: 'Historias', active: active === 'historias' },
    { value: 'fotos', label: 'Fotos', active: active === 'fotos' },
  ];

  if (own) {
    tabs.push({ value: 'guardados', label: 'Guardados', active: active === 'guardados' });
  }

  const control = createTabs({ tabs, onChange });
  control.element.classList.add('ps-tabs--profile');
  return control;
}
