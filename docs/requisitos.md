# Requisitos

## Software necesario

| Pieza | Para qué |
|---|---|
| Docker | Contenedores de las dos fuentes y de la API |
| Docker Compose | Arranque del conjunto |
| Git | Control de versiones |

## Software opcional

| Pieza | Para qué |
|---|---|
| Python 3.11 o superior | Ejecutar la API fuera de Docker |
| MariaDB 11.4 | Revisar el esquema sin contenedores |
| Rust y Cargo | Compilar la base de objetos |
| `mongosh` | Consultar el registro desde el equipo |

## Recursos

| Recurso | Mínimo |
|---|---|
| Memoria | 5 GB |
| Disco | 3 GB para imágenes y volúmenes |
| Contenedores | 11 en ejecución |

Las cinco instancias de MariaDB consumen entre 150 y 250 MB cada una con los datos de ejemplo.
MongoDB ocupa alrededor de 300 MB.

## Puertos

| Puerto | Servicio |
|---|---|
| 3000 | Interfaz web |
| 8000 | API |
| 8081 | Adminer |
| 8082 | DBGate |
| 27017 | MongoDB |
| 8787 | Base de objetos |
| 14306 a 14310 | Nodos de MariaDB |

Los puertos de las bases se publican solo en `127.0.0.1`. Se cambian con las variables del archivo
`.env`.

## Comprobación

```bash
docker --version
docker compose version
git --version
```

El usuario del equipo necesita permisos para ejecutar `docker` sin `sudo`. Si no los tiene:

```bash
sudo usermod -aG docker "$USER"
```

Después hay que cerrar y abrir la sesión.
