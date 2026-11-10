# Guía del paquete

Cómo se usa `pawspace-logs` desde la API.

## 1. Instalar

```bash
pip install -e ./logs
```

El paquete no está publicado. El middleware necesita además Starlette, que ya trae FastAPI.

## 2. Configurar

```env
MONGO_URL=mongodb://127.0.0.1:27017
MONGO_BD=pawspace_logs
LOGS_SAL=cambia-esta-sal
LOGS_MUESTREO=0.1
```

Con `MONGO_URL` vacío el registro queda apagado y las llamadas no hacen nada.

## 3. Arrancar y cerrar

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from pawspace_logs import ClienteLogs

logs = ClienteLogs(url=MONGO_URL, bd="pawspace_logs", sal_ip=LOGS_SAL)

@asynccontextmanager
async def lifespan(app):
    await logs.iniciar()
    app.state.logs = logs
    yield
    await logs.cerrar()

app = FastAPI(lifespan=lifespan)
```

## 4. Registrar en las rutas

```python
from pawspace_logs import Accion, entidad, usuario

sesion = await logs.iniciar_sesion(usuario(12), origen=logs.origen(request))
await logs.evento(Accion.PUBLICACION_CREAR, usuario(12), sesion=sesion,
                  entidad=entidad("PUBLICACION", 1207))
await logs.terminar_sesion(sesion, motivo="logout")
```

Un acceso rechazado no abre sesión:

```python
await logs.intento_fallido(correo, "credenciales", origen=logs.origen(request))
```

## 5. Middleware

Anota cada petición sin tocar las rutas. Toma el actor y la sesión del estado de la petición.

```python
from pawspace_logs.middleware import MiddlewareLogs

app.add_middleware(MiddlewareLogs, cliente=logs, excluir=("/health", "/docs"))
```

Si una ruta no deja esos datos, la petición se registra como `SISTEMA` y sin sesión.

## 6. Consultar

| Método | Devuelve |
|---|---|
| `auditoria_actor(id, desde, hasta, limite)` | Eventos de un actor |
| `historial_entidad(tipo, id)` | Eventos de una fila |
| `sesion_completa(sesion_id)` | La sesión y sus pasos |
| `sesiones_de_actor(id, limite)` | Sesiones de un actor |
| `intentos_fallidos(motivo, limite)` | Intentos rechazados |
| `resumen_del_dia(dia)` | Día preagregado |

## 7. Comprobar disponibilidad

```python
if await logs.disponible():
    ...  # se puede leer el registro
```

Sirve para que una respuesta que combina datos de dos fuentes pueda decir si la parte de auditoría
está al día.

## 8. Agregar una acción

Hay que tocar tres sitios: el enumerado `Accion`, el catálogo `CATALOGO` del paquete y la lista de
`database/mongo/initdb/01-colecciones.js`. El cliente vuelve a cargar el catálogo en cada arranque.
