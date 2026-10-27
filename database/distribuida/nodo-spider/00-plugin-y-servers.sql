-- NODO SPIDER - PLUGIN SPIDER + BASE + NODOS DE DATOS

-- La base existe en los cinco nodos con el mismo nombre. En el nodo spider NO
-- guarda datos: aqui solo viven tablas Spider (virtuales) y vistas.
CREATE DATABASE IF NOT EXISTS pawspace
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

INSTALL SONAME 'ha_spider';

-- Evidencia de que el motor ha cargado:
SELECT PLUGIN_NAME, PLUGIN_STATUS, PLUGIN_TYPE, PLUGIN_LIBRARY
  FROM information_schema.PLUGINS
 WHERE PLUGIN_NAME = 'SPIDER';

-- Nodos de datos

CREATE SERVER dn_a FOREIGN DATA WRAPPER mysql
  OPTIONS (HOST '172.30.0.11', DATABASE 'pawspace',
           USER 'spider', PASSWORD 'spiderpw', PORT 3306);

CREATE SERVER dn_b FOREIGN DATA WRAPPER mysql
  OPTIONS (HOST '172.30.0.12', DATABASE 'pawspace',
           USER 'spider', PASSWORD 'spiderpw', PORT 3306);

SELECT server_name, host, db, username, port FROM mysql.servers ORDER BY server_name;
