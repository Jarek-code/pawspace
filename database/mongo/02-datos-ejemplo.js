// Datos de ejemplo para probar consultas e informes. Borra lo que había en esas
// colecciones: úsalo solo en desarrollo.  mongosh pawspace_logs 02-datos-ejemplo.js

const ahora = new Date();
const dia = (dias) => new Date(ahora.getTime() - dias * 86400000);

db.eventos.deleteMany({ _id: /^evt-ejemplo-/ });
db.sesiones.deleteMany({ _id: /^ses-ejemplo-/ });
db.resumen_diario.deleteMany({});

const actores = [
  { tipo: "MASCOTA", id: Long(12), cuenta_id: Long(3) },
  { tipo: "MASCOTA", id: 27, cuenta_id: 3 },
  { tipo: "MASCOTA", id: 41, cuenta_id: 8 },
];
const acciones = [
  ["publicacion.crear", "contenido"],
  ["comentario.crear", "contenido"],
  ["reaccion.crear", "interaccion"],
  ["adjunto.subir", "adjuntos"],
  ["historia.ver", "contenido"],
];

let eventos = 0;
let sesiones = 0;
for (let d = 0; d < 3; d++) {
  for (let s = 0; s < 3; s++) {
    const actor = actores[(d + s) % actores.length];
    const inicio = dia(d);
    inicio.setUTCHours(8 + s, 10, 0, 0);
    const sesion_id = `ses-ejemplo-${d}-${s}`;
    const pasos = 8 + s * 3;

    for (let p = 0; p < pasos; p++) {
      const [accion, categoria] = acciones[(p + s) % acciones.length];
      db.eventos.insertOne({
        _id: `evt-ejemplo-${d}-${s}-${p}`,
        ocurrido_en: new Date(inicio.getTime() + p * 45000),
        sesion_id,
        actor,
        accion,
        categoria,
        entidad: accion.startsWith("publicacion") ? { tipo: "PUBLICACION", id: 1200 + p } : null,
        resultado: p === pasos - 1 && s === 2 ? "error" : "ok",
        duracion_ms: 20 + ((p * 7) % 180),
        origen: { ruta: "/api", metodo: "POST", ip_hash: "9f2c1a", agente: "Prueba/1.0" },
        metadatos: { ejemplo: true },
      });
      eventos++;
    }

    db.sesiones.insertOne({
      _id: sesion_id,
      actor,
      iniciada_en: inicio,
      ultima_actividad_en: new Date(inicio.getTime() + (pasos - 1) * 45000 + 120000),
      cerrada_en: new Date(inicio.getTime() + (pasos - 1) * 45000 + 120000),
      motivo_fin: "logout",
      pasos,
      eventos: pasos,
      duracion_seg: Math.round(((pasos - 1) * 45 + 120) / 1),
      origen: { ruta: "/api/sesiones", metodo: "POST", ip_hash: "9f2c1a", agente: "Prueba/1.0" },
    });
    sesiones++;
  }
}

print(`ejemplo cargado: ${eventos} eventos, ${sesiones} sesiones`);
