import { guards } from '@/app/guards.js';
import { createRouter } from '@/app/router.js';
import { initTheme } from '@/app/theme.js';
import '@/styles/main.css';

/**
 * Arranque de la SPA.
 *
 * Cada ruta carga su página con import() dinámico. Las rutas del flujo de Auth
 * usan los nombres de HANDOFF-FRONTEND; los alias conservan los enlaces del
 * flujo de wireframes sin duplicar implementación.
 */
const routes = [
  {
    path: '/',
    title: 'Entrar',
    guard: 'guest',
    load: () => import('@/features/auth/pages/login.js'),
  },
  {
    path: '/entrar',
    redirect: '/',
  },
  {
    path: '/registro',
    title: 'Crear cuenta',
    guard: 'guest',
    load: () => import('@/features/auth/pages/register.js'),
  },
  {
    path: '/crear-cuenta',
    redirect: '/registro',
  },
  {
    path: '/onboarding',
    redirect: '/onboarding/especie',
  },
  {
    path: '/onboarding/especie',
    title: 'Elige la especie',
    guard: 'auth',
    load: () => import('@/features/onboarding/pages/especie.js'),
  },
  {
    path: '/onboarding/especie/otra',
    title: 'Otra especie',
    guard: 'auth',
    load: () => import('@/features/onboarding/pages/especie-otra.js'),
  },
  {
    path: '/onboarding/datos',
    title: 'Datos de tu mascota',
    guard: 'auth',
    load: () => import('@/features/onboarding/pages/datos.js'),
  },
  {
    path: '/onboarding/perfil',
    title: 'Foto y biografía',
    guard: 'auth',
    load: () => import('@/features/onboarding/pages/perfil.js'),
  },
  {
    path: '/onboarding/privacidad',
    title: 'Privacidad',
    guard: 'auth',
    load: () => import('@/features/onboarding/pages/privacidad.js'),
  },
  {
    path: '/onboarding/listo',
    title: 'Todo listo',
    guard: 'auth',
    load: () => import('@/features/onboarding/pages/listo.js'),
  },
  {
    path: '/elegir-mascota',
    title: 'Elegir mascota',
    guard: 'auth',
    load: () => import('@/features/onboarding/pages/elegir-mascota.js'),
  },
  {
    path: '/inicio',
    title: 'Inicio',
    guard: 'auth',
    load: () => import('@/features/feed/pages/feed.js'),
  },
  {
    path: '*',
    title: 'Página no encontrada',
    load: () => import('@/features/shared/pages/not-found.js'),
  },
];

const outlet = document.querySelector('#app');

if (!outlet) {
  throw new Error('Falta el contenedor #app en index.html.');
}

initTheme();

const router = createRouter({ routes, outlet, guards });
router.start();
