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
    meGusta: false,
    guardado: false,
  },
  {
    id: 'post_milo_1',
    mascota: { nombre: 'Milo', handle: '@milo' },
    tiempo: '5 h',
    texto: 'Primer paseo largo de la semana. Las hojas secas son lo mejor para brincar.',
    media: { caption: 'Foto de Milo' },
    likes: 18,
    comentarios: 2,
    meGusta: false,
    guardado: false,
  },
  {
    id: 'post_nala_1',
    mascota: { nombre: 'Nala', handle: '@nala' },
    tiempo: '8 h',
    texto: 'No hay nada como un buen estirón después de dormir toda la mañana.',
    media: null,
    likes: 41,
    comentarios: 7,
    meGusta: true,
    guardado: false,
  },
  {
    id: 'post_toby_1',
    mascota: { nombre: 'Toby', handle: '@toby' },
    tiempo: '1 d',
    texto: 'Hoy aprendí a dar la pata. La recompensa valió cada intento.',
    media: { caption: 'Foto de Toby' },
    likes: 33,
    comentarios: 5,
    meGusta: false,
    guardado: false,
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

/**
 * Comentarios iniciales por publicación. La llave es el id de la publicación;
 * el orden de cada arreglo es del más reciente al más antiguo.
 */
export const feedComments = {
  post_luna_1: [
    {
      id: 'comment_luna_1',
      mascota: { nombre: 'Milo', handle: '@milo' },
      tiempo: '1 h',
      texto: 'Ese rincón es el mejor. Lo confirmo.',
    },
    {
      id: 'comment_luna_2',
      mascota: { nombre: 'Nala', handle: '@nala' },
      tiempo: '45 min',
      texto: 'Qué buena foto. ¿Dónde fue?',
    },
    {
      id: 'comment_luna_3',
      mascota: { nombre: 'Toby', handle: '@toby' },
      tiempo: '20 min',
      texto: 'Necesito una siesta así.',
    },
  ],
  post_milo_1: [
    {
      id: 'comment_milo_1',
      mascota: { nombre: 'Kira', handle: '@kira' },
      tiempo: '3 h',
      texto: 'Las hojas secas son el mejor juguete.',
    },
    {
      id: 'comment_milo_2',
      mascota: { nombre: 'Coco', handle: '@coco' },
      tiempo: '2 h',
      texto: 'Un paseo largo siempre vale la pena.',
    },
  ],
  post_nala_1: [
    {
      id: 'comment_nala_1',
      mascota: { nombre: 'Luna', handle: '@luna' },
      tiempo: '6 h',
      texto: 'El estirón de la mañana no se negocia.',
    },
    {
      id: 'comment_nala_2',
      mascota: { nombre: 'Milo', handle: '@milo' },
      tiempo: '5 h',
      texto: 'Yo también quiero esa rutina.',
    },
    {
      id: 'comment_nala_3',
      mascota: { nombre: 'Toby', handle: '@toby' },
      tiempo: '4 h',
      texto: 'Se ve muy cómoda.',
    },
    {
      id: 'comment_nala_4',
      mascota: { nombre: 'Kira', handle: '@kira' },
      tiempo: '3 h',
      texto: 'La siesta es un arte.',
    },
    {
      id: 'comment_nala_5',
      mascota: { nombre: 'Coco', handle: '@coco' },
      tiempo: '2 h',
      texto: 'Aplausos para Nala.',
    },
    {
      id: 'comment_nala_6',
      mascota: { nombre: 'Milo', handle: '@milo' },
      tiempo: '1 h',
      texto: 'Ya me dio sueño.',
    },
    {
      id: 'comment_nala_7',
      mascota: { nombre: 'Luna', handle: '@luna' },
      tiempo: '30 min',
      texto: 'Que siga la siesta.',
    },
  ],
  post_toby_1: [
    {
      id: 'comment_toby_1',
      mascota: { nombre: 'Nala', handle: '@nala' },
      tiempo: '20 h',
      texto: '¡Buen Toby! La constancia gana.',
    },
    {
      id: 'comment_toby_2',
      mascota: { nombre: 'Luna', handle: '@luna' },
      tiempo: '18 h',
      texto: 'La recompensa siempre es justa.',
    },
    {
      id: 'comment_toby_3',
      mascota: { nombre: 'Milo', handle: '@milo' },
      tiempo: '12 h',
      texto: 'Enséñame ese truco.',
    },
    {
      id: 'comment_toby_4',
      mascota: { nombre: 'Kira', handle: '@kira' },
      tiempo: '8 h',
      texto: 'Qué orgullo.',
    },
    {
      id: 'comment_toby_5',
      mascota: { nombre: 'Coco', handle: '@coco' },
      tiempo: '4 h',
      texto: 'Premio doble para Toby.',
    },
  ],
};
