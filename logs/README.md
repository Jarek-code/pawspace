# pawspace-logs

Paquete del registro de accesos y sesiones. Escribe en MongoDB desde la API.

## Uso mínimo

```python
from pawspace_logs import ClienteLogs

logs = ClienteLogs(url="mongodb://127.0.0.1:27017", bd="pawspace_logs", sal_ip="...")
await logs.iniciar()        # crea índices y catálogo
await logs.cerrar()         # vacía la cola antes de salir
```

En la API se crea una sola vez y se guarda en el estado de la aplicación. El arranque y el cierre van
en el ciclo de vida de FastAPI.

## Lo que registra

| Acción | Cuándo |
|---|---|
| `cuenta.acceder` | Inicio de sesión correcto, junto con un documento de sesión |
| `cuenta.fallar` | Intento rechazado, con el motivo y un hash del identificador |
| `cuenta.actualizar` | Cambio de estado de la cuenta |
| `peticion.leer` y `peticion.escribir` | Cada petición, desde el middleware |

## Comportamiento

| Situación | Qué pasa |
|---|---|
| MongoDB no responde | Avisa por el registro de la aplicación y descarta el lote |
| Sin cadena de conexión | Todas las llamadas no hacen nada y la API arranca igual |
| Muchas peticiones | Escribe por lotes desde una cola en memoria |

El paquete no está publicado. Se instala desde el repositorio con `pip install -e ./logs`.

Los detalles de cada método están en [`EJEMPLOS.md`](EJEMPLOS.md), y el contrato de los documentos en
[`docs/mongo/contrato.md`](../docs/mongo/contrato.md).
