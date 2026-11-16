import gatitoProyectado from '@/assets/brand/gatito-proyectado.svg';
import gatoMarciano from '@/assets/brand/gato-marciano.svg';
import israelitaPromedio from '@/assets/brand/israelita-promedio.svg';
import perritoAstronauta from '@/assets/brand/perrito-astronauta.svg';

/**
 * Fixtures de historias. El esquema no guarda texto superpuesto, audiencia ni
 * respuestas configurables: la historia es media (imagen o video) con visitas
 * y me gusta.
 */

const media = (url, alt) => ({ type: 'image', url, alt });

const story = (id, url, alt, { vistas = 12, likes = 4, horas = 2, propia = false } = {}) => ({
  id,
  media: media(url, alt),
  vistas,
  likes,
  meGusta: false,
  propia,
  creadoEn: `hace ${horas} h`,
  venceEn: Math.max(1, 24 - horas),
});

export const storyGroups = [
  {
    handle: '@luna',
    nombre: 'Luna',
    propia: true,
    stories: [
      story('story_luna_1', gatitoProyectado, 'Luna mirando el cielo', {
        vistas: 34,
        likes: 12,
        horas: 1,
        propia: true,
      }),
      story('story_luna_2', gatoMarciano, 'Luna en su tejado', {
        vistas: 28,
        likes: 9,
        horas: 3,
        propia: true,
      }),
      story('story_luna_3', gatitoProyectado, 'Luna al sol', {
        vistas: 21,
        likes: 7,
        horas: 5,
        propia: true,
      }),
      story('story_luna_4', gatoMarciano, 'Luna curiosa', {
        vistas: 18,
        likes: 5,
        horas: 8,
        propia: true,
      }),
    ],
  },
  {
    handle: '@milo',
    nombre: 'Milo',
    propia: false,
    stories: [
      story('story_milo_1', perritoAstronauta, 'Milo listo para explorar', {
        vistas: 22,
        likes: 8,
      }),
      story('story_milo_2', israelitaPromedio, 'Milo en el parque', { vistas: 17, likes: 6 }),
      story('story_milo_3', perritoAstronauta, 'Milo descansando', { vistas: 11, likes: 4 }),
    ],
  },
  {
    handle: '@nala',
    nombre: 'Nala',
    propia: false,
    stories: [
      story('story_nala_1', gatoMarciano, 'Nala en la ventana', { vistas: 15, likes: 5 }),
      story('story_nala_2', gatitoProyectado, 'Nala curiosa', { vistas: 9, likes: 3 }),
    ],
  },
  {
    handle: '@kira',
    nombre: 'Kira',
    propia: false,
    stories: [
      story('story_kira_1', israelitaPromedio, 'Kira en el parque', { vistas: 20, likes: 7 }),
      story('story_kira_2', perritoAstronauta, 'Kira entrenando', { vistas: 14, likes: 4 }),
    ],
  },
  {
    handle: '@toby',
    nombre: 'Toby',
    propia: false,
    stories: [
      story('story_toby_1', perritoAstronauta, 'Toby y su pelota', { vistas: 12, likes: 3 }),
      story('story_toby_2', israelitaPromedio, 'Toby en el paseo', { vistas: 8, likes: 2 }),
    ],
  },
  {
    handle: '@coco',
    nombre: 'Coco',
    propia: false,
    stories: [story('story_coco_1', gatitoProyectado, 'Coco al sol', { vistas: 7, likes: 2 })],
  },
];

export const archivedStories = [
  {
    id: 'archive_luna_1',
    media: media(gatitoProyectado, 'Luna en el jardín'),
    vistas: 63,
    likes: 18,
    fecha: '12 feb',
  },
  {
    id: 'archive_luna_2',
    media: media(gatoMarciano, 'Luna en el tejado'),
    vistas: 48,
    likes: 15,
    fecha: '8 feb',
  },
  {
    id: 'archive_luna_3',
    media: media(gatitoProyectado, 'Siesta de Luna'),
    vistas: 39,
    likes: 11,
    fecha: '2 feb',
  },
  {
    id: 'archive_luna_4',
    media: media(gatoMarciano, 'Luna curiosa'),
    vistas: 31,
    likes: 9,
    fecha: '27 ene',
  },
  {
    id: 'archive_luna_5',
    media: media(gatitoProyectado, 'Luna al sol'),
    vistas: 27,
    likes: 8,
    fecha: '21 ene',
  },
  {
    id: 'archive_luna_6',
    media: media(gatoMarciano, 'Luna en casa'),
    vistas: 19,
    likes: 6,
    fecha: '15 ene',
  },
];
