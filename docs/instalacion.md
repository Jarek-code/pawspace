# Instalación

## 1. Clonar el repositorio

```bash
git clone https://github.com/Jarek-code/pawspace.git
cd pawspace
```

## 2. Crear el archivo de entorno

```bash
cp .env.example .env
```

`.env` no se sube a GitHub. Si quieres, cambia las contraseñas dentro del archivo: la de root se
usa en los cinco nodos de base de datos.

## 3. Arrancar el clúster y construir la base de datos

```bash
docker compose up -d
./devops/scripts/construir-bd.sh
```

El primer comando arranca los **cinco nodos de base de datos** (la imagen del nodo spider se
construye sola la primera vez, instala el motor Spider).

El segundo construye la base distribuida: crea el esquema y los fragmentos, arranca la
replicación asíncrona, monta el nodo spider, ejecuta las validaciones y **levanta la aplicación
al final** — primero la base, después la app, porque el backend abre la conexión al arrancar y
si no encuentra el usuario `pawuser` se queda reiniciándose.

El script va contando cada paso por pantalla. Es idempotente: si la base ya está construida,
avisa y no toca nada. Para rehacerla desde cero:

```bash
./devops/scripts/construir-bd.sh --desde-cero
./devops/scripts/limpiar-bd.sh
```

## 4. Comprobar que funciona

```bash
curl http://localhost:8000/health
```

Debe responder `{"status":"healthy"}`.

Y que las réplicas están al día:

```bash
docker exec -it pawspace-dn-b mariadb -uroot -prootpass \
  -e "SHOW SLAVE STATUS\G" | grep -E "Slave_IO_Running|Slave_SQL_Running|Seconds_Behind"
```

Los tres enlaces (`dn_b`, `rep_a`, `rep_b`) tienen que estar en `Yes` y con retraso `0`.

## Dónde queda cada cosa

| Servicio | URL / acceso |
|---|---|
| API | http://localhost:8000 |
| Documentación de la API | http://localhost:8000/docs |
| Frontend | http://localhost:3000 |
| Adminer (gestor de base de datos) | http://localhost:8081 |
| Nodo spider (al que se conecta la app) | `127.0.0.1:14306` |
| Nodos de datos `dn_a` / `dn_b` | `127.0.0.1:14307` / `14308` |
| Respaldos `rep_a` / `rep_b` | `127.0.0.1:14309` / `14310` |

Al conectarse desde el host hay que apuntar a **127.0.0.1**, no al nombre del contenedor.

## Comandos útiles

```bash
docker compose ps                     # estado de los 8 servicios
docker compose logs -f backend        # logs del backend
docker compose logs -f pawspace-dn-a  # logs de un nodo de base de datos
docker compose down                   # parar todo
./devops/scripts/limpiar-bd.sh        # parar y borrar contenedores, red y volúmenes
```

## Regenerar el SQL distribuido

```bash
python3 devops/scripts/generar_sql.py        # el SQL distribuido, desde database/schema.sql
```

## Backend sin Docker, opcional

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

Necesita un nodo spider accesible. Los valores de `.env.example` (`DB_HOST=127.0.0.1`,
`DB_PORT=14306`) apuntan al puerto del spider publicado en el host.

## Notas

- **Adminer está en el 8081 y no en el 8080.** En la máquina de desarrollo el 8080 lo ocupa otro
  proyecto. Se puede cambiar con `ADMINER_PORT` en `.env`.
- **Los puertos de los nodos de base de datos se publican solo en `127.0.0.1`**, no en todas las
  interfaces: son para inspección, no para exponerlos.
