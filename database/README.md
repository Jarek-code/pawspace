# Base de datos

MariaDB 11.4. Base de datos `pawspace`, con `utf8mb4` y `utf8mb4_unicode_ci`.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `schema.sql` | Esquema completo: 29 tablas y 4 triggers. Para ejecutarlo a mano o desde Adminer |
| `init/01-schema.sql` | Copia que MariaDB ejecuta sola la primera vez que arranca el contenedor. `docker-compose.yml` monta esta carpeta en `/docker-entrypoint-initdb.d` |
| `seeds.sql` | Datos de ejemplo para probar |

`schema.sql` y `init/01-schema.sql` definen las mismas tablas. Se mantienen los dos
porque el de `init/` tiene que ser autocontenido para que el contenedor lo ejecute.

## Tablas

29 tablas:

`USUARIO`, `ESPECIE`, `RAZA`, `MASCOTA`, `USUARIO_MASCOTA`, `SEGUIMIENTO`, `BLOQUEO`,
`PUBLICACION`, `PUBLICACION_ADJUNTO`, `ME_GUSTA_PUBLICACION`, `COMENTARIO`,
`COMENTARIO_IMAGEN`, `ME_GUSTA_COMENTARIO`, `HASHTAG`, `PUBLICACION_HASHTAG`,
`COMENTARIO_HASHTAG`, `PUBLICACION_MENCION`, `COMENTARIO_MENCION`, `HASHTAG_SEGUIDOR`,
`PUBLICACION_GUARDADA`, `HISTORIA`, `HISTORIA_ADJUNTO`, `HISTORIA_VISTA`,
`ME_GUSTA_HISTORIA`, `CONVERSACION`, `CONVERSACION_PARTICIPANTE`, `MENSAJE`, `REPORTE`,
`NOTIFICACION`

## Cargar los datos de ejemplo

Con los contenedores en marcha:

```bash
docker compose exec -T db sh -c 'mariadb -u root -p"$MARIADB_ROOT_PASSWORD" pawspace' < database/seeds.sql
```

## Empezar de cero

```bash
docker compose down -v
docker compose up -d
```

Se borra el volumen de datos y `init/01-schema.sql` vuelve a ejecutarse.
