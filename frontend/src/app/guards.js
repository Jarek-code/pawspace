import { hasSession, isAdmin } from '@/services/auth.js';

/**
 * Guards de navegación. Devuelven la ruta a la que hay que redirigir o null si
 * el acceso está permitido.
 */
export const guards = {
  guest() {
    if (!hasSession()) {
      return null;
    }

    return isAdmin() ? '/admin' : '/inicio';
  },
  auth() {
    if (hasSession()) {
      return null;
    }

    const next = `${window.location.pathname}${window.location.search}`;
    return `/?next=${encodeURIComponent(next)}`;
  },
  admin() {
    if (!hasSession()) {
      const next = `${window.location.pathname}${window.location.search}`;
      return `/?next=${encodeURIComponent(next)}`;
    }

    return isAdmin() ? null : '/inicio';
  },
};
