# PawSpace

Red social para mascotas. Proyecto en construcción.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Python 3.11 + FastAPI + SQLAlchemy |
| Base de datos | MariaDB 11.4 |
| Frontend | HTML, CSS y JavaScript, sin framework por ahora |
| Infraestructura | Docker Compose + nginx |

## Estructura

```
pawspace/
├── backend/      API REST (FastAPI)
├── frontend/     Interfaz web
├── database/     Esquema SQL y datos de ejemplo
├── devops/       Docker, nginx y scripts
├── docs/         Documentación
└── ui-ux/        Diseño, wireframes y mockups
```

Las carpetas que todavía no tienen código se conservan con un archivo `.gitkeep`.

## Arranque rápido

```bash
cp .env.example .env
docker compose up -d
```

| Servicio | URL |
|---|---|
| API | http://localhost:8000 |
| Documentación de la API | http://localhost:8000/docs |
| Frontend | http://localhost:3000 |
| Adminer (gestor de base de datos) | http://localhost:8080 |

## Documentación

- [Requisitos](docs/requisitos.md)
- [Instalación](docs/instalacion.md)
- [Arquitectura](docs/arquitectura.md)
- [API](docs/api.md)
- [Base de datos](database/README.md)

## Estado

Esqueleto del proyecto. Funcionan el arranque con Docker Compose, la conexión a la base
de datos y dos endpoints (`/` y `/health`). El resto está por implementar.
