// Las tres familias de lectura.  mongosh pawspace_logs 03-consultas.js

const DIA = process.env.DIA || new Date().toISOString().slice(0, 10);
const desde = new Date(`${DIA}T00:00:00Z`);
const hasta = new Date(desde.getTime() + 86400000);

print("== 1. auditoría por actor: qué hizo la mascota 12 el último día ==");
printjson(
  db.eventos
    .find({ "actor.id": Long(12), ocurrido_en: { $gte: desde, $lt: hasta } })
    .sort({ ocurrido_en: -1 })
    .limit(5)
    .toArray(),
);

print("== 2. historial de una entidad: quién tocó la publicación 1203 ==");
printjson(
  db.eventos
    .find({ "entidad.tipo": "PUBLICACION", "entidad.id": Long(1203) })
    .sort({ ocurrido_en: -1 })
    .toArray(),
);

print("== 3. sesión completa: la sesión y sus pasos en orden ==");
const sesion = db.sesiones.find({ _id: "ses-ejemplo-0-1" }).toArray()[0];
printjson(sesion);
printjson(
  db.eventos
    .find({ sesion_id: "ses-ejemplo-0-1" }, { accion: 1, ocurrido_en: 1, resultado: 1 })
    .sort({ ocurrido_en: 1 })
    .toArray(),
);

print("== 4. resumen del día (si ya se generó) ==");
printjson(db.resumen_diario.find({ _id: DIA }).toArray());

print("== 5. plan de ejecución del índice por actor ==");
function etapas(plan, salida) {
  if (!plan || typeof plan !== "object") return salida;
  if (plan.stage) salida.push(plan.indexName ? `${plan.stage}:${plan.indexName}` : plan.stage);
  etapas(plan.inputStage, salida);
  for (const clave of ["inputStages", "queryPlan"]) {
    const valor = plan[clave];
    if (Array.isArray(valor)) valor.forEach((v) => etapas(v, salida));
    else etapas(valor, salida);
  }
  return salida;
}
const plan = db.eventos
  .find({ "actor.id": Long(12), ocurrido_en: { $gte: desde, $lt: hasta } })
  .sort({ ocurrido_en: -1 })
  .limit(5)
  .explain("executionStats");
printjson({
  etapas: etapas(plan.queryPlanner.winningPlan, []),
  devueltos: plan.executionStats.nReturned,
  examinados: plan.executionStats.totalDocsExamined,
  claves: plan.executionStats.totalKeysExamined,
  usa_indice: plan.executionStats.totalDocsExamined === plan.executionStats.nReturned,
});
