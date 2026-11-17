/**
 * Conversaciones, solicitudes y mensajes de demostración.
 *
 * La forma sigue database/schema.sql: CONVERSACION,
 * CONVERSACION_PARTICIPANTE y MENSAJE. Las solicitudes de conversación no
 * existen como tabla propia; aquí representan una conversación pendiente de
 * aceptar y se resuelven en el adaptador de mocks.
 */
export const conversations = [
  {
    id: 'conv_milo',
    mascota: {
      nombre: 'Milo',
      handle: '@milo',
      especie: 'Gato',
      raza: 'Gato europeo',
      avatar: null,
    },
    enLinea: true,
    ultimoMensaje: '¡Muy bien! Hoy fuimos al parque.',
    tiempo: '10:42',
    noLeidos: 2,
    silenciada: false,
    bloqueada: false,
    archivos: [
      { id: 'file_milo_1', tipo: 'image', nombre: 'Foto', fecha: 'Hace 2 días' },
      { id: 'file_milo_2', tipo: 'image', nombre: 'Foto', fecha: 'Hace 3 días' },
      { id: 'file_milo_3', tipo: 'image', nombre: 'Foto', fecha: 'Hace 5 días' },
      { id: 'file_milo_4', tipo: 'image', nombre: 'Foto', fecha: 'Hace 6 días' },
    ],
    mensajes: [
      {
        id: 'msg_milo_1',
        propia: false,
        texto: '¡Hola! ¿Cómo está Luna?',
        hora: '10:40',
        fecha: 'Hoy',
      },
      {
        id: 'msg_milo_2',
        propia: true,
        texto: '¡Muy bien! Hoy fuimos al parque.',
        hora: '10:42',
        fecha: 'Hoy',
      },
      {
        id: 'msg_milo_3',
        propia: false,
        texto: 'Qué envidia. ¿Se portó bien con otros perros?',
        hora: '10:43',
        fecha: 'Hoy',
      },
      {
        id: 'msg_milo_4',
        propia: true,
        texto: 'Sí, jugó con todos. Te mando una foto.',
        hora: '10:44',
        fecha: 'Hoy',
      },
      {
        id: 'msg_milo_5',
        propia: true,
        texto: '',
        hora: '10:44',
        fecha: 'Hoy',
        adjunto: { tipo: 'image', nombre: 'Foto', tamano: '1.8 MB' },
      },
      {
        id: 'msg_milo_6',
        propia: false,
        texto: '¡Me encanta!',
        hora: '10:46',
        fecha: 'Hoy',
      },
      {
        id: 'msg_milo_7',
        propia: true,
        texto: 'Nos vemos el sábado.',
        hora: '10:47',
        fecha: 'Hoy',
      },
    ],
  },
  {
    id: 'conv_nala',
    mascota: {
      nombre: 'Nala',
      handle: '@nala',
      especie: 'Gato',
      raza: 'Gata atigrada',
      avatar: null,
    },
    enLinea: false,
    ultimoMensaje: 'Te compartió una foto',
    tiempo: '09:18',
    noLeidos: 1,
    silenciada: false,
    bloqueada: false,
    archivos: [{ id: 'file_nala_1', tipo: 'image', nombre: 'Foto', fecha: 'Ayer' }],
    mensajes: [
      {
        id: 'msg_nala_1',
        propia: false,
        texto: 'Te compartió una foto',
        hora: '09:18',
        fecha: 'Hoy',
        adjunto: { tipo: 'image', nombre: 'Foto', tamano: '2.1 MB' },
      },
    ],
  },
  {
    id: 'conv_kira',
    mascota: {
      nombre: 'Kira',
      handle: '@kira',
      especie: 'Perro',
      raza: 'Border collie',
      avatar: null,
    },
    enLinea: false,
    ultimoMensaje: '¿Vamos el sábado por la mañana?',
    tiempo: 'Ayer',
    noLeidos: 0,
    silenciada: false,
    bloqueada: false,
    archivos: [],
    mensajes: [
      {
        id: 'msg_kira_1',
        propia: false,
        texto: '¿Vamos el sábado por la mañana?',
        hora: '18:20',
        fecha: 'Ayer',
      },
    ],
  },
  {
    id: 'conv_simba',
    mascota: {
      nombre: 'Simba',
      handle: '@simba',
      especie: 'Gato',
      raza: 'Golden retriever',
      avatar: null,
    },
    enLinea: true,
    ultimoMensaje: 'Gracias por la recomendación',
    tiempo: 'Lun',
    noLeidos: 0,
    silenciada: true,
    bloqueada: false,
    archivos: [{ id: 'file_simba_1', tipo: 'file', nombre: 'Guía de paseo.pdf', fecha: 'Lun' }],
    mensajes: [
      {
        id: 'msg_simba_1',
        propia: false,
        texto: 'Gracias por la recomendación',
        hora: '17:05',
        fecha: 'Lun',
      },
    ],
  },
];

export const conversationRequests = [
  {
    id: 'request_toby',
    mascota: {
      nombre: 'Toby',
      handle: '@toby',
      especie: 'Perro',
      raza: 'Mestizo',
      avatar: null,
    },
    tiempo: 'Ayer',
  },
  {
    id: 'request_coco',
    mascota: {
      nombre: 'Coco',
      handle: '@coco',
      especie: 'Conejo',
      raza: 'Conejo enano',
      avatar: null,
    },
    tiempo: 'Ayer',
  },
];

export const messageSuggestions = ['@nala', '@kira', '@simba'];
