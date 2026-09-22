# API

Base: `http://localhost:8000`

Documentación interactiva generada por FastAPI: `http://localhost:8000/docs`

## Estado actual

Solo hay dos endpoints implementados.

### GET /

```bash
curl http://localhost:8000/
```

```json
{"message": "Welcome to PawSpace API", "status": "ok"}
```

### GET /health

Comprueba que el servicio está vivo.

```bash
curl http://localhost:8000/health
```

```json
{"status": "healthy"}
```

## Pendiente

Todavía no hay endpoints de usuarios, mascotas, publicaciones, comentarios,
mensajes ni notificaciones. La base de datos ya tiene esas tablas, pero la API
no las usa.

Está por definir:

- Autenticación y gestión de sesiones
- Formato de los errores
- Paginación en los listados
- Versión de la API en la ruta (`/v1/`)
