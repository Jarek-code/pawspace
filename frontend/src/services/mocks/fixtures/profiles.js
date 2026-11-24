/**
 * Fixtures de perfiles y de la rejilla de publicaciones.
 *
 * Solo contiene campos con soporte en database/schema.sql (MASCOTA,
 * SEGUIMIENTO, PUBLICACION). La portada, ubicación y sitio web se omiten a
 * propósito porque el esquema no los define.
 */

const ANA = { nombre: 'Ana Ruiz', handle: '@ana' };

function makePosts(handle, nombre, captions, { likes = 24, comentarios = 3 } = {}) {
  const key = handle.replace(/^@/, '').replace(/[^a-z0-9]+/gi, '_');

  return captions.map((caption, index) => ({
    id: `profile_${key}_${index + 1}`,
    mascota: { nombre, handle },
    tiempo: index === 0 ? '2 h' : `${index + 1} d`,
    texto: '',
    media: { caption },
    likes: likes + index,
    comentarios,
    meGusta: false,
    guardado: false,
  }));
}

export const profiles = {
  '@luna': {
    id: 'pet_luna',
    nombre: 'Luna',
    handle: '@luna',
    especie: 'Gato',
    raza: 'Siamés',
    sexo: 'Hembra',
    fechaNacimiento: '2022-05-12',
    bio: 'Amante de las siestas al sol y de los tejados de Madrid. Vivimos juntas desde 2022.',
    privacidad: 'publico',
    tutor: ANA,
    stats: { publicaciones: 48, seguidores: 1200, siguiendo: 348 },
    publicaciones: makePosts('@luna', 'Luna', [
      'Foto de Luna',
      'Siesta al sol',
      'Tejado favorito',
      'Con Milo',
      'Paseo nocturno',
      'Rincón secreto',
    ]),
  },
  '@milo': {
    id: 'pet_milo',
    nombre: 'Milo',
    handle: '@milo',
    especie: 'Gato',
    raza: 'Gato europeo',
    sexo: 'Macho',
    fechaNacimiento: '2024-03-01',
    bio: 'Explorador de tejados y cazador de rayos de sol. Vive en Barcelona con Ana y Luna.',
    privacidad: 'publico',
    tutor: ANA,
    stats: { publicaciones: 36, seguidores: 842, siguiendo: 120 },
    publicaciones: makePosts(
      '@milo',
      'Milo',
      ['Milo en el tejado', 'Siesta', 'Con Luna', 'Ventana', 'Caja', 'Atardecer'],
      { likes: 42, comentarios: 8 },
    ),
  },
  '@nala': {
    id: 'pet_nala',
    nombre: 'Nala',
    handle: '@nala',
    especie: 'Gato',
    raza: 'Gata atigrada',
    sexo: 'Hembra',
    fechaNacimiento: '2023-01-18',
    bio: 'Experta en cajas y ventanas. Si hay un rayo de sol, ya lo encontró.',
    privacidad: 'publico',
    tutor: { nombre: 'Diego Salas', handle: '@diego' },
    stats: { publicaciones: 29, seguidores: 640, siguiendo: 210 },
    publicaciones: makePosts('@nala', 'Nala', [
      'Caja nueva',
      'Ventana',
      'Siesta larga',
      'Planta favorita',
      'Con Toby',
      'Atardecer',
    ]),
  },
  '@kira': {
    id: 'pet_kira',
    nombre: 'Kira',
    handle: '@kira',
    especie: 'Perro',
    raza: 'Border collie',
    sexo: 'Hembra',
    fechaNacimiento: '2021-07-09',
    bio: 'Aprende trucos nuevos cada semana. Le encantan los parques y las pelotas.',
    privacidad: 'publico',
    tutor: { nombre: 'Lucía Ferrer', handle: '@lucia' },
    stats: { publicaciones: 64, seguidores: 980, siguiendo: 156 },
    publicaciones: makePosts(
      '@kira',
      'Kira',
      ['Entrenamiento', 'Parque', 'Pelota nueva', 'Premio'],
      { likes: 31, comentarios: 6 },
    ),
  },
  '@toby': {
    id: 'pet_toby',
    nombre: 'Toby',
    handle: '@toby',
    especie: 'Perro',
    raza: 'Mestizo',
    sexo: 'Macho',
    fechaNacimiento: '2022-11-02',
    bio: 'El más sociable del parque. Hoy aprendió a dar la pata.',
    privacidad: 'publico',
    tutor: { nombre: 'Marco Díaz', handle: '@marco' },
    stats: { publicaciones: 22, seguidores: 410, siguiendo: 203 },
    publicaciones: makePosts(
      '@toby',
      'Toby',
      ['Dar la pata', 'Paseo', 'Amigos del parque', 'Siesta'],
      { likes: 21, comentarios: 4 },
    ),
  },
  '@coco': {
    id: 'pet_coco',
    nombre: 'Coco',
    handle: '@coco',
    especie: 'Conejo',
    raza: 'Conejo enano',
    sexo: 'Macho',
    fechaNacimiento: '2023-06-21',
    bio: 'Zanahorias y siestas al sol. Especialista en esconderse entre almohadas.',
    privacidad: 'publico',
    tutor: { nombre: 'Sofía Ramírez', handle: '@sofia' },
    stats: { publicaciones: 17, seguidores: 285, siguiendo: 96 },
    publicaciones: makePosts(
      '@coco',
      'Coco',
      ['Zanahoria', 'Siesta', 'Almohadas', 'Jardín', 'Con Luna'],
      { likes: 19, comentarios: 3 },
    ),
  },
  '@simba': {
    id: 'pet_simba',
    nombre: 'Simba',
    handle: '@simba',
    especie: 'Gato',
    raza: 'Golden retriever',
    sexo: 'Macho',
    fechaNacimiento: '2021-02-14',
    bio: 'Curioso por naturaleza. Le gusta observar todo desde la ventana.',
    privacidad: 'publico',
    tutor: { nombre: 'Elena Vidal', handle: '@elena' },
    stats: { publicaciones: 51, seguidores: 860, siguiendo: 302 },
    publicaciones: makePosts('@simba', 'Simba', ['Ventana', 'Siesta', 'Jardín'], {
      likes: 28,
      comentarios: 5,
    }),
  },
  '@canela': {
    id: 'pet_canela',
    nombre: 'Canela',
    handle: '@canela',
    especie: 'Perro',
    raza: 'Golden retriever',
    sexo: 'Hembra',
    fechaNacimiento: '2024-04-03',
    bio: 'Cachorra de dos años. Le encanta el agua y hacer amigos en el parque.',
    privacidad: 'privado',
    tutor: { nombre: 'Pablo Soto', handle: '@pablo' },
    stats: { publicaciones: 39, seguidores: 640, siguiendo: 188 },
    publicaciones: makePosts('@canela', 'Canela', ['Primer baño', 'Parque'], {
      likes: 24,
      comentarios: 4,
    }),
  },
  '@michi': {
    id: 'pet_michi',
    nombre: 'Michi',
    handle: '@michi',
    especie: 'Gato',
    raza: 'Gato europeo',
    sexo: 'Hembra',
    fechaNacimiento: '2021-10-14',
    bio: 'Gata de oficina. Supervisa cada reporte desde el teclado.',
    privacidad: 'publico',
    tutor: { nombre: 'Mariana Ortega', handle: '@mariana' },
    stats: { publicaciones: 12, seguidores: 320, siguiendo: 84 },
    publicaciones: makePosts('@michi', 'Michi', ['Siesta en el teclado', 'Ventana', 'Café'], {
      likes: 16,
      comentarios: 2,
    }),
  },
};

export const profileSuggestions = ['@milo', '@nala', '@kira', '@toby'];

export const similarProfiles = {
  '@luna': ['@milo', '@nala', '@coco'],
  '@milo': ['@nala', '@toby', '@coco'],
  '@nala': ['@luna', '@milo', '@coco'],
  '@kira': ['@toby', '@canela', '@coco'],
  '@toby': ['@kira', '@canela', '@milo'],
  '@coco': ['@luna', '@nala', '@milo'],
  '@simba': ['@milo', '@nala', '@luna'],
  '@canela': ['@kira', '@toby', '@coco'],
};

export const profilePosts = Object.values(profiles).flatMap((profile) => profile.publicaciones);
