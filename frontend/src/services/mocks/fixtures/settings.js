/**
 * Fixtures de configuración de la persona.
 *
 * No existe un endpoint real de ajustes en el backend estable. Las formas
 * siguen `docs/backend/CONTEXTO-BACKEND.md` para USUARIO, USUARIO_PERFIL,
 * SESION, USUARIO_PREFERENCIAS y REPORTE; el resto es contrato provisional.
 */
export const settingsFixture = {
  cuenta: {
    nombre: 'Sofía Ramírez',
    email: 'sofia.ramirez@example.com',
    telefono: '+34 600 123 456',
    ubicacion: 'Madrid, España',
    bio: 'Tutora de Luna. Amante de los paseos largos y las tardes de parque.',
    handle: '@sofia',
    miembroDesde: 'marzo 2025',
    avatar: null,
  },
  sesiones: [
    {
      id: 'ses_actual',
      dispositivo: 'MacBook Pro',
      ubicacion: 'Madrid',
      tiempo: 'ahora',
      actual: true,
    },
    {
      id: 'ses_iphone',
      dispositivo: 'iPhone 15',
      ubicacion: 'Madrid',
      tiempo: 'hace 2 h',
      actual: false,
    },
  ],
  privacidad: {
    perfilPublico: true,
    mostrarUbicacion: false,
    mensajesDesconocidos: false,
    compartirHistorias: true,
  },
  filtros: {
    ocultarComentariosOfensivos: true,
    filtrarPalabrasClave: true,
    ocultarCuentasSinFoto: false,
  },
  reportes: [
    {
      id: 'rep_1',
      titulo: 'Comentario ofensivo',
      objetivo: 'En la publicación de Milo',
      categoria: 'ACOSO',
      estado: 'EN_REVISION',
      fecha: 'Hace 2 días',
      detalle: 'Un comentario con insultos en la publicación del tejado.',
      cronologia: [
        { fecha: 'Hace 2 días', texto: 'Enviaste el reporte.' },
        { fecha: 'Hace 1 día', texto: 'El equipo lo marcó en revisión.' },
      ],
    },
    {
      id: 'rep_2',
      titulo: 'Cuenta falsa',
      objetivo: 'Perfil de @unknown_pet',
      categoria: 'SUPLANTACION',
      estado: 'RESUELTO',
      fecha: 'Hace 5 días',
      detalle: 'El perfil usaba fotos y el nombre de otra mascota.',
      cronologia: [
        { fecha: 'Hace 5 días', texto: 'Enviaste el reporte.' },
        { fecha: 'Hace 4 días', texto: 'El equipo confirmó la suplantación.' },
        { fecha: 'Hace 4 días', texto: 'El perfil fue retirado.' },
      ],
    },
    {
      id: 'rep_3',
      titulo: 'Spam en mensajes',
      objetivo: 'Conversación con @toby',
      categoria: 'SPAM',
      estado: 'RESUELTO',
      fecha: 'Hace 1 semana',
      detalle: 'Mensajes repetidos con enlaces externos.',
      cronologia: [
        { fecha: 'Hace 1 semana', texto: 'Enviaste el reporte.' },
        { fecha: 'Hace 6 días', texto: 'El equipo limitó la cuenta reportada.' },
      ],
    },
  ],
};
