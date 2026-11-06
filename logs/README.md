# pawspace-logs

Registro de acciones y sesiones para el backend. MongoDB es un almacén **derivado**: si se
pierde un evento se pierde auditoría, nunca datos de negocio.

## Lo mínimo para el endpoint de login

```python
from pawspace_logs import Accion, ClienteLogs, mascota

logs = ClienteLogs.desde_entorno()          # lee MONGO_URL, MONGO_BD, LOGS_SAL
await logs.iniciar()                        # en el startup

sesion = await logs.iniciar_sesion(mascota(mascota_id, cuenta_id), origen=logs.origen(request))
# ... y devuelves `sesion` junto al token
```

Si el acceso falla, **no** abras sesión: anota el intento.

```python
await logs.intento_fallido(correo, "credenciales", origen=logs.origen(request))
```

En el `logout`:

```python
await logs.terminar_sesion(sesion, motivo="logout")
```

Y en el `shutdown`, para no perder la cola: `await logs.cerrar()`.

Cualquier otra acción se anota igual:

```python
await logs.evento(Accion.PUBLICACION_CREAR, mascota(12, 3), sesion=sesion,
                  entidad=("PUBLICACION", 1207))
```

## Lo que no tienes que hacer

- No falla si MongoDB está caído: avisa por `logging`, cuenta en `logs.descartados` y sigue.
- Con `MONGO_URL` vacío queda deshabilitado y todo es no-op: el backend arranca igual.
- Los índices y el catálogo se crean solos al iniciar (`iniciar()` es idempotente).
- `iniciar()` tiene que correr en el bucle de eventos de la aplicación (el `startup`); el
  cliente se ata a ese bucle.

Detalles de acciones, middleware y consultas en [`EJEMPLOS.md`](EJEMPLOS.md), y el contrato
completo en `docs/mongo/contrato.md`.
