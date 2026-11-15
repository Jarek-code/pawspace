/**
 * Fixtures del feed. Datos mock en español con las mascotas del proyecto
 * (Luna, Milo, Nala, Kira, Toby, Coco). La mascota es la protagonista.
 */

export const feedPosts = [
  {
    id: 'post_luna_1',
    mascota: { nombre: 'Luna', handle: '@luna' },
    tiempo: '2 h',
    texto: 'Hoy encontré el rayo de sol perfecto para una siesta.',
    media: { caption: 'Foto de Luna' },
    likes: 24,
    comentarios: 3,
  },
  {
    id: 'post_milo_1',
    mascota: { nombre: 'Milo', handle: '@milo' },
    tiempo: '5 h',
    texto: 'Primer paseo largo de la semana. Las hojas secas son lo mejor para brincar.',
    media: { caption: 'Foto de Milo' },
    likes: 18,
    comentarios: 2,
  },
  {
    id: 'post_nala_1',
    mascota: { nombre: 'Nala', handle: '@nala' },
    tiempo: '8 h',
    texto: 'No hay nada como un buen estirón después de dormir toda la mañana.',
    media: null,
    likes: 41,
    comentarios: 7,
  },
  {
    id: 'post_toby_1',
    mascota: { nombre: 'Toby', handle: '@toby' },
    tiempo: '1 d',
    texto: 'Hoy aprendí a dar la pata. La recompensa valió cada intento.',
    media: { caption: 'Foto de Toby' },
    likes: 33,
    comentarios: 5,
  },
];

export const feedStories = [
  { mascota: { nombre: 'Luna', handle: '@luna' }, estado: 'propia' },
  { mascota: { nombre: 'Luna', handle: '@luna' }, estado: 'no-vista' },
  { mascota: { nombre: 'Milo', handle: '@milo' }, estado: 'no-vista' },
  { mascota: { nombre: 'Nala', handle: '@nala' }, estado: 'vista' },
  { mascota: { nombre: 'Toby', handle: '@toby' }, estado: 'vista' },
];

export const feedSugerencias = [
  { nombre: 'Milo', handle: '@milo' },
  { nombre: 'Nala', handle: '@nala' },
  { nombre: 'Toby', handle: '@toby' },
];

export const feedTendencias = [
  { tag: '#siestas', count: '128 publicaciones' },
  { tag: '#adopta', count: '86 publicaciones' },
  { tag: '#paseos', count: '54 publicaciones' },
];
