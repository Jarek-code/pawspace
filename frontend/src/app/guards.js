import { hasSession } from '@/services/auth.js';

/**
 * Guards de navegación. Devuelven la ruta a la que hay que redirigir o null si
 * el acceso está permitido.
 */
export const guards = {
  guest() {
    return hasSession() ? '/inicio' : null;
  },
  auth() {
    if (hasSession()) {
      return null;
    }

    const next = `${window.location.pathname}${window.location.search}`;
    return `/?next=${encodeURIComponent(next)}`;
  },
};
