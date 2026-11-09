// Logs de acciones y sesiones: colecciones, validadores, índices y catálogo de acciones.
// Se ejecuta solo en el primer arranque del contenedor (docker-entrypoint-initdb.d) y es
// idempotente: se puede lanzar a mano con mongosh las veces que haga falta.

const RETENCION_EVENTOS_DIAS = 180;
const RETENCION_SESIONES_DIAS = 400;

function crear(nombre, validador) {
  if (!db.getCollectionNames().includes(nombre)) {
    db.createCollection(nombre, {
      validator: validador,
      validationLevel: "moderate",
      // Aviso, no rechazo: perder un evento de auditoría es peor que guardarlo imperfecto.
      validationAction: "warn",
    });
    print(`colección creada: ${nombre}`);
  }
}

const actor = {
  bsonType: "object",
  required: ["tipo", "id"],
  properties: {
    tipo: { enum: ["MASCOTA", "USUARIO", "SISTEMA"] },
    id: { bsonType: ["long", "int"] },
    // El cliente manda los ids como enteros de Python (int32 cuando caben): el
    // validador tiene que aceptarlos igual que `id`, o cada documento avisa.
    cuenta_id: { bsonType: ["long", "int", "null"] },
  },
};

crear("eventos", {
  $jsonSchema: {
    bsonType: "object",
    required: ["ocurrido_en", "actor", "accion", "categoria", "resultado"],
    properties: {
      _id: { bsonType: "string" },
      ocurrido_en: { bsonType: "date" },
      sesion_id: { bsonType: ["string", "null"] },
      actor: actor,
      accion: { bsonType: "string", pattern: "^[a-z]+\\.[a-z_]+$" },
      categoria: { bsonType: "string" },
      entidad: {
        bsonType: ["object", "null"],
        required: ["tipo", "id"],
        properties: { tipo: { bsonType: "string" }, id: { bsonType: ["long", "int"] } },
      },
      resultado: { enum: ["ok", "error"] },
      duracion_ms: { bsonType: ["int", "long"] },
      origen: {
        bsonType: ["object", "null"],
        properties: {
          ruta: { bsonType: "string" },
          metodo: { bsonType: "string" },
          ip_hash: { bsonType: "string" },
          agente: { bsonType: "string" },
        },
      },
      metadatos: { bsonType: ["object", "null"] },
    },
  },
});

crear("sesiones", {
  $jsonSchema: {
    bsonType: "object",
    required: ["actor", "iniciada_en", "ultima_actividad_en", "pasos", "eventos"],
    properties: {
      _id: { bsonType: "string" },
      actor: actor,
      iniciada_en: { bsonType: "date" },
      ultima_actividad_en: { bsonType: "date" },
      cerrada_en: { bsonType: ["date", "null"] },
      motivo_fin: { bsonType: ["string", "null"] },
      pasos: { bsonType: ["int", "long"] },
      eventos: { bsonType: ["int", "long"] },
      duracion_seg: { bsonType: ["int", "long", "null"] },
      origen: { bsonType: ["object", "null"] },
    },
  },
});

crear("resumen_diario", {
  $jsonSchema: {
    bsonType: "object",
    required: ["dia", "eventos", "actores_unicos", "sesiones"],
    properties: {
      _id: { bsonType: "string" },
      dia: { bsonType: "string" },
      eventos: { bsonType: ["int", "long"] },
      actores_unicos: { bsonType: ["int", "long"] },
      sesiones: { bsonType: ["int", "long"] },
      errores: { bsonType: ["int", "long"] },
      duracion_media_seg: { bsonType: ["double", "null"] },
      acciones: { bsonType: "object" },
    },
  },
});

crear("acciones", {
  $jsonSchema: {
    bsonType: "object",
    required: ["categoria", "descripcion"],
    properties: {
      _id: { bsonType: "string" },
      categoria: { bsonType: "string" },
      descripcion: { bsonType: "string" },
      sensible: { bsonType: "bool" },
    },
  },
});

// Índices. No se crea índice TTL en eventos que también se consultan por acción con
// ocurrido_en: el TTL es un índice aparte y no interfiere con los de consulta.
db.eventos.createIndex({ "actor.id": 1, ocurrido_en: -1 }, { name: "por_actor" });
db.eventos.createIndex({ "entidad.tipo": 1, "entidad.id": 1, ocurrido_en: -1 }, { name: "por_entidad" });
db.eventos.createIndex({ sesion_id: 1, ocurrido_en: 1 }, { name: "por_sesion" });
db.eventos.createIndex({ accion: 1, ocurrido_en: -1 }, { name: "por_accion" });
db.eventos.createIndex(
  { ocurrido_en: 1 },
  { name: "purga_eventos", expireAfterSeconds: RETENCION_EVENTOS_DIAS * 86400 },
);

db.sesiones.createIndex({ "actor.id": 1, iniciada_en: -1 }, { name: "por_actor" });
db.sesiones.createIndex({ ultima_actividad_en: -1 }, { name: "actividad" });
db.sesiones.createIndex({ iniciada_en: -1 }, { name: "por_fecha" });
db.sesiones.createIndex(
  { ultima_actividad_en: 1 },
  { name: "purga_sesiones", expireAfterSeconds: RETENCION_SESIONES_DIAS * 86400 },
);

// Catálogo del vocabulario cerrado. El paquete lo vuelve a cargar al iniciar, así que
// esta lista y la del paquete deben coincidir.
const catalogo = [
  ["sesion.iniciar", "sesion", "Se abre una sesión"],
  ["sesion.latido", "sesion", "Actividad dentro de una sesión"],
  ["sesion.cerrar", "sesion", "Se cierra una sesión"],
  ["cuenta.acceder", "cuenta", "Acceso con credenciales", true],
  ["cuenta.fallar", "cuenta", "Intento de acceso fallido", true],
  ["cuenta.bloquear", "cuenta", "Cuenta bloqueada por intentos", true],
  ["cuenta.salir", "cuenta", "Cierre de sesión explícito"],
  ["cuenta.actualizar", "cuenta", "Cuenta modificada desde la aplicación", true],
  ["publicacion.crear", "contenido", "Publicación creada"],
  ["publicacion.editar", "contenido", "Publicación modificada"],
  ["publicacion.borrar", "contenido", "Publicación eliminada", true],
  ["comentario.crear", "contenido", "Comentario creado"],
  ["comentario.borrar", "contenido", "Comentario eliminado", true],
  ["historia.crear", "contenido", "Historia publicada"],
  ["historia.ver", "contenido", "Historia vista"],
  ["reaccion.crear", "interaccion", "Me gusta otorgado"],
  ["reaccion.quitar", "interaccion", "Me gusta retirado"],
  ["seguimiento.crear", "interaccion", "Se empieza a seguir"],
  ["seguimiento.quitar", "interaccion", "Se deja de seguir"],
  ["adjunto.subir", "adjuntos", "Archivo subido a la OODB"],
  ["adjunto.borrar", "adjuntos", "Archivo retirado de la OODB", true],
  ["adjunto.reordenar", "adjuntos", "Se cambian las posiciones"],
  ["contenido.anclar", "adjuntos", "Contenido anclado a su fila"],
  ["contenido.borrar", "adjuntos", "Contenido borrado con sus adjuntos", true],
  ["reporte.crear", "moderacion", "Contenido reportado", true],
  ["peticion.leer", "acceso", "Petición de lectura muestreada"],
  ["peticion.escribir", "acceso", "Petición de escritura"],
];

for (const [id, categoria, descripcion, sensible] of catalogo) {
  db.acciones.updateOne(
    { _id: id },
    { $set: { categoria, descripcion, sensible: Boolean(sensible) } },
    { upsert: true },
  );
}

print(`listo: ${db.getCollectionNames().length} colecciones, ${db.acciones.countDocuments()} acciones`);
