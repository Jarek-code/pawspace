# DBGate

Gestor de bases de datos del entorno. Se abre en http://localhost:8082 y trae tres conexiones
preparadas.

| Conexión | Fuente |
|---|---|
| PawSpace · MariaDB (spider) | Nodo de acceso del clúster |
| PawSpace · MongoDB (logs) | Base `pawspace_logs` |
| PawSpace · OODB (adjuntos) | Base de objetos, por HTTP |

Adminer sigue disponible en el puerto 8081 para consultas sueltas.

## Configuración

El servicio está en `docker-compose.yml`. La imagen parte de `dbgate/dbgate:7.1.5` y le agrega el
plugin de la base de objetos, que viaja en `tools/dbgate-plugin-oodb`.

<details>
<summary>Dos condiciones para que el plugin cargue</summary>

DbGate solo reconoce plugins de usuario en su directorio de datos, que aquí es un volumen. Por eso el
plugin se copia en cada arranque desde `/opt/pawspace/dbgate-plugins` con
`devops/docker/dbgate-entrypoint.sh`. Además, el `package.json` del plugin necesita la palabra clave
`dbgateplugin`; sin ella DbGate lo ignora.
</details>

## El plugin de la base de objetos

Es de solo lectura. Muestra cada clase como una tabla y cada objeto como una fila. El código está en
`tools/dbgate-plugin-oodb`.

| En DBGate | En la base de objetos |
|---|---|
| Tabla | Clase: `Publicacion`, `Historia`, `Comentario`, `Imagen`, `Video` |
| Fila | Objeto: `oid`, `clase`, `ancla`, `texto`, `adjuntos` |
| Detalle | `GET /objetos/{oid}` con los campos y los adjuntos |

En el editor solo acepta lecturas sobre una clase. DbGate arma consultas con listas de columnas,
límites y conteos, y el plugin las traduce a la API del servicio.

## Comprobar que responde

```bash
docker compose up -d dbgate
docker exec pawspace-dbgate ls /root/.dbgate/plugins
curl -s http://127.0.0.1:8787/clases
```

Si la conexión falla, el mensaje del plugin indica a qué dirección intentó llegar. Las causas
habituales son que el servicio de la base de objetos esté detenido o que el token no coincida.
