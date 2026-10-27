# Requisitos

## Software necesario

- Docker
- Docker Compose (viene incluido con Docker)
- Git

## Opcional, para trabajar sin Docker

- Python 3.11 o superior
- Node.js y npm, para el frontend
- MariaDB 11.4 o superior

## Opcional, para regenerar el SQL distribuido

- Python 3, sin dependencias: `devops/scripts/generar_sql.py` solo usa la librería estándar.

No hace falta para levantar el proyecto: el SQL de `database/distribuida/` ya está generado en el
repositorio.

## Recursos

- **4 GB de RAM** como mínimo. Son 8 contenedores, y cinco de ellos son MariaDB. Cada nodo de
  base de datos con el juego de datos de ejemplo consume del orden de 150 a 250 MB.
- **Unos 2 GB de disco** para las imágenes y los volúmenes.

## Puertos que tienen que estar libres

| Puerto | Qué es |
|---|---|
| 3000 | Frontend |
| 8000 | API |
| 8081 | Adminer |
| 14306 a 14310 | Los cinco nodos de base de datos (`spider`, `dn_a`, `dn_b`, `rep_a`, `rep_b`) |

Los de la base de datos se publican en `127.0.0.1`, así que no hace falta abrirlos al exterior.
El 8081 se puede cambiar con `ADMINER_PORT` en `.env` (por defecto no es el 8080: en la máquina
de desarrollo ese puerto lo ocupa otro proyecto).

## Comprobar que están instalados

```bash
docker --version
docker compose version
git --version
```

## Permisos

El usuario tiene que poder ejecutar `docker` sin `sudo`. Si no:

```bash
sudo usermod -aG docker "$USER"      # y volver a iniciar sesión
```

O ejecutar los guiones dentro del grupo, sin tocar la sesión:

```bash
sg docker -c './devops/scripts/construir-bd.sh'
```
