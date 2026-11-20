/**
 * Centro de ayuda, artículos y solicitudes de soporte.
 *
 * No existe un endpoint real de ayuda en el backend estable. Las formas son
 * provisionales y se documentan en frontend/docs/API.md. El contenido sigue
 * las reglas del producto: sin verificación de correo, sin planes ni logros.
 */

export const helpCategories = [
  {
    id: 'cuenta',
    title: 'Cuenta y acceso',
    description: 'Correo, contraseña, sesiones e inicio de sesión.',
    shortDescription: 'Correo, sesiones y contraseña.',
    icon: 'user',
    keywords: ['cuenta', 'acceso', 'contraseña', 'correo', 'sesiones', 'iniciar sesion'],
  },
  {
    id: 'privacidad',
    title: 'Privacidad y seguridad',
    description: 'Permisos, bloqueos y control de datos.',
    shortDescription: 'Permisos y bloqueos.',
    icon: 'lock',
    keywords: ['privacidad', 'seguridad', 'bloqueos', 'datos', 'permisos'],
  },
  {
    id: 'mensajeria',
    title: 'Mensajería',
    description: 'Conversaciones, solicitudes y adjuntos.',
    shortDescription: 'Chats y solicitudes.',
    icon: 'message-circle',
    keywords: ['mensajeria', 'mensajes', 'conversaciones', 'chats', 'solicitudes', 'adjuntos'],
  },
  {
    id: 'moderacion',
    title: 'Reportes y moderación',
    description: 'Cómo reportar, apelar y entender decisiones.',
    shortDescription: 'Reportes y apelaciones.',
    icon: 'flag',
    keywords: ['reportes', 'moderacion', 'reportar', 'apelar', 'sanciones', 'normas'],
  },
];

export const helpArticles = [
  {
    slug: 'cambiar-contrasena',
    category: 'cuenta',
    title: 'Cómo cambiar tu contraseña',
    summary:
      'Cambiar tu contraseña cierra las sesiones abiertas en otros dispositivos y protege tu cuenta.',
    updated: 'hace 2 semanas',
    readingTime: 3,
    keywords: ['contraseña', 'seguridad', 'cuenta', 'sesiones'],
    intro:
      'Cambiar tu contraseña cierra las sesiones abiertas en otros dispositivos y protege tu cuenta. Sigue estos pasos.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Entra en Ajustes',
            body: 'Abre tu perfil y pulsa Ajustes en el menú de la cuenta.',
          },
          {
            title: 'Abre Seguridad',
            body: 'En la pestaña Seguridad, pulsa Actualizar junto a Contraseña.',
          },
          {
            title: 'Confirma el cambio',
            body: 'Escribe tu contraseña actual y la nueva dos veces. Guarda.',
          },
        ],
      },
      {
        id: 'si-algo-falla',
        title: 'Si algo falla',
        callout: {
          icon: 'shield',
          title: 'Si no reconoces una sesión',
          body: 'Ciérrala desde Sesiones activas y cambia tu contraseña de inmediato.',
        },
      },
    ],
    related: ['cerrar-sesiones-activas', 'problemas-al-iniciar-sesion', 'proteger-tu-cuenta'],
  },
  {
    slug: 'crear-contrasena-segura',
    category: 'cuenta',
    title: 'Cómo crear una contraseña segura',
    summary: 'Usa una contraseña única, larga y distinta a la de otras cuentas.',
    updated: 'hace 3 semanas',
    readingTime: 4,
    keywords: ['contraseña', 'seguridad', 'cuenta'],
    intro:
      'Una contraseña segura es larga, única y no se reutiliza en otros servicios. Estas pautas te ayudan a crearla.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Combina palabras',
            body: 'Une tres o cuatro palabras que recuerdes y agrega números o símbolos.',
          },
          {
            title: 'Evita datos personales',
            body: 'No uses tu nombre, el de tu mascota ni fechas fáciles de adivinar.',
          },
          {
            title: 'Guárdala en un lugar seguro',
            body: 'Si usas un gestor de contraseñas, protege también su acceso principal.',
          },
        ],
      },
    ],
    related: ['cambiar-contrasena', 'proteger-tu-cuenta', 'problemas-al-iniciar-sesion'],
  },
  {
    slug: 'cerrar-sesiones-activas',
    category: 'cuenta',
    title: 'Cómo cerrar sesiones activas',
    summary: 'Revisa los dispositivos conectados y cierra las sesiones que no reconozcas.',
    updated: 'hace 2 semanas',
    readingTime: 3,
    keywords: ['sesiones', 'dispositivos', 'seguridad', 'cuenta'],
    intro:
      'En Sesiones activas ves los dispositivos donde tu cuenta sigue abierta. Cierra cualquiera que no reconozcas.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre Ajustes',
            body: 'Entra en tu perfil y elige Ajustes.',
          },
          {
            title: 'Revisa la lista',
            body: 'Comprueba el dispositivo, la ubicación y la última actividad.',
          },
          {
            title: 'Cierra la sesión',
            body: 'Pulsa Cerrar junto al dispositivo. También puedes cerrar todas las demás.',
          },
        ],
      },
    ],
    related: ['cambiar-contrasena', 'proteger-tu-cuenta', 'problemas-al-iniciar-sesion'],
  },
  {
    slug: 'problemas-al-iniciar-sesion',
    category: 'cuenta',
    title: 'Problemas al iniciar sesión',
    summary: 'Revisa tus datos, el estado de la cuenta y las mayúsculas del correo.',
    updated: 'hace 1 mes',
    readingTime: 5,
    keywords: ['iniciar sesion', 'acceso', 'correo', 'contraseña', 'cuenta desactivada'],
    intro:
      'Si no puedes entrar, primero confirma que usas el correo y la contraseña correctos. Después revisa estos casos.',
    sections: [
      {
        id: 'revisa-tus-datos',
        title: 'Revisa tus datos',
        steps: [
          {
            title: 'Confirma el correo',
            body: 'Escribe el correo completo, sin espacios antes ni después.',
          },
          {
            title: 'Revisa la contraseña',
            body: 'Comprueba el teclado y las mayúsculas. Puedes mostrarla con el botón Mostrar.',
          },
          {
            title: 'Prueba otro dispositivo',
            body: 'Si funciona en otro navegador, el problema puede estar en este dispositivo.',
          },
        ],
      },
      {
        id: 'si-algo-falla',
        title: 'Si algo falla',
        callout: {
          icon: 'alert',
          title: 'Cuenta desactivada',
          body: 'Si el acceso se bloquea, contacta con soporte para revisar el estado de tu cuenta.',
        },
      },
    ],
    related: ['cambiar-contrasena', 'cerrar-sesiones-activas', 'proteger-tu-cuenta'],
  },
  {
    slug: 'proteger-tu-cuenta',
    category: 'cuenta',
    title: 'Cómo proteger tu cuenta',
    summary: 'Contraseña única, sesiones revisadas y cuidado con los enlaces externos.',
    updated: 'hace 1 semana',
    readingTime: 6,
    keywords: ['seguridad', 'cuenta', 'proteccion', 'contraseña', 'sesiones'],
    intro:
      'Proteger tu cuenta es una rutina sencilla: una contraseña única, sesiones revisadas y atención a los enlaces.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Usa una contraseña única',
            body: 'No reutilices la de tu correo ni la de otros servicios.',
          },
          {
            title: 'Revisa tus sesiones',
            body: 'Cierra las que no reconozcas desde Ajustes › Seguridad.',
          },
          {
            title: 'Desconfía de enlaces',
            body: 'No compartas tu contraseña ni datos personales por mensajes.',
          },
        ],
      },
    ],
    related: ['crear-contrasena-segura', 'cerrar-sesiones-activas', 'cambiar-contrasena'],
  },
  {
    slug: 'cambiar-tu-correo',
    category: 'cuenta',
    title: 'Cómo cambiar tu correo',
    summary: 'Actualiza el correo de contacto desde los datos de tu cuenta.',
    updated: 'hace 3 semanas',
    readingTime: 2,
    keywords: ['correo', 'email', 'cuenta', 'contacto'],
    intro:
      'El correo de tu cuenta se usa para iniciar sesión y recibir respuestas de soporte. Puedes cambiarlo desde Ajustes.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre Ajustes › Cuenta',
            body: 'Entra en Datos personales.',
          },
          {
            title: 'Edita el correo',
            body: 'Escribe el nuevo correo y guarda los cambios.',
          },
          {
            title: 'Comprueba el acceso',
            body: 'La próxima vez que entres, usa el correo nuevo.',
          },
        ],
      },
    ],
    related: ['actualizar-datos-de-cuenta', 'problemas-al-iniciar-sesion', 'proteger-tu-cuenta'],
  },
  {
    slug: 'actualizar-datos-de-cuenta',
    category: 'cuenta',
    title: 'Cómo actualizar los datos de tu cuenta',
    summary: 'Cambia tu nombre, teléfono, ubicación y biografía cuando lo necesites.',
    updated: 'hace 1 mes',
    readingTime: 2,
    keywords: ['datos', 'nombre', 'telefono', 'ubicacion', 'biografia', 'cuenta'],
    intro:
      'Los datos de la persona son distintos de los de tu mascota. Se editan en Ajustes › Cuenta.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Entra en Ajustes',
            body: 'Abre tu perfil y selecciona Ajustes.',
          },
          {
            title: 'Edita el campo',
            body: 'Cambia el nombre o el correo y pulsa Guardar cambios.',
          },
          {
            title: 'Revisa el perfil de tu mascota',
            body: 'La información pública de tu mascota se edita desde su perfil.',
          },
        ],
      },
    ],
    related: ['cambiar-tu-correo', 'configurar-tu-privacidad', 'eliminar-tu-cuenta'],
  },
  {
    slug: 'eliminar-tu-cuenta',
    category: 'cuenta',
    title: 'Cómo eliminar tu cuenta',
    summary: 'Confirma con tu handle y ten en cuenta lo que se borra de forma permanente.',
    updated: 'hace 2 semanas',
    readingTime: 4,
    keywords: ['eliminar cuenta', 'borrar cuenta', 'cuenta', 'datos'],
    intro:
      'Puedes eliminar tu cuenta desde la zona de peligro de Ajustes. La acción es permanente y requiere confirmar tu handle.',
    sections: [
      {
        id: 'antes-de-empezar',
        title: 'Antes de empezar',
        steps: [
          {
            title: 'Descarga tus datos',
            body: 'Si quieres conservar una copia, solicita la descarga antes de eliminar la cuenta.',
          },
          {
            title: 'Revisa las sesiones',
            body: 'Cerrar las demás sesiones evita accesos abiertos en otros dispositivos.',
          },
        ],
      },
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre Ajustes › Cuenta',
            body: 'Desplázate hasta la zona de peligro.',
          },
          {
            title: 'Pulsa Eliminar cuenta',
            body: 'Escribe tu handle exacto, con Arroba incluida, para habilitar la confirmación.',
          },
        ],
      },
      {
        id: 'si-algo-falla',
        title: 'Si algo falla',
        callout: {
          icon: 'alert',
          title: 'No se puede deshacer',
          body: 'Si necesitas ayuda antes de continuar, contacta con soporte: no podemos recuperar una cuenta eliminada.',
        },
      },
    ],
    related: ['descargar-tus-datos', 'cerrar-sesiones-activas', 'proteger-tu-cuenta'],
  },
  {
    slug: 'quien-puede-ver-mi-perfil',
    category: 'privacidad',
    title: '¿Quién puede ver mi perfil?',
    summary:
      'El perfil público es visible para cualquier persona; el privado, solo para seguidores.',
    updated: 'hace 5 días',
    readingTime: 3,
    keywords: ['perfil', 'privacidad', 'visible', 'seguidores', 'publico'],
    intro:
      'La visibilidad del perfil de tu mascota depende de la opción de privacidad. Un perfil público lo ve cualquier persona; uno privado solo tus seguidores.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre Ajustes › Privacidad',
            body: 'Encuentra la opción Perfil público.',
          },
          {
            title: 'Elige la visibilidad',
            body: 'Desactívala si solo quieres que tus seguidores vean el contenido.',
          },
          {
            title: 'Revisa lo que compartes',
            body: 'La ubicación y las historias siguen sus propias preferencias.',
          },
        ],
      },
    ],
    related: ['configurar-tu-privacidad', 'historias-y-privacidad', 'bloquear-una-cuenta'],
  },
  {
    slug: 'configurar-tu-privacidad',
    category: 'privacidad',
    title: 'Cómo configurar tu privacidad',
    summary: 'Controla el perfil, la ubicación, los mensajes y las historias en un solo lugar.',
    updated: 'hace 1 semana',
    readingTime: 5,
    keywords: ['privacidad', 'configuracion', 'perfil', 'ubicacion', 'historias'],
    intro: 'Las preferencias de privacidad viven en Ajustes › Privacidad y se guardan al instante.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Decide quién ve el perfil',
            body: 'Un perfil privado limita el contenido a tus seguidores.',
          },
          {
            title: 'Oculta la ubicación',
            body: 'La ubicación solo se muestra si el perfil es público y la opción está activa.',
          },
          {
            title: 'Limita los mensajes',
            body: 'Desactiva los mensajes de desconocidos para recibir solo solicitudes.',
          },
        ],
      },
    ],
    related: ['quien-puede-ver-mi-perfil', 'controlar-quien-te-escribe', 'historias-y-privacidad'],
  },
  {
    slug: 'bloquear-una-cuenta',
    category: 'privacidad',
    title: 'Cómo bloquear una cuenta',
    summary: 'Un bloqueo oculta su contenido y sus mensajes sin avisar a la otra persona.',
    updated: 'hace 2 semanas',
    readingTime: 3,
    keywords: ['bloquear', 'bloqueo', 'cuenta', 'privacidad'],
    intro:
      'Al bloquear una cuenta dejas de ver su contenido y esa cuenta no puede escribirte. Puedes deshacerlo cuando quieras.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre el perfil',
            body: 'Entra en el perfil de la mascota y abre el menú de acciones.',
          },
          {
            title: 'Pulsa Bloquear',
            body: 'Confirma la acción en el aviso.',
          },
          {
            title: 'Revisa tus bloqueos',
            body: 'Desbloquea desde Ajustes › Privacidad › Cuentas bloqueadas.',
          },
        ],
      },
    ],
    related: ['quien-puede-ver-mi-perfil', 'reportar-una-cuenta', 'controlar-quien-te-escribe'],
  },
  {
    slug: 'controlar-quien-te-escribe',
    category: 'privacidad',
    title: 'Cómo controlar quién te escribe',
    summary: 'Limita los mensajes de desconocidos y gestiona las solicitudes de conversación.',
    updated: 'hace 2 semanas',
    readingTime: 3,
    keywords: ['mensajes', 'desconocidos', 'privacidad', 'solicitudes'],
    intro:
      'Puedes recibir mensajes solo de cuentas que conoces. Las demás conversaciones quedan como solicitudes.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre Ajustes › Privacidad',
            body: 'Busca Permitir mensajes de desconocidos.',
          },
          {
            title: 'Desactiva la opción',
            body: 'Las cuentas nuevas tendrán que enviarte una solicitud.',
          },
          {
            title: 'Gestiona las solicitudes',
            body: 'Acéptalas o ignóralas desde Mensajes.',
          },
        ],
      },
    ],
    related: ['solicitudes-de-conversacion', 'bloquear-una-cuenta', 'configurar-tu-privacidad'],
  },
  {
    slug: 'descargar-tus-datos',
    category: 'privacidad',
    title: 'Cómo descargar tus datos',
    summary: 'Solicita una copia de la información asociada a tu cuenta.',
    updated: 'hace 3 semanas',
    readingTime: 2,
    keywords: ['datos', 'descargar', 'privacidad', 'copia'],
    intro:
      'Desde Ajustes › Privacidad puedes solicitar una copia de los datos de tu cuenta. Recibirás un aviso cuando esté lista.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre Ajustes › Privacidad',
            body: 'Desplázate hasta la tarjeta de descarga.',
          },
          {
            title: 'Solicita la copia',
            body: 'Pulsa Descargar mis datos y espera la confirmación.',
          },
          {
            title: 'Revisa tu correo',
            body: 'Te avisaremos cuando la descarga esté disponible.',
          },
        ],
      },
    ],
    related: ['eliminar-tu-cuenta', 'configurar-tu-privacidad', 'proteger-tu-cuenta'],
  },
  {
    slug: 'historias-y-privacidad',
    category: 'privacidad',
    title: 'Historias y privacidad',
    summary: 'Decide si tus historias se comparten con tus seguidores.',
    updated: 'hace 1 mes',
    readingTime: 2,
    keywords: ['historias', 'privacidad', 'seguidores'],
    intro:
      'Las historias siguen la visibilidad de tu perfil. Si desactivas su compartición, solo tú podrás verlas.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre Ajustes › Privacidad',
            body: 'Busca la opción Compartir historias.',
          },
          {
            title: 'Desactiva la opción',
            body: 'Tus historias dejarán de mostrarse a otras personas.',
          },
        ],
      },
    ],
    related: ['quien-puede-ver-mi-perfil', 'configurar-tu-privacidad', 'bloquear-una-cuenta'],
  },
  {
    slug: 'enviar-mensajes-y-adjuntos',
    category: 'mensajeria',
    title: 'Cómo enviar mensajes y adjuntos',
    summary: 'Escribe desde la conversación y adjunta una imagen cuando lo necesites.',
    updated: 'hace 4 días',
    readingTime: 3,
    keywords: ['mensajes', 'adjuntos', 'imagen', 'conversacion'],
    intro:
      'En una conversación puedes enviar texto e imágenes. El compositor queda fijo mientras lees el historial.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre la conversación',
            body: 'Entra en Mensajes y elige una mascota.',
          },
          {
            title: 'Escribe o adjunta',
            body: 'Usa el compositor y el botón de adjuntar para elegir una imagen.',
          },
          {
            title: 'Envía el mensaje',
            body: 'Pulsa Enviar. Si falla, verás la opción de reintentar.',
          },
        ],
      },
    ],
    related: [
      'solicitudes-de-conversacion',
      'silenciar-una-conversacion',
      'mensajes-que-no-llegan',
    ],
  },
  {
    slug: 'solicitudes-de-conversacion',
    category: 'mensajeria',
    title: 'Cómo funcionan las solicitudes de conversación',
    summary: 'Las cuentas que no conoces deben enviar una solicitud antes de escribirte.',
    updated: 'hace 2 semanas',
    readingTime: 3,
    keywords: ['solicitudes', 'conversacion', 'mensajes', 'desconocidos'],
    intro:
      'Una solicitud de conversación aparece cuando una cuenta que no sigues quiere escribirte. Puedes aceptarla o ignorarla.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre Mensajes',
            body: 'La pestaña Solicitudes muestra las conversaciones pendientes.',
          },
          {
            title: 'Revisa la cuenta',
            body: 'Abre el perfil si quieres conocer más antes de aceptar.',
          },
          {
            title: 'Acepta o ignora',
            body: 'Al aceptar se crea la conversación; al ignorar se descarta.',
          },
        ],
      },
    ],
    related: ['controlar-quien-te-escribe', 'enviar-mensajes-y-adjuntos', 'bloquear-una-cuenta'],
  },
  {
    slug: 'silenciar-una-conversacion',
    category: 'mensajeria',
    title: 'Cómo silenciar una conversación',
    summary: 'Detén los avisos sin bloquear a la otra cuenta.',
    updated: 'hace 3 semanas',
    readingTime: 2,
    keywords: ['silenciar', 'conversacion', 'avisos', 'notificaciones', 'mensajes'],
    intro:
      'Silenciar una conversación detiene sus avisos, pero los mensajes nuevos siguen llegando al hilo.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre la conversación',
            body: 'Entra en el hilo y abre los detalles.',
          },
          {
            title: 'Pulsa Silenciar',
            body: 'Puedes reactivar los avisos desde el mismo lugar.',
          },
        ],
      },
    ],
    related: [
      'enviar-mensajes-y-adjuntos',
      'mensajes-que-no-llegan',
      'solicitudes-de-conversacion',
    ],
  },
  {
    slug: 'recuperar-un-borrador',
    category: 'mensajeria',
    title: 'Cómo recuperar un borrador',
    summary: 'Los mensajes sin enviar se conservan en este dispositivo.',
    updated: 'hace 1 mes',
    readingTime: 2,
    keywords: ['borrador', 'mensajes', 'recuperar'],
    intro:
      'Si sales de una conversación sin enviar, el texto queda guardado en este dispositivo y se recupera al volver.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Vuelve a la conversación',
            body: 'Abre el mismo hilo desde Mensajes.',
          },
          {
            title: 'Continúa el borrador',
            body: 'El compositor recupera el texto que no enviaste.',
          },
        ],
      },
    ],
    related: ['enviar-mensajes-y-adjuntos', 'mensajes-que-no-llegan', 'silenciar-una-conversacion'],
  },
  {
    slug: 'mensajes-que-no-llegan',
    category: 'mensajeria',
    title: 'Qué hacer si un mensaje no llega',
    summary: 'Revisa el estado del envío, tus borradores y la conexión.',
    updated: 'hace 1 semana',
    readingTime: 3,
    keywords: ['mensajes', 'error', 'enviar', 'conexion', 'reintentar'],
    intro:
      'Si un mensaje no se envía, el hilo lo marca con un aviso y conserva el texto para que puedas reintentar.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Comprueba la conexión',
            body: 'Revisa que el dispositivo tenga internet estable.',
          },
          {
            title: 'Reintenta el envío',
            body: 'Pulsa Reintentar junto al mensaje que falló.',
          },
          {
            title: 'Vuelve a escribir si hace falta',
            body: 'El borrador se conserva hasta que el mensaje se envía.',
          },
        ],
      },
    ],
    related: ['enviar-mensajes-y-adjuntos', 'recuperar-un-borrador', 'silenciar-una-conversacion'],
  },
  {
    slug: 'compartir-una-publicacion',
    category: 'mensajeria',
    title: 'Cómo compartir una publicación por mensaje',
    summary: 'Envía una publicación a una conversación desde el menú de la tarjeta.',
    updated: 'hace 1 mes',
    readingTime: 2,
    keywords: ['compartir', 'publicacion', 'mensajes'],
    intro:
      'Puedes compartir una publicación desde su menú de acciones. Se envía como enlace dentro de la conversación.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre el menú',
            body: 'En la publicación, pulsa el botón de más opciones.',
          },
          {
            title: 'Elige Compartir',
            body: 'Selecciona una conversación o busca una mascota.',
          },
          {
            title: 'Envía',
            body: 'Escribe un mensaje si quieres acompañar el enlace.',
          },
        ],
      },
    ],
    related: ['enviar-mensajes-y-adjuntos', 'reportar-un-mensaje', 'silenciar-una-conversacion'],
  },
  {
    slug: 'reportar-un-mensaje',
    category: 'mensajeria',
    title: 'Cómo reportar un mensaje',
    summary: 'Reporta mensajes ofensivos o spam desde los detalles de la conversación.',
    updated: 'hace 2 semanas',
    readingTime: 3,
    keywords: ['reportar', 'mensaje', 'spam', 'moderacion'],
    intro: 'Si recibes un mensaje ofensivo o spam, puedes reportarlo sin bloquear la conversación.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre los detalles',
            body: 'Entra en la conversación y abre el panel de detalles.',
          },
          {
            title: 'Pulsa Reportar',
            body: 'Elige el motivo y describe lo que ocurrió.',
          },
          {
            title: 'Espera la revisión',
            body: 'Puedes seguir el estado desde Ajustes › Seguridad.',
          },
        ],
      },
    ],
    related: ['reportar-una-cuenta', 'entender-una-decision', 'bloquear-una-cuenta'],
  },
  {
    slug: 'como-reportar-un-comentario',
    category: 'moderacion',
    title: 'Cómo reportar un comentario',
    summary: 'Usa el menú del comentario y elige el motivo que mejor describa el problema.',
    updated: 'hace 4 días',
    readingTime: 3,
    keywords: ['reportar', 'comentario', 'moderacion', 'acoso', 'spam'],
    intro:
      'Reportar un comentario ayuda a revisar contenido que incumple las normas. El reporte es privado.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre el menú del comentario',
            body: 'Pulsa el botón de más opciones junto al comentario.',
          },
          {
            title: 'Elige Reportar',
            body: 'Selecciona el motivo y agrega una descripción si hace falta.',
          },
          {
            title: 'Sigue el estado',
            body: 'El reporte aparece en Ajustes › Seguridad con su cronología.',
          },
        ],
      },
    ],
    related: ['reportar-una-cuenta', 'entender-una-decision', 'normas-de-la-comunidad'],
  },
  {
    slug: 'reportar-una-cuenta',
    category: 'moderacion',
    title: 'Cómo reportar una cuenta',
    summary: 'Reporta suplantaciones, spam o contenido que incumpla las normas.',
    updated: 'hace 2 semanas',
    readingTime: 3,
    keywords: ['reportar', 'cuenta', 'suplantacion', 'spam', 'moderacion'],
    intro:
      'Puedes reportar una cuenta desde su perfil. Cuéntanos qué ocurrió para que podamos revisarlo.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre el perfil',
            body: 'Entra en el perfil de la mascota.',
          },
          {
            title: 'Pulsa Reportar',
            body: 'Elige el motivo y describe la situación.',
          },
          {
            title: 'Revisa la respuesta',
            body: 'Te avisaremos cuando el reporte cambie de estado.',
          },
        ],
      },
    ],
    related: ['reportar-un-mensaje', 'entender-una-decision', 'apelar-una-sancion'],
  },
  {
    slug: 'entender-una-decision',
    category: 'moderacion',
    title: 'Cómo entender una decisión de moderación',
    summary: 'Cada reporte muestra su estado, la cronología y el motivo de la decisión.',
    updated: 'hace 1 semana',
    readingTime: 4,
    keywords: ['decision', 'reporte', 'moderacion', 'estado'],
    intro:
      'Cuando un reporte cambia de estado, puedes revisar la cronología y el detalle de la decisión en Ajustes › Seguridad.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre Ajustes › Seguridad',
            body: 'Filtra los reportes por estado si tienes varios.',
          },
          {
            title: 'Abre el reporte',
            body: 'Revisa la cronología y el último movimiento.',
          },
          {
            title: 'Apela si corresponde',
            body: 'En reportes resueltos o rechazados puedes enviar una apelación.',
          },
        ],
      },
    ],
    related: ['apelar-una-sancion', 'como-reportar-un-comentario', 'normas-de-la-comunidad'],
  },
  {
    slug: 'apelar-una-sancion',
    category: 'moderacion',
    title: 'Cómo apelar una sanción',
    summary: 'Explica por qué la decisión debería revisarse y adjunta contexto.',
    updated: 'hace 2 semanas',
    readingTime: 4,
    keywords: ['apelar', 'apelacion', 'sancion', 'reporte', 'moderacion'],
    intro:
      'Si no estás de acuerdo con una decisión, puedes apelarla desde el reporte. La apelación la revisa otra persona del equipo.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Paso a paso',
        steps: [
          {
            title: 'Abre el reporte',
            body: 'Entra en Ajustes › Seguridad y selecciona el reporte resuelto o rechazado.',
          },
          {
            title: 'Pulsa Apelar decisión',
            body: 'Explica qué debe revisarse y agrega el contexto que falte.',
          },
          {
            title: 'Espera la revisión',
            body: 'El estado cambia a Apelado y recibirás un aviso con la respuesta.',
          },
        ],
      },
      {
        id: 'si-algo-falla',
        title: 'Si algo falla',
        callout: {
          icon: 'clock',
          title: 'Tiempo de respuesta',
          body: 'Las apelaciones se revisan en un plazo de 48 horas laborables.',
        },
      },
    ],
    related: ['entender-una-decision', 'reportar-una-cuenta', 'normas-de-la-comunidad'],
  },
  {
    slug: 'normas-de-la-comunidad',
    category: 'moderacion',
    title: 'Normas de la comunidad',
    summary: 'Respeto, contenido propio y cero acoso o spam.',
    updated: 'hace 1 mes',
    readingTime: 5,
    keywords: ['normas', 'comunidad', 'moderacion', 'respeto', 'spam'],
    intro:
      'PawSpace es un espacio para compartir la vida de tus mascotas. Estas normas mantienen la comunidad segura y amable.',
    sections: [
      {
        id: 'paso-a-paso',
        title: 'Lo esencial',
        steps: [
          {
            title: 'Trata con respeto',
            body: 'No se permite acoso, insultos ni amenazas.',
          },
          {
            title: 'Publica contenido propio',
            body: 'No suplantes a otra persona o mascota ni uses fotos sin permiso.',
          },
          {
            title: 'Evita el spam',
            body: 'No envíes enlaces repetidos ni promociones no solicitadas.',
          },
        ],
      },
    ],
    related: ['como-reportar-un-comentario', 'reportar-una-cuenta', 'entender-una-decision'],
  },
];

export const helpFaqs = [
  {
    id: 'pregunta-contrasena',
    question: '¿Cómo cambio mi contraseña?',
    answer:
      'Abre Ajustes › Seguridad y pulsa Actualizar junto a Contraseña. Confirma tu contraseña actual y guarda la nueva.',
    slug: 'cambiar-contrasena',
  },
  {
    id: 'pregunta-perfil',
    question: '¿Quién puede ver mi perfil?',
    answer:
      'Un perfil público lo ve cualquier persona. Si lo haces privado, solo tus seguidores pueden ver el contenido.',
    slug: 'quien-puede-ver-mi-perfil',
  },
  {
    id: 'pregunta-reportar',
    question: '¿Cómo reporto un comentario?',
    answer:
      'Abre el menú del comentario, elige Reportar y selecciona el motivo. Puedes seguir el estado en Ajustes › Seguridad.',
    slug: 'como-reportar-un-comentario',
  },
];

export const helpPopularTopics = [
  { label: 'Cuenta', query: 'Cuenta' },
  { label: 'Privacidad', query: 'Privacidad' },
  { label: 'Mensajes', query: 'Mensajes' },
  { label: 'Reportes', query: 'Reportes' },
  { label: 'Historias', query: 'Historias' },
];

export const helpGuides = [
  'proteger-tu-cuenta',
  'bloquear-una-cuenta',
  'configurar-tu-privacidad',
  'apelar-una-sancion',
];

export const helpSuggestions = ['cambiar contraseña', 'bloquear una cuenta', 'reportar contenido'];

export const supportFixture = {
  topics: [
    { value: 'cuenta', label: 'Cuenta y acceso' },
    { value: 'privacidad', label: 'Privacidad y seguridad' },
    { value: 'mensajeria', label: 'Mensajería' },
    { value: 'moderacion', label: 'Reportes y moderación' },
    { value: 'otro', label: 'Otro' },
  ],
  beforeWriting: [
    'Revisa el centro de ayuda',
    'Incluye capturas o mensajes de error',
    'Indica qué dispositivo usas',
  ],
  responseTime: {
    hours: '48 h',
    label: 'Tiempo medio laborable',
    schedule: 'Lun–Vie · 9:00–18:00',
  },
  status: {
    estado: 'operativo',
    title: 'Todos los sistemas operativos',
    checked: 'hace 2 min',
    historial: [
      { fecha: 'Hoy, 09:00', estado: 'Operativo', detalle: 'Sin incidencias registradas.' },
      {
        fecha: 'Ayer, 18:30',
        estado: 'Degradado',
        detalle: 'Los mensajes tardaron unos minutos en enviarse.',
      },
      { fecha: 'Hace 3 días, 12:10', estado: 'Operativo', detalle: 'Sin incidencias registradas.' },
    ],
  },
  tickets: [
    {
      id: '1042',
      tema: 'cuenta',
      asunto: 'Inicio de sesión',
      fecha: 'Hace 2 días',
      estado: 'ABIERTA',
      ultimoMovimiento: 'Estamos revisando tu caso.',
      detalle: 'No puedo iniciar sesión desde mi portátil.',
      cronologia: [
        { fecha: 'Hace 2 días', texto: 'Enviaste la solicitud.' },
        { fecha: 'Hace 1 día', texto: 'El equipo la marcó en revisión.' },
      ],
    },
    {
      id: '0987',
      tema: 'cuenta',
      asunto: 'Cambio de correo',
      fecha: 'Hace 2 semanas',
      estado: 'RESUELTA',
      ultimoMovimiento: 'Tu correo de contacto se actualizó.',
      detalle: 'Quería cambiar el correo asociado a mi cuenta.',
      cronologia: [
        { fecha: 'Hace 2 semanas', texto: 'Enviaste la solicitud.' },
        { fecha: 'Hace 12 días', texto: 'El equipo actualizó el correo de contacto.' },
        { fecha: 'Hace 12 días', texto: 'La solicitud se marcó como resuelta.' },
      ],
    },
  ],
};
