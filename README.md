# PawSpace

Red social para mascotas. Proyecto en construcción: **la capa de datos está terminada y la
aplicación no**.

En PawSpace **el actor es la mascota**, no la persona: quien publica, comenta, reacciona y
recibe avisos es la mascota; la persona administra la cuenta. Esa decisión es la que gobierna
todo el diseño de la base de datos.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Python 3.11 + FastAPI + SQLAlchemy |
| Base de datos | MariaDB 11.4, **distribuida en 5 nodos**: fragmentación horizontal y vertical con Spider + replicación asíncrona |
| Frontend | HTML, CSS y JavaScript, sin framework por ahora |
| Infraestructura | Docker Compose + nginx |

## Arranque rápido

```bash
cp .env.example .env
docker compose up -d
./devops/scripts/construir-bd.sh
```

El último comando construye la base distribuida, arranca la replicación y **después** levanta la
aplicación.

| Servicio | URL |
|---|---|
| API | http://localhost:8000 |
| Documentación de la API | http://localhost:8000/docs |
| Frontend | http://localhost:3000 |
| Adminer (gestor de base de datos) | http://localhost:8081 |

## La base de datos

No es un servidor, son cinco:

```
                        aplicación
                            |
                            v
                  spider  172.30.0.10   (acceso, sin datos)
                            |
              +-------------+-------------+
              v                           v
       dn_a  172.30.0.11            dn_b  172.30.0.12
       fragmento PAR                 fragmento IMPAR
       maestro de lo replicado       réplica parcial de dn_a
              |                           |
              v                           v
       rep_a 172.30.0.13            rep_b 172.30.0.14
       respaldo total                respaldo total
```

- **Fragmentación horizontal**: 5 tablas de actividad, repartidas por la paridad del dueño
  (la mascota). Pares a `dn_a`, impares a `dn_b`.
- **Fragmentación vertical**: 3 cortes por columnas, a tablas satélite con su vista.
- **Replicación parcial** `dn_a → dn_b` (solo las tablas no fragmentadas) y **total** a los dos
  respaldos.

La aplicación se conecta a un solo nodo y no sabe nada de la distribución.

## Estructura

```
pawspace/
├── backend/      API REST (FastAPI)
├── frontend/     Interfaz web
├── database/     Esquema, configuración de los nodos y SQL de la distribución
│   ├── schema.sql        Esquema lógico (29 tablas). Fuente de verdad
│   ├── conf/             server-id, binlog y filtros de cada nodo
│   └── distribuida/      Fragmentos, Spider, replicación y validaciones
├── devops/       Docker y scripts de construcción
├── docs/         Notas operativas y el diagrama entidad-relación
└── ui-ux/        Diseño, wireframes y mockups
```

Las carpetas que todavía no tienen código se conservan con un archivo `.gitkeep`.

## Estado

- **Hecho**: la base de datos distribuida completa (29 tablas + 3 satélites), la fragmentación
  horizontal y vertical, la replicación asíncrona, el arranque con Docker Compose y las
  validaciones. Los cinco nodos levantan en menos de un minuto y la construcción completa tarda
  unos dos.
- **Pendiente**: prácticamente toda la lógica de aplicación. Funcionan dos endpoints (`/` y
  `/health`) de los 45 previstos.
