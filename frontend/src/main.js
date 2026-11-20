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
    path: '/publicar',
    title: 'Crear publicación',
    guard: 'auth',
    load: () => import('@/features/feed/pages/compose.js'),
  },
  {
    path: '/publicacion/:id',
    title: 'Publicación',
    guard: 'auth',
    load: () => import('@/features/feed/pages/post.js'),
  },
  {
    path: '/perfil',
    title: 'Mi perfil',
    guard: 'auth',
    load: () => import('@/features/profile/pages/own.js'),
  },
  {
    path: '/perfil/editar',
    title: 'Editar perfil',
    guard: 'auth',
    load: () => import('@/features/profile/pages/edit.js'),
  },
  {
    path: '/mascota/:handle',
    title: 'Perfil de mascota',
    guard: 'auth',
    load: () => import('@/features/profile/pages/public.js'),
  },
  {
    path: '/historias',
    title: 'Tus historias',
    guard: 'auth',
    load: () => import('@/features/stories/pages/archive.js'),
  },
  {
    path: '/historias/nueva',
    title: 'Crear historia',
    guard: 'auth',
    load: () => import('@/features/stories/pages/compose.js'),
  },
  {
    path: '/historias/:handle',
    title: 'Historias',
    guard: 'auth',
    load: () => import('@/features/stories/pages/viewer.js'),
  },
  {
    path: '/explorar',
    title: 'Explorar',
    guard: 'auth',
    load: () => import('@/features/explore/pages/explore.js'),
  },
  {
    path: '/buscar',
    title: 'Buscar',
    guard: 'auth',
    load: () => import('@/features/explore/pages/search.js'),
  },
  {
    path: '/notificaciones',
    title: 'Notificaciones',
    guard: 'auth',
    load: () => import('@/features/messaging/pages/notifications.js'),
  },
  {
    path: '/avisos',
    redirect: '/notificaciones',
  },
  {
    path: '/mensajes',
    title: 'Mensajes',
    guard: 'auth',
    load: () => import('@/features/messaging/pages/inbox.js'),
  },
  {
    path: '/avisos/mensajes',
    redirect: '/mensajes',
  },
  {
    path: '/mensajes/:handle',
    title: 'Conversación',
    guard: 'auth',
    load: () => import('@/features/messaging/pages/chat.js'),
  },
  {
    path: '/ajustes',
    redirect: '/ajustes/cuenta',
  },
  {
    path: '/ajustes/cuenta',
    title: 'Configuración',
    guard: 'auth',
    load: () => import('@/features/settings/pages/account.js'),
  },
  {
    path: '/ajustes/privacidad',
    title: 'Privacidad',
    guard: 'auth',
    load: () => import('@/features/settings/pages/privacy.js'),
  },
  {
    path: '/ajustes/seguridad',
    title: 'Seguridad',
    guard: 'auth',
    load: () => import('@/features/settings/pages/security.js'),
  },
  {
    path: '/ayuda',
    title: 'Centro de ayuda',
    guard: 'auth',
    load: () => import('@/features/help/pages/center.js'),
  },
  {
    path: '/ayuda/:slug',
    title: 'Artículo de ayuda',
    guard: 'auth',
    load: () => import('@/features/help/pages/article.js'),
  },
  {
    path: '/soporte',
    title: 'Soporte',
    guard: 'auth',
    load: () => import('@/features/help/pages/support.js'),
  },
  {
    path: '/admin',
    title: 'Administración',
    guard: 'admin',
    load: () => import('@/features/admin/pages/dashboard.js'),
  },
  {
    path: '/admin/reportes',
    title: 'Reportes',
    guard: 'admin',
    load: () => import('@/features/admin/pages/reports.js'),
  },
  {
    path: '/admin/reportes/:id',
    title: 'Detalle del reporte',
    guard: 'admin',
    load: () => import('@/features/admin/pages/report-detail.js'),
  },
  {
    path: '/admin/apelaciones',
    title: 'Apelaciones',
    guard: 'admin',
    load: () => import('@/features/admin/pages/apelaciones.js'),
  },
  {
    path: '/admin/apelaciones/:id',
    title: 'Detalle de la apelación',
    guard: 'admin',
    load: () => import('@/features/admin/pages/apelacion-detail.js'),
  },
  {
    path: '/admin/soporte',
    title: 'Soporte',
    guard: 'admin',
    load: () => import('@/features/admin/pages/soporte.js'),
  },
  {
    path: '/admin/soporte/:id',
    title: 'Conversación de soporte',
    guard: 'admin',
    load: () => import('@/features/admin/pages/ticket-thread.js'),
  },
  {
    path: '/admin/ayuda',
    title: 'Artículos de ayuda',
    guard: 'admin',
    load: () => import('@/features/admin/pages/ayuda.js'),
  },
  {
    path: '/admin/ayuda/nuevo',
    title: 'Nuevo artículo',
    guard: 'admin',
    load: () => import('@/features/admin/pages/articulo-editor.js'),
  },
  {
    path: '/admin/ayuda/categorias',
    title: 'Categorías de ayuda',
    guard: 'admin',
    load: () => import('@/features/admin/pages/categorias.js'),
  },
  {
    path: '/admin/ayuda/:id',
    title: 'Editar artículo',
    guard: 'admin',
    load: () => import('@/features/admin/pages/articulo-editor.js'),
  },
  {
    path: '/admin/usuarios',
    title: 'Usuarios',
    guard: 'admin',
    load: () => import('@/features/admin/pages/usuarios.js'),
  },
  {
    path: '/admin/usuarios/:id',
    title: 'Detalle del usuario',
    guard: 'admin',
    load: () => import('@/features/admin/pages/usuario-detail.js'),
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
