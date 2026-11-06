# Contrato del registro de logs

MongoDB guarda **auditoría**, no datos de negocio: es un almacén derivado, sin transacción con
MariaDB. Si se pierde un evento se pierde trazabilidad, nunca información del sistema.

## Colecciones

| Colección | Documento | Índices |
|---|---|---|
| `eventos` | una acción | `por_actor`, `por_entidad`, `por_sesion`, `por_accion`, `purga_eventos` |
| `sesiones` | una sesión con contadores | `por_actor`, `actividad`, `por_fecha`, `purga_sesiones` |
| `resumen_diario` | un día preagregado | `_id` = `AAAA-MM-DD` |
| `acciones` | catálogo del vocabulario | `_id` = nombre de la acción |

## Campos de un evento

| Campo | Obligatorio | Contenido |
|---|---|---|
| `_id` | sí | Identificador con el instante delante. Con `id_evento=` lo fija el llamador y reintentar no duplica. |
| `ocurrido_en` | sí | Fecha UTC. Base del índice TTL. |
| `sesion_id` | no | Sesión en la que ocurrió. |
| `actor` | sí | `{tipo: MASCOTA \| USUARIO \| SISTEMA, id, cuenta_id}`. En PawSpace el actor es la mascota. |
| `accion` | sí | Verbo del vocabulario cerrado (`publicacion.crear`). |
| `categoria` | sí | Derivada del catálogo (`contenido`, `interaccion`, `adjuntos`, `sesion`, `cuenta`, `moderacion`, `acceso`). |
| `entidad` | no | `{tipo, id}` de la fila afectada: `PUBLICACION`, `HISTORIA`, `COMENTARIO`, `ADJUNTO`… |
| `resultado` | sí | `ok` o `error`. |
| `duracion_ms` | no | Tiempo de la operación. |
| `origen` | no | `{ruta, metodo, ip_hash, agente}`. La IP va **hasheada**, nunca en claro. |
| `metadatos` | no | Campos propios de la acción (`adjuntos`, `tipo`…). Nunca cuerpos ni credenciales. |

## Vocabulario

`pawspace_logs.modelo.CATALOGO` y `database/mongo/initdb/01-colecciones.js` son la misma lista.
Para añadir una acción hay que tocar los tres sitios: el enum `Accion`, `CATALOGO` y el script
de colecciones. El cliente vuelve a cargar el catálogo en cada arranque.

| Categoría | Acciones |
|---|---|
| `sesion` | `sesion.iniciar`, `sesion.latido`, `sesion.cerrar` |
| `cuenta` | `cuenta.acceder`, `cuenta.fallar`, `cuenta.bloquear`, `cuenta.salir` |
| `contenido` | `publicacion.crear`, `publicacion.editar`, `publicacion.borrar`, `comentario.crear`, `comentario.borrar`, `historia.crear`, `historia.ver` |
| `interaccion` | `reaccion.crear`, `reaccion.quitar`, `seguimiento.crear`, `seguimiento.quitar` |
| `adjuntos` | `adjunto.subir`, `adjunto.borrar`, `adjunto.reordenar`, `contenido.anclar`, `contenido.borrar` |
| `moderacion` | `reporte.crear` |
| `acceso` | `peticion.leer`, `peticion.escribir` |

## Inicio, cierre e intentos fallidos

Una sesión se abre con `abrir_sesion` y se cierra con `cerrar_sesion`. El documento guarda
`iniciada_en`, `cerrada_en`, `motivo_fin`, `duracion_seg`, `pasos` y el actor.

| Situación | Qué se registra |
|---|---|
| Acceso correcto | sesión en `sesiones` + `cuenta.acceder` en `eventos` |
| Acceso rechazado | sólo `cuenta.fallar`: **no se abre sesión** |
| Cuenta bloqueada | `cuenta.bloquear` (es `cuenta.fallar` con `metadatos.bloqueo`) |
| Cierre | `cerrada_en`, `motivo_fin` y `cuenta.salir` |

`motivo_fin` sale de `MOTIVOS_FIN` (`logout`, `expiracion`, `cierre_navegador`, `revocada`,
`error`) y el motivo de un fallo, de `MOTIVOS_FALLO` (`credenciales`, `cuenta_inactiva`,
`sin_mascota`, `token_invalido`, `bloqueada`).

Un intento fallido guarda `metadatos.identificador_hash`, nunca el correo ni el usuario en
claro: el mismo identificador produce el mismo hash con la misma sal, así que se pueden contar
los intentos por cuenta sin almacenar el dato personal. Si la cuenta es conocida se pasa `actor`;
si no, el evento queda como `SISTEMA`.

## Garantías

- **Nunca lanza hacia la petición.** Encola y escribe por lotes; si MongoDB falla, avisa por
  `logging` y suma a `logs.descartados`. La API responde igual.
- **Sin MongoDB configurado no es un error**: `MONGO_URL` vacío deja el registro deshabilitado y
  todas las llamadas son no-op.
- **Idempotencia**: `_id` propio por evento; con `id_evento=` el llamador impone uno determinista.
- **Sin transacción global**: no hay 2PC con MariaDB. Un evento puede perderse; nunca se
  duplica un dato de negocio por culpa del log.
- **Retención**: eventos 180 días, sesiones 400, por índice TTL y configurable.
- **Privacidad**: ni IPs en claro, ni cuerpos de petición, ni credenciales. El hash de IP usa
  `LOGS_SAL`; si se cambia la sal, los hashes antiguos dejan de corresponderse.

## Consultas que cubre

| Pregunta | Índice | Método |
|---|---|---|
| Qué hizo un actor entre fechas | `por_actor` | `auditoria_actor` |
| Quién tocó esta entidad | `por_entidad` | `historial_entidad` |
| Pasos de una sesión, en orden | `por_sesion` | `sesion_completa` |
| Acciones más usadas de un día | `por_accion`, TTL aparte | `resumen_del_dia` |
| Intentos fallidos, por motivo | `por_accion` | `intentos_fallidos` |
| Lista de sesiones (todas, de un actor o abiertas) | `por_fecha`, `por_actor` | `sesiones_en` |
| Actividad por día | preagregado | `resumen_entre` |

## Operación

```bash
# esquema, índices y catálogo (también los crea el cliente al iniciar)
mongosh pawspace_logs database/mongo/initdb/01-colecciones.js
# datos de ejemplo, solo en desarrollo
mongosh pawspace_logs database/mongo/02-datos-ejemplo.js
# las tres familias de consulta, con plan de ejecución
mongosh pawspace_logs database/mongo/03-consultas.js
# preagregado del día (cron cada pocos minutos)
DIA=2026-11-06 mongosh pawspace_logs database/mongo/04-resumen-diario.js
```

## Láminas de apoyo

| Archivo | Qué muestra |
|---|---|
| `docs/mongo/01-modelo-documentos` | Las cuatro colecciones con un documento real de cada una y cómo se referencian |
| `docs/mongo/02-flujo-escritura` | De una petición a un documento, con la rama de fallo de MongoDB |
| `docs/mongo/03-consultas-indices` | Cada pregunta con su método, su índice y un ejemplo del resultado |

Son diagramas de cajas y flechas con un documento de ejemplo en cada caja, en la paleta del
design system y con la notación habitual para MongoDB: la cardinalidad va en la arista y las
referencias se marcan como virtuales (sin clave foránea, la mantiene la aplicación). Se regeneran con `dot` desde el `.dot` de al lado, igual que los esquemas de
`docs/esquema`.
