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

La base de datos se distribuye en cinco servidores:

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


## Adjuntos en la OODB

Las imágenes y los vídeos no viven en MariaDB: viven en una base de datos orientada a objetos
que ancla cada contenido a su fila por `(tabla, registro_id)`. El contenido sigue en la base
relacional; la OODB se ocupa de lo que la relacional no expresa bien.

| Pieza | Qué hace |
|---|---|
| `oodb/crates/oodb` | Motor: identidad de objeto, mapa de identidad, índice de aristas y `commit` transaccional |
| `oodb/crates/pawspace-modelo` | Dominio: `PUBLICACION`, `HISTORIA` y `COMENTARIO` con sus adjuntos |
| `oodb/crates/pawspace-servicio` | Servicio HTTP, adaptador de MariaDB y reconciliación |
| `oodb/crates/pawspace-cli` | CLI para anclar, ver, colgar, mover y mantener el almacén |

```bash
# Con el cluster levantado, el servicio entra en el compose
docker compose up -d oodb

# La CLI, contra el servicio o contra el archivo
cargo run -p pawspace-cli -- --url http://127.0.0.1:8787 estado
cargo run -p pawspace-cli -- --ruta datos/pawspace.redb listar --clase Publicacion

# Anclar, colgar y ver
cargo run -p pawspace-cli -- anclar PUBLICACION 1207 --texto "en el parque"
cargo run -p pawspace-cli -- adjuntar PUBLICACION 1207 --imagen https://cdn/parque.jpg
cargo run -p pawspace-cli -- ver PUBLICACION 1207
```

Las rutas de adjuntos del backend (`/adjuntos/...`) son la puerta del frontend: anclar, colgar,
listar y borrar. Si `OODB_URL` está vacío, el backend arranca igual pero sin adjuntos.

### Archivos

Los binarios se guardan por ahora en una carpeta del disco del servicio (`OODB_ARCHIVOS`,
`datos/archivos` por omisión; en el compose es un volumen). El servicio los recibe por
`POST /archivos` (cuerpo binario y `content-type`), los sirve en `GET /archivos/{nombre}` y
devuelve la ruta con la que se pueden colgar de un contenido.

Desde el backend, `POST /adjuntos/{tabla}/{id}/subir` recibe el archivo, lo guarda en la OODB,
lo cuelga del contenido y devuelve la ruta pública `/adjuntos/archivo/{nombre}`, que es la que
consume el frontend. Cambiar la carpeta por un almacén de objetos toca un solo módulo.

El motor mantiene un **índice de aristas** (`desde -> hacia`) en el mismo archivo: los borrados
en cascada, el rechazo de borrados con referencias y la comprobación de integridad consultan ese
índice en vez de recorrer todo el almacén. Además lo usa para denunciar enlaces colgados sin
necesidad de tener los objetos en memoria.

El servicio reconcilia solo: cada `OODB_INTERVALO_SEG` revisa las anclas, aplica la cola
`oodb_pendientes` y borra lo que ya no existe, está eliminado (`eliminado_en`) o venció
(`vence_en`). `database/oodb.sql` crea esa cola y trae los disparadores de ejemplo.

```bash
cd oodb && cargo build --release     # los cuatro crates
cargo run -p pawspace-cli -- --help  # todos los comandos
```
