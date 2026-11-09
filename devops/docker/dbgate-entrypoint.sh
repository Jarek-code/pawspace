#!/bin/sh
# Entrypoint de la imagen de DBGate.
#
# DbGate carga los plugins de usuario desde su directorio de datos
# ($PLUGINS_DIR, por omisión /root/.dbgate/plugins), que es un volumen: lo que se
# hornee en la imagen se quedaría tapado por el montaje. Por eso el plugin viaja en
# /opt/pawspace/dbgate-plugins y se copia aquí en cada arranque, antes de ceder el
# control al entrypoint original de DbGate.
set -eu

DESTINO="${PLUGINS_DIR:-/root/.dbgate/plugins}"
ORIGEN=/opt/pawspace/dbgate-plugins

mkdir -p "$DESTINO"
for plugin in "$ORIGEN"/*; do
  [ -d "$plugin" ] || continue
  nombre=$(basename "$plugin")
  rm -rf "${DESTINO:?}/$nombre"
  cp -R "$plugin" "$DESTINO/$nombre"
done

echo "### plugin de la OODB instalado en $DESTINO/dbgate-plugin-oodb"
exec /usr/local/bin/docker-entrypoint.sh "$@"
