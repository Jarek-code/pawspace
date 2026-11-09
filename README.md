# PawSpace

Red social para mascotas. El actor es la mascota: es quien publica, comenta y recibe avisos. La
persona administra la cuenta.

La plataforma guarda su información en dos fuentes que funcionan por separado. MariaDB conserva las
cuentas y la operación, distribuidas en cinco nodos. MongoDB conserva el registro de accesos y
sesiones. La base de objetos para los adjuntos está construida, pero los módulos que la usarán
todavía no existen.

## Contenido del repositorio

| Carpeta | Qué hay |
|---|---|
| `backend/` | API en FastAPI: registro, inicio de sesión, consulta de actividad y cambio de estado |
| `frontend/` | Pantalla de acceso en HTML, CSS y JavaScript |
| `database/` | Esquema relacional, configuración de los nodos, SQL de la distribución y colecciones de MongoDB |
| `logs/` | Paquete `pawspace-logs`, cliente del registro de accesos |
| `oodb/` | Base de datos de objetos para los adjuntos |
| `tools/` | Plugin de DBGate para revisar la base de objetos |
| `devops/` | Imágenes de Docker y scripts de construcción |
| `docs/` | Guías de uso, API, requisitos y contrato del registro |

## Arranque

```bash
cp .env.example .env
docker compose up -d
./devops/scripts/construir-bd.sh
```

El primer comando levanta los contenedores. El segundo construye la base distribuida y deja la
aplicación en marcha. Los detalles están en [`docs/instalacion.md`](docs/instalacion.md).

| Servicio | Dirección |
|---|---|
| API | http://localhost:8000 |
| Documentación de la API | http://localhost:8000/docs |
| Interfaz web | http://localhost:3000 |
| Adminer | http://localhost:8081 |
| DBGate | http://localhost:8082 |
| MongoDB | `127.0.0.1:27017` |
| Base de objetos | `127.0.0.1:8787` |

## Las dos fuentes

<details>
<summary>MariaDB: cinco nodos y una sola conexión para la aplicación</summary>

La aplicación entra por un nodo de acceso que reparte las escrituras y reconstruye las lecturas. Las
tablas de actividad se fragmentan por la paridad del dueño y tres cortes verticales mueven columnas a
tablas satélite. Los respaldos reciben la replicación.
</details>

<details>
<summary>MongoDB: eventos, sesiones y catálogo de acciones, sin datos de negocio</summary>

Cada acceso correcto abre un documento de sesión y escribe un evento. Cada intento rechazado escribe
un evento con el motivo y un hash del identificador, sin guardar el correo. Los documentos caducan por
índice de retención.
</details>

## Adjuntos

La base de objetos guarda imágenes y vídeos anclados a la fila que los originó, por pareja de tabla e
identificador. Está en `oodb/` y se consulta por HTTP en el puerto 8787. Para revisarla desde una
interfaz está el plugin de DBGate en `tools/dbgate-plugin-oodb`.

## Documentación

| Archivo | Contenido |
|---|---|
| [`docs/instalacion.md`](docs/instalacion.md) | Puesta en marcha paso a paso |
| [`docs/requisitos.md`](docs/requisitos.md) | Software, recursos y puertos |
| [`docs/api.md`](docs/api.md) | Rutas de la API y respuestas |
| [`docs/dbgate.md`](docs/dbgate.md) | Gestor de bases de datos del entorno |
| [`docs/mongo/contrato.md`](docs/mongo/contrato.md) | Colecciones, campos y garantías del registro |
| [`docs/esquema/README.md`](docs/esquema/README.md) | Diagramas del esquema |
