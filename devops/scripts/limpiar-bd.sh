#!/usr/bin/env bash
# Borra el cluster de la base de datos distribuida: contenedores, red y
# volumenes. No toca database/schema.sql ni la imagen del nodo spider.
set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RAIZ"

echo "### bajando contenedores, red y volumenes"
docker compose down -v --remove-orphans

echo
echo "### restos (no deberia quedar nada)"
docker ps -a --filter "name=pawspace-" --format '  {{.Names}}  {{.Status}}' | grep . || echo "  ninguno"
docker volume ls --format '{{.Name}}' | grep '^pawspace_' | sed 's/^/  volumen: /' || true
docker network ls --format '{{.Name}}' | grep -E '^pawspace' | sed 's/^/  red: /' || true

echo
echo "### la imagen del nodo spider se conserva"
echo "  para borrarla tambien:  docker rmi pawspace-mariadb-spider:11.4"
