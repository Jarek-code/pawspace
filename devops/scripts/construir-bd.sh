#!/usr/bin/env bash
# Construye la base de datos distribuida de PawSpace sobre los cinco nodos.
set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RAIZ"
SQL="$RAIZ/database/distribuida"

# La misma contrasena que usa docker-compose.yml (que a su vez lee .env).
if [ -f .env ]; then set -a; . ./.env; set +a; fi
PW="${DB_ROOT_PASSWORD:-rootpass}"
CLAVE_SPIDER="spiderpw"

DESDE_CERO=0
[ "${1:-}" = "--desde-cero" ] && DESDE_CERO=1

# C <nodo> <args...>   nodo = spider | dn_a | dn_b | rep_a | rep_b
C() {
  local contenedor="pawspace-${1//_/-}"
  shift
  docker exec -i "$contenedor" mariadb -uroot -p"$PW" "$@"
}

paso() {   # paso <nombre> <nodo> <fichero.sql>
  local nombre="$1" nodo="$2" sql="$3" rc salida
  printf '  %-38s en %-6s ' "$nombre" "$nodo"
  salida=$(C "$nodo" --table < "$sql" 2>&1)
  rc=$?
  if [ $rc -eq 0 ]; then
    echo "OK"
  else
    echo "codigo $rc"
    printf '%s\n' "$salida" | sed 's/^/    /'
  fi
}

esperar_tablas() {   # esperar_tablas <nodo> <lista-sql> <cuantas> <que>
  local nodo="$1" lista="$2" n="$3" que="$4" i c
  for i in $(seq 1 60); do
    c=$(C "$nodo" -N -e "SELECT COUNT(*) FROM information_schema.tables
                          WHERE table_schema='pawspace' AND table_name IN ($lista);" \
        2>/dev/null | tr -d '[:space:]')
    if [ "${c:-0}" = "$n" ]; then
      echo "  espera  : $nodo ya tiene $que (${i}s)"; return 0
    fi
    sleep 1
  done
  echo "  espera  : !! $nodo no ha recibido $que ($c de $n)"; return 1
}

esperar_filas() {   # esperar_filas <nodo> <tabla> <columna-id> <valor> <que>
  local nodo="$1" tabla="$2" col="$3" valor="$4" que="$5" i c
  for i in $(seq 1 60); do
    c=$(C "$nodo" -N -e "SELECT COUNT(*) FROM pawspace.$tabla WHERE $col = $valor;" \
        2>/dev/null | tr -d '[:space:]')
    if [ "${c:-0}" != "0" ] && [ -n "${c:-}" ]; then
      echo "  espera  : $nodo ya tiene $que (${i}s)"; return 0
    fi
    sleep 1
  done
  echo "  espera  : !! $nodo no ha recibido $que"; return 1
}

echo "### 0. estado de los contenedores"
if [ "$DESDE_CERO" = "1" ]; then
  echo "  --desde-cero: bajando los contenedores y sus volumenes"
  docker compose down -v --remove-orphans >/dev/null 2>&1
fi

# Se levanta SOLO el cluster de la base de datos: el backend abre la conexion al
# arrancar y, como el usuario de la aplicacion y el esquema se crean mas abajo,
# fallaria con "Access denied for user 'pawuser'". La app se levanta en el paso 12.
docker compose up -d spider dn_a dn_b rep_a rep_b >/dev/null 2>&1
docker compose ps

listos=0
for i in $(seq 1 90); do
  listos=0
  for c in spider dn-a dn-b rep-a rep-b; do
    [ "$(docker inspect -f '{{.State.Health.Status}}' "pawspace-$c" 2>/dev/null)" = "healthy" ] \
      && listos=$((listos+1))
  done
  [ "$listos" -eq 5 ] && break
  sleep 2
done
echo "  $listos/5 nodos healthy (${i} iteraciones)"
if [ "$listos" -ne 5 ]; then
  echo "  !! no arrancan los cinco nodos; mira: docker compose ps"
  exit 1
fi

ya=$(C dn_a -N -e "SELECT COUNT(*) FROM information_schema.schemata
                    WHERE schema_name='pawspace';" 2>/dev/null | tr -d '[:space:]')
if [ "${ya:-0}" != "0" ]; then
  echo
  echo "  !! dn_a ya tiene la base 'pawspace' construida."
  echo "     Para rehacerla:  ./devops/scripts/construir-bd.sh --desde-cero"
  echo "     Para borrarla:   ./devops/scripts/limpiar-bd.sh"
  exit 1
fi

echo
echo "### 1. dn_a: esquema replicado (las 27 tablas no fragmentadas + 3 satelites)"
paso "01-esquema-dn_a" dn_a "$SQL/nodo-datos/01-esquema-replicado.sql"

echo "### 2. dn_a: fragmentos horizontales y disparadores de paridad"
paso "02-fragmentos-dn_a" dn_a "$SQL/nodo-datos/02-fragmentos.sql"
paso "03-triggers-dn_a" dn_a "$SQL/nodo-datos/03-triggers-paridad-dn_a.sql"

echo "### 3. dn_a: datos de ejemplo (es el maestro, aqui se escribe todo una vez)"
paso "04-datos-dn_a" dn_a "$SQL/nodo-datos/04-datos-dn_a.sql"

echo "### 4. dn_a: usuarios (enlaces Spider y replicacion)"
paso "05-usuario-spider-dn_a" dn_a "$SQL/nodo-datos/05-usuario-spider.sql"
paso "06-usuario-replicacion-dn_a" dn_a "$SQL/nodo-datos/06-usuario-replicacion.sql"

echo
echo "### 5. REPLICACION PARCIAL: dn_a -> dn_b (solo las tablas no fragmentadas)"
paso "07-replicacion-parcial-dn_b" dn_b "$SQL/replicacion/dn_b-replica-parcial.sql"
esperar_tablas dn_b "'MASCOTA','PUBLICACION','COMENTARIO','HISTORIA'" 4 \
  "las tablas replicadas que necesitan los fragmentos"

echo
echo "### 6. dn_b: sus fragmentos, sus disparadores y su mitad de los datos"
echo "    (02-fragmentos.sql es el mismo fichero que en dn_a: la tabla se llama"
echo "     igual en los dos nodos, lo que cambia es que filas le tocan)"
paso "08-fragmentos-dn_b" dn_b "$SQL/nodo-datos/02-fragmentos.sql"
paso "09-triggers-dn_b" dn_b "$SQL/nodo-datos/03-triggers-paridad-dn_b.sql"
paso "10-datos-dn_b" dn_b "$SQL/nodo-datos/04-datos-dn_b.sql"
paso "11-usuario-spider-dn_b" dn_b "$SQL/nodo-datos/05-usuario-spider.sql"
paso "12-usuario-replicacion-dn_b" dn_b "$SQL/nodo-datos/06-usuario-replicacion.sql"

echo
echo "### 7. REPLICACION TOTAL: dn_a -> rep_a  y  dn_b -> rep_b"
paso "13-replicacion-total-rep_a" rep_a "$SQL/replicacion/rep_a-replica-total.sql"
paso "14-replicacion-total-rep_b" rep_b "$SQL/replicacion/rep_b-replica-total.sql"
esperar_filas rep_a "ME_GUSTA_PUBLICACION" "mascota_id" 2 "el fragmento PAR"
esperar_filas rep_b "ME_GUSTA_PUBLICACION" "mascota_id" 3 "el fragmento IMPAR"

echo
echo "### 8. NODO SPIDER: tablas Spider, fragmentos particionados y vistas"
paso "15-esquema-spider" spider "$SQL/nodo-spider/01-esquema-spider.sql"
paso "16-horizontal" spider "$SQL/nodo-spider/02-horizontal.sql"
paso "17-vertical" spider "$SQL/nodo-spider/03-vertical.sql"
paso "18-procedimientos" spider "$SQL/nodo-spider/05-procedimientos.sql"
paso "18b-usuario-aplicacion" spider "$SQL/nodo-spider/04-usuario-aplicacion.sql"

echo
echo "### 9. VALIDACION DE LA FRAGMENTACION"
paso "18-validacion-fragmentacion" spider "$SQL/validaciones/01-fragmentacion.sql"
paso "19-esquema-fisico-dn_a" dn_a "$SQL/validaciones/04-esquema-fisico.sql"
echo "  (la validacion del disparador escribe mal a proposito: se espera un error)"
paso "20-el-disparador-rechaza" spider "$SQL/validaciones/02-el-disparador-rechaza.sql"
paso "21-escritura-y-lectura-cruzada" spider "$SQL/validaciones/03-escritura-y-lectura-cruzada.sql"

echo
echo "### 9b. VALIDACION DE LA ESCRITURA TRANSPARENTE (INSERT y procedimientos)"
paso "22-procedimientos" spider "$SQL/validaciones/08-procedimientos.sql"

echo
echo "### 10. VALIDACION DE LA REPLICACION"
paso "23-replicacion-escritura-dn_a" dn_a "$SQL/validaciones/05-replicacion-escritura-dn_a.sql"
paso "24-replicacion-escritura-dn_b" dn_b "$SQL/validaciones/06-replicacion-escritura-dn_b.sql"

echo "  esperando a que las dos escrituras se propaguen por replicacion..."
sleep 6

echo
echo "### estado de cada replica (dn_b y rep_a siguen a dn_a; rep_b sigue a dn_b)"
printf '  %-7s %-9s %-6s %-6s %s\n' nodo server_id IO SQL "retraso(s)"
for n in dn_b rep_a rep_b; do
  sid=$(C "$n" -N -e "SELECT @@server_id;" 2>/dev/null | tr -d '[:space:]')
  est=$(C "$n" -e "SHOW SLAVE STATUS\G" 2>/dev/null)
  io=$(printf '%s\n' "$est" | sed -n 's/^ *Slave_IO_Running: //p')
  sq=$(printf '%s\n' "$est" | sed -n 's/^ *Slave_SQL_Running: //p')
  lag=$(printf '%s\n' "$est" | sed -n 's/^ *Seconds_Behind[A-Za-z_]*: //p')
  printf '  %-7s %-9s %-6s %-6s %s\n' "$n" "$sid" "$io" "$sq" "$lag"
done

echo
echo "### donde ha acabado cada escritura (1 = la fila esta en ese nodo)"
echo "###   MASCOTA 9   = tabla REPLICADA, escrita en dn_a"
echo "###   like 8001   = fragmento PAR,   escrito en dn_a"
echo "###   like 8002   = fragmento IMPAR, escrito en dn_b"
printf '  %-7s %-11s %-12s %s\n' nodo "MASCOTA 9" "like 8001" "like 8002"
for n in dn_a dn_b rep_a rep_b; do
  read -r m l1 l2 < <(C "$n" -N -e "SELECT
        (SELECT COUNT(*) FROM pawspace.MASCOTA WHERE id = 9),
        (SELECT COUNT(*) FROM pawspace.ME_GUSTA_PUBLICACION WHERE id = 8001),
        (SELECT COUNT(*) FROM pawspace.ME_GUSTA_PUBLICACION WHERE id = 8002);" \
      2>/dev/null | tr '\t' ' ')
  printf '  %-7s %-11s %-12s %s\n' "$n" "${m:-?}" "${l1:-?}" "${l2:-?}"
done
echo
echo "  Lo que hay que ver:"
echo "    MASCOTA 9  -> 1 en los CUATRO nodos: la replicacion (parcial y total) la llevo."
echo "    like 8001  -> 1 en dn_a y rep_a; 0 en dn_b y rep_b: la parcial ignora los fragmentos."
echo "    like 8002  -> 1 en dn_b y rep_b; 0 en dn_a y rep_a."

echo
echo "### 11. el respaldo no acepta escrituras (usuario spider, sin privilegio SUPER)"
salida=$(docker exec -i pawspace-spider mariadb -h 172.30.0.13 -P 3306 \
  -u spider -p"$CLAVE_SPIDER" --table pawspace \
  < "$SQL/validaciones/07-replica-no-acepta-escrituras.sql" 2>&1)
rc=$?
if [ $rc -ne 0 ]; then
  echo "  OK, rep_a ha rechazado la escritura (codigo $rc)"
else
  echo "  !! rep_a ha ACEPTADO una escritura"
fi
printf '%s\n' "$salida" | sed -n 's/^ERROR/  /p'

echo
echo "### 12. arrancando la aplicacion (ya con la base construida)"
docker compose up -d >/dev/null 2>&1
# Los servicios de la app pueden venir de un intento anterior reiniciandose:
# un reinicio explicito se asegura de que reconecten contra la base ya creada.
docker compose restart backend adminer >/dev/null 2>&1
sleep 6
docker compose ps --format '  {{.Name}}  {{.Status}}'
echo -n "  la API responde: "
curl -s --max-time 10 http://localhost:8000/health || echo "(sin respuesta)"
echo

echo
echo "### 13. estado final del nodo spider"
C spider --table -e "SELECT ENGINE, TABLE_TYPE, COUNT(*) AS objetos
                       FROM information_schema.TABLES
                      WHERE TABLE_SCHEMA='pawspace'
                      GROUP BY ENGINE, TABLE_TYPE ORDER BY objetos DESC;"
echo "### mapa de particiones de las 5 tablas fragmentadas"
C spider --table -e "SELECT TABLE_NAME, PARTITION_NAME, PARTITION_COMMENT
                       FROM information_schema.PARTITIONS
                      WHERE TABLE_SCHEMA='pawspace' AND PARTITION_NAME IS NOT NULL
                      ORDER BY TABLE_NAME, PARTITION_ORDINAL_POSITION;"
