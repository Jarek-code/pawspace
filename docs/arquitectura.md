# Arquitectura

## Visión general

```
Navegador
    |
    v
Frontend (nginx, puerto 3000)  ---/api/--->  Backend (FastAPI, puerto 8000)
                                                     |
                                                     v
                                            MariaDB (puerto 3306)
```

Todo se levanta con un solo `docker compose up`, en una red interna llamada
`pawspace-net`.

## Componentes

### Backend (`backend/`)

API REST en Python con FastAPI. La estructura está preparada para crecer, pero
buena parte todavía está vacía:

| Ruta | Qué hay |
|---|---|
| `src/main.py` | Punto de entrada. Crea la app y define los endpoints `/` y `/health` |
| `src/config.py` | Configuración leída de `.env` con pydantic-settings |
| `src/database.py` | Motor y sesión de SQLAlchemy, más `get_db()` |
| `src/routes/` | Rutas de la API (pendiente) |
| `src/controllers/` | Lógica de cada endpoint (pendiente) |
| `src/models/` | Modelos SQLAlchemy (pendiente) |
| `src/services/` | Lógica de negocio (pendiente) |
| `src/middleware/` | Middlewares (pendiente) |
| `src/config/` | Archivos de configuración (pendiente) |
| `tests/` | Pruebas (pendiente) |

Al arrancar, `main.py` ejecuta `Base.metadata.create_all()`. Es un atajo de
desarrollo; los modelos todavía no existen, así que de momento no crea nada.

### Frontend (`frontend/`)

HTML, CSS y JavaScript sin framework. nginx sirve los archivos de `src/` y
redirige lo que empieza por `/api/` hacia el backend.

### Base de datos (`database/`)

MariaDB 11.4 con 29 tablas y 4 triggers. Cubre usuarios, mascotas, publicaciones,
comentarios, historias, mensajes, notificaciones y reportes.

### Infraestructura (`devops/`)

Reservado para archivos de Docker, nginx y scripts de despliegue. Todavía vacío:
hoy la configuración vive en `docker-compose.yml` y en `backend/Dockerfile`.

## Decisiones por ahora

- Desarrollo local con Docker Compose.
- Un solo backend y una sola base de datos, sin microservicios.
- El esquema manda: `database/schema.sql` es la fuente de verdad de las tablas.
- La autenticación está prevista en el esquema (`USUARIO.contrasena_hash`), pero
  no implementada.
