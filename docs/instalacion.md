# Instalación

Puesta en marcha del proyecto en un equipo con Docker. Los comandos se ejecutan desde la raíz del
repositorio.

## 1. Archivo de entorno

```bash
cp .env.example .env
```

Ese archivo guarda las contraseñas de las dos fuentes y los puertos publicados. No se sube al
repositorio.

<details>
<summary>Qué variables hay</summary>

| Grupo | Variables |
|---|---|
| MariaDB | `DB_ROOT_PASSWORD`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` |
| MongoDB | `MONGO_PORT`, `MONGO_BD`, `MONGO_URL`, `LOGS_SAL`, `LOGS_MUESTREO`, `LOGS_RETENCION_DIAS` |
| Base de objetos | `OODB_URL`, `OODB_TOKEN`, `OODB_TIEMPO_MAX`, `OODB_ARCHIVOS` |
| Arranque | `ADMINER_PORT`, `DBGATE_PORT` |
</details>

## 2. Contenedores y base distribuida

```bash
docker compose up -d
./devops/scripts/construir-bd.sh
```

El primer comando levanta los contenedores. El segundo crea el esquema en los cinco nodos, arranca la
replicación y deja la aplicación en marcha.

Si la base ya está construida, el script avisa y no toca nada. Para rehacerla:

```bash
./devops/scripts/construir-bd.sh --desde-cero
```

El script borra los volúmenes de las dos fuentes cuando se usa `--desde-cero`. Para bajar todo sin
tocar los datos:

```bash
docker compose down
```

## 3. Comprobar que responde

```bash
curl http://localhost:8000/health
```

La respuesta esperada es `{"status":"healthy"}`.

Después conviene revisar que el registro de accesos escriba. Se inicia sesión con una cuenta de
prueba y se consulta la colección:

```bash
docker exec -i pawspace-mongo mongosh --quiet pawspace_logs \
  --eval 'print(db.eventos.countDocuments(), db.sesiones.countDocuments())'
```

## 4. Dónde queda cada servicio

| Servicio | Dirección |
|---|---|
| API y documentación | http://localhost:8000 y `/docs` |
| Interfaz web | http://localhost:3000 |
| Adminer | http://localhost:8081 |
| DBGate | http://localhost:8082 |
| MongoDB | `127.0.0.1:27017` |
| Base de objetos | `127.0.0.1:8787` |
| Nodo de acceso de MariaDB | `127.0.0.1:14306` |
| Nodos de datos | `127.0.0.1:14307` y `14308` |
| Respaldos | `127.0.0.1:14309` y `14310` |

Desde el equipo anfitrión se usa `127.0.0.1`. Dentro de la red de los contenedores se usan los
nombres de servicio.

## 5. Backend sin Docker

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e ../logs
uvicorn src.main:app --reload --port 8000
```

El segundo `pip` instala el paquete del registro, que no está publicado. Las variables de entorno se
leen del archivo `.env` del directorio desde el que se arranca, así que conviene exportarlas a mano.

## 6. Comandos útiles

```bash
docker compose ps                    # estado de los servicios
docker compose logs -f backend       # registro de la API
docker compose logs -f dn_a          # registro de un nodo
docker compose restart backend       # reinicia solo la API
```

## 7. Regenerar el SQL distribuido

```bash
python3 devops/scripts/generar_sql.py
```

El script reescribe los archivos que llevan la cabecera de generación. Los que se escriben a mano no
se tocan: el despliegue del plugin de Spider, el usuario de la aplicación, los usuarios de
replicación y las validaciones.
