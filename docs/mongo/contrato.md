# Contrato del registro

MongoDB guarda el rastro de lo que ocurre en la plataforma. Es un almacén derivado: no participa de
las transacciones de MariaDB y su fallo no detiene la aplicación.

## Colecciones

| Colección | Documento | Índices |
|---|---|---|
| `eventos` | una acción con su actor, su resultado y su origen | `por_actor`, `por_entidad`, `por_sesion`, `por_accion`, `purga_eventos` |
| `sesiones` | una sesión con contadores | `por_actor`, `actividad`, `por_fecha`, `purga_sesiones` |
| `acciones` | catálogo del vocabulario | `_id` con el nombre de la acción |
| `resumen_diario` | un día preagregado | `_id` con la fecha |

## Campos de un evento

| Campo | Obligatorio | Contenido |
|---|---|---|
| `_id` | sí | Identificador con el instante delante |
| `ocurrido_en` | sí | Fecha en UTC, base del índice de retención |
| `sesion_id` | no | Sesión en la que ocurrió |
| `actor` | sí | `{tipo, id, cuenta_id}`, con `tipo` en `MASCOTA`, `USUARIO` o `SISTEMA` |
| `accion` | sí | Verbo del vocabulario, por ejemplo `cuenta.acceder` |
| `categoria` | sí | Familia de la acción, tomada del catálogo |
| `entidad` | no | Fila afectada, por ejemplo `USUARIO` con su identificador |
| `resultado` | sí | `ok` o `error` |
| `duracion_ms` | no | Tiempo de la operación |
| `origen` | no | Ruta, método, agente y hash de la dirección |
| `metadatos` | no | Datos propios de la acción |

## Vocabulario

| Categoría | Acciones |
|---|---|
| Sesión | `sesion.iniciar`, `sesion.latido`, `sesion.cerrar` |
| Cuenta | `cuenta.acceder`, `cuenta.fallar`, `cuenta.bloquear`, `cuenta.salir`, `cuenta.actualizar` |
| Contenido | `publicacion.crear`, `publicacion.editar`, `publicacion.borrar`, `comentario.crear`, `comentario.borrar`, `historia.crear`, `historia.ver` |
| Interacción | `reaccion.crear`, `reaccion.quitar`, `seguimiento.crear`, `seguimiento.quitar` |
| Adjuntos | `adjunto.subir`, `adjunto.borrar`, `adjunto.reordenar`, `contenido.anclar`, `contenido.borrar` |
| Moderación y acceso | `reporte.crear`, `peticion.leer`, `peticion.escribir` |

Para agregar una acción hay que tocar el enumerado y el catálogo del paquete `logs/`, y el script de
colecciones en `database/mongo/initdb`.

## Accesos e intentos fallidos

| Situación | Qué se registra |
|---|---|
| Acceso correcto | Documento en `sesiones` y evento `cuenta.acceder` |
| Acceso rechazado | Solo evento `cuenta.fallar`, sin sesión |
| Cuenta desactivada | `cuenta.fallar` con el motivo `cuenta_inactiva` |
| Cambio de estado | Evento `cuenta.actualizar` con el valor nuevo |

Un intento fallido guarda un hash del identificador, calculado con la sal del registro. Nunca se
guarda el correo ni la contraseña.

## Garantías

| Garantía | Cómo se cumple |
|---|---|
| La API responde aunque el registro falle | El cliente escribe por lotes y no lanza errores hacia la petición |
| Sin configurar no estorba | Con la cadena de conexión vacía, todas las llamadas no hacen nada |
| Retención | Índices de caducidad: 180 días para eventos y 400 para sesiones |
| Privacidad | Direcciones y correos se guardan con hash, con la sal de la configuración |

## Operación

```bash
# esquema, índices y catálogo
docker exec -i pawspace-mongo mongosh pawspace_logs < database/mongo/initdb/01-colecciones.js

# datos de ejemplo
docker exec -i pawspace-mongo mongosh pawspace_logs < database/mongo/02-datos-ejemplo.js

# consultas con plan de ejecución
docker exec -i pawspace-mongo mongosh pawspace_logs < database/mongo/03-consultas.js

# preagregado del día
docker exec -i -e DIA=2026-11-08 pawspace-mongo mongosh pawspace_logs \
  < database/mongo/04-resumen-diario.js
```

El validador de las colecciones se aplica al crear la base. Si cambia, hay que ajustarlo con
`collMod` o rehacer el volumen:

```bash
docker exec -i pawspace-mongo mongosh pawspace_logs --eval 'db.runCommand({collMod: "eventos"})'
```

## Consultas de apoyo

| Pregunta | Método del paquete |
|---|---|
| Qué hizo un actor entre dos fechas | `auditoria_actor` |
| Quién tocó una entidad | `historial_entidad` |
| Pasos de una sesión | `sesion_completa` |
| Intentos fallidos por motivo | `intentos_fallidos` |
| Sesiones de un actor | `sesiones_de_actor` |

Los diagramas de las colecciones están en esta misma carpeta, en formato PNG y SVG.
