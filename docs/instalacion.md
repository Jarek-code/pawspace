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

`.env` no se sube a GitHub. Si quieres, cambia las contraseñas dentro del archivo.

## 3. Levantar los servicios

```bash
docker compose up -d
```

La primera vez, MariaDB ejecuta solo `database/init/01-schema.sql` y crea las 29 tablas.

## 4. Cargar datos de ejemplo, opcional

```bash
docker compose exec -T db sh -c 'mariadb -u root -p"$MARIADB_ROOT_PASSWORD" pawspace' < database/seeds.sql
```

## 5. Comprobar que funciona

```bash
curl http://localhost:8000/health
```

Debe responder `{"status":"healthy"}`.

## Comandos útiles

```bash
docker compose ps                # estado de los servicios
docker compose logs -f backend   # logs del backend
docker compose down              # parar los servicios
docker compose down -v           # parar y borrar los datos de la base de datos
```

## Backend sin Docker, opcional

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

Necesita una MariaDB accesible con los datos que hayas puesto en `.env`.
