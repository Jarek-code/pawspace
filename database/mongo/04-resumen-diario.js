// Preagregado del día: lo que leen los informes para no recorrer los eventos.
//   DIA=2026-11-05 mongosh pawspace_logs 04-resumen-diario.js
// Pensado para un cron cada pocos minutos; recalcula el día entero y lo mezcla.

const DIA = process.env.DIA || new Date().toISOString().slice(0, 10);
const desde = new Date(`${DIA}T00:00:00Z`);
const hasta = new Date(desde.getTime() + 86400000);

// Las sesiones se cuentan en su colección, no por el evento de acceso.
const cerradas = db.sesiones
  .aggregate([
    { $match: { iniciada_en: { $gte: desde, $lt: hasta }, cerrada_en: { $ne: null } } },
    { $group: { _id: null, media: { $avg: "$duracion_seg" } } },
  ])
  .toArray();
const duracionMedia = cerradas.length ? cerradas[0].media : null;
const sesionesDelDia = db.sesiones.countDocuments({ iniciada_en: { $gte: desde, $lt: hasta } });

db.eventos
  .aggregate([
    { $match: { ocurrido_en: { $gte: desde, $lt: hasta } } },
    {
      $facet: {
        total: [{ $count: "eventos" }],
        acciones: [{ $group: { _id: "$accion", n: { $sum: 1 } } }, { $sort: { n: -1 } }],
        actores: [{ $group: { _id: "$actor.id" } }, { $count: "unicos" }],
        errores: [{ $match: { resultado: "error" } }, { $count: "errores" }],
        accesos_ok: [{ $match: { accion: "cuenta.acceder" } }, { $count: "n" }],
        accesos_fallidos: [{ $match: { accion: "cuenta.fallar" } }, { $count: "n" }],
      },
    },
    {
      $project: {
        _id: { $literal: DIA },
        dia: { $literal: DIA },
        eventos: { $ifNull: [{ $first: "$total.eventos" }, 0] },
        errores: { $ifNull: [{ $first: "$errores.errores" }, 0] },
        accesos_ok: { $ifNull: [{ $first: "$accesos_ok.n" }, 0] },
        accesos_fallidos: { $ifNull: [{ $first: "$accesos_fallidos.n" }, 0] },
        actores_unicos: { $ifNull: [{ $first: "$actores.unicos" }, 0] },
        sesiones: sesionesDelDia,
        acciones: {
          $arrayToObject: [
            { $map: { input: "$acciones", as: "a", in: { k: "$$a._id", v: "$$a.n" } } },
          ],
        },
      },
    },
    { $set: { duracion_media_seg: duracionMedia } },
    { $merge: { into: "resumen_diario", on: "_id", whenMatched: "merge", whenNotMatched: "insert" } },
  ])
  .toArray();

printjson(db.resumen_diario.find({ _id: DIA }).toArray());
