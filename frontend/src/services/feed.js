import { get } from '@/services/http.js';

/**
 * Servicio del feed.
 *
 * Los endpoints de feed, publicaciones e historias todavía no existen en el
 * backend estable; mientras tanto estas funciones consumen los mocks locales
 * (ver docs/API.md). La forma de respuesta es provisional y se ajustará cuando
 * el backend publique su contrato.
 */
export async function loadFeed() {
  const [posts, stories, sugerencias, tendencias] = await Promise.all([
    get('/feed'),
    get('/historias'),
    get('/sugerencias'),
    get('/tendencias'),
  ]);

  return {
    publicaciones: posts.publicaciones || [],
    historias: stories.historias || [],
    sugerencias: sugerencias.sugerencias || [],
    tendencias: tendencias.tendencias || [],
  };
}
