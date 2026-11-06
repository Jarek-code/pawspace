# Integrar el registro de logs

Paquete `pawspace-logs`. Tres pasos y no hay que tocar las rutas.

## 1. Instalar y configurar

```bash
pip install -e ./logs            # o ./logs[fastapi] si vas a usar el middleware
```

```env
MONGO_URL=mongodb://mongo:27017
MONGO_BD=pawspace_logs
LOGS_SAL=cambia-esta-sal
```

## 2. Arrancar y cerrar el cliente con la aplicación

```python
from pawspace_logs import ClienteLogs

logs = ClienteLogs(
    url=settings.MONGO_URL,          # vacío ⇒ registro deshabilitado, todo es no-op
    bd=settings.MONGO_BD,
    sal_ip=settings.LOGS_SAL,
    muestreo=0.1,                    # 10 % de las lecturas; las escrituras se registran siempre
)

@app.on_event("startup")
async def arranque():
    await logs.iniciar()             # crea índices y catálogo (idempotente)

@app.on_event("shutdown")
async def parada():
    await logs.cerrar()              # vacía la cola
```

## 3. Registrar en cada operación

```python
from pawspace_logs import Accion, entidad, mascota

sesion = await logs.abrir_sesion(mascota(12, cuenta_id=3), origen=logs.origen(request))

await logs.evento(
    Accion.PUBLICACION_CREAR,
    mascota(12, cuenta_id=3),
    sesion=sesion,
    entidad=entidad("PUBLICACION", 1207),     # a qué fila afecta
    metadatos={"adjuntos": 2},
    origen=logs.origen(request),
)

await logs.cerrar_sesion(sesion, motivo="logout")
```

Y si el acceso falla, no se abre sesión: se anota el intento.

```python
await logs.intento_fallido(correo, "credenciales", origen=logs.origen(request))
# tras N intentos:
await logs.cuenta_bloqueada(correo)
```

El middleware evita repetir esto en cada ruta:

```python
from pawspace_logs.middleware import MiddlewareLogs

app.add_middleware(MiddlewareLogs, cliente=logs, excluir=("/health",))
```

Para que el middleware sepa quién actúa, la dependencia de autenticación debe dejar:

```python
request.state.actor = mascota(mascota_id, cuenta_id)   # Actor
request.state.sesion_id = sesion_id                    # str
```

Si no los deja, registra como `SISTEMA` y sin sesión.

## Acciones disponibles

Las de `Accion` y nada más. El catálogo con categorías vive en `pawspace_logs.modelo.CATALOGO`
y en la colección `acciones`.

| Categoría | Acciones |
|---|---|
| sesión y cuenta | `sesion.iniciar`, `sesion.latido`, `sesion.cerrar`, `cuenta.acceder`, `cuenta.fallar`, `cuenta.bloquear`, `cuenta.salir` |
| contenido | `publicacion.crear/editar/borrar`, `comentario.crear/borrar`, `historia.crear/ver` |
| interacción | `reaccion.crear/quitar`, `seguimiento.crear/quitar` |
| adjuntos | `adjunto.subir/borrar/reordenar`, `contenido.anclar/borrar` |
| moderación y acceso | `reporte.crear`, `peticion.leer`, `peticion.escribir` |

Para añadir una acción: al enum `Accion`, a `CATALOGO` y al script de colecciones. El cliente
vuelve a cargar el catálogo en cada arranque.

## Consultar

```python
await logs.auditoria_actor(12, desde="2026-11-01", hasta="2026-11-05", limite=50)
await logs.historial_entidad("PUBLICACION", 1207)
await logs.sesion_completa("ses_01JAB…")        # {"sesion": {...}, "pasos": [...]}
await logs.sesiones_en(desde="2026-11-01", hasta="2026-11-05", abiertas=True)
await logs.intentos_fallidos(motivo="credenciales", limite=50)
await logs.sesiones_de_actor(12, limite=20)
await logs.resumen_del_dia("2026-11-05")        # preagregado por el job diario
await logs.resumen_entre("2026-11-01", "2026-11-05")
```

## Qué garantiza y qué no

- **No lanza nunca** hacia la petición: encola y escribe por lotes; si MongoDB falla, avisa por
  `logging` y suma a `logs.descartados`.
- **Idempotencia**: cada evento lleva `_id` propio; con `id_evento=` el llamador impone uno
  determinista y reintentar no duplica.
- **No hay transacción con MariaDB**: es un almacén derivado, sin 2PC. Si se pierde un evento se
  pierde auditoría, nunca datos de negocio.
- **Privacidad**: la IP se guarda hasheada con `LOGS_SAL`; nunca en claro, y no se guardan
  cuerpos de petición ni contraseñas.
- Retención: eventos 180 días, sesiones 400 (índices TTL), configurable por entorno.
