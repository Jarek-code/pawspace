#!/usr/bin/env bash
# Borra TODO el estado en contenedores de PawSpace: los cinco nodos de MariaDB,
# MongoDB (logs), la OODB (adjuntos) y sus volumenes, mas la red.
# No toca el codigo ni el SQL de database/ ni las imagenes.
set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RAIZ"

echo "### bajando contenedores, red y volumenes"
echo "    (se pierden la base distribuida, los logs de MongoDB y los adjuntos de la OODB)"
docker compose down -v --remove-orphans

echo
echo "### restos (no deberia quedar nada)"
docker ps -a --filter "name=pawspace-" --format '  {{.Names}}  {{.Status}}' | grep . || echo "  ninguno"
docker volume ls --format '{{.Name}}' | grep '^pawspace_' | sed 's/^/  volumen: /' || true
docker network ls --format '{{.Name}}' | grep -E '^pawspace' | sed 's/^/  red: /' || true

echo
echo "### las imagenes se conservan"
echo "  para borrarlas tambien:"
echo "    docker rmi pawspace-mariadb-spider:11.4 pawspace-backend:latest pawspace-oodb:0.1.0"
