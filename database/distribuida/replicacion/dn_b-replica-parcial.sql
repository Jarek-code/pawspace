-- REPLICACION ASINCRONA PARCIAL:  dn_a  ->  dn_b
-- GENERADO por devops/scripts/generar_sql.py -- no editar a mano
--     replicate-ignore-table = pawspace.ME_GUSTA_PUBLICACION
--     replicate-ignore-table = pawspace.ME_GUSTA_COMENTARIO
--     replicate-ignore-table = pawspace.ME_GUSTA_HISTORIA
--     replicate-ignore-table = pawspace.HISTORIA_VISTA
--     replicate-ignore-table = pawspace.NOTIFICACION

-- Arranca desde el principio del binlog: MASTER_LOG_FILE='' y MASTER_LOG_POS=0.

CHANGE MASTER TO
  MASTER_HOST='172.30.0.11',
  MASTER_PORT=3306,
  MASTER_USER='repl',
  MASTER_PASSWORD='replpw',
  MASTER_LOG_FILE='',
  MASTER_LOG_POS=0,
  MASTER_CONNECT_RETRY=5;

START SLAVE;

-- Quien es este nodo y a quien sigue:
SELECT @@server_id AS server_id, @@read_only AS solo_lectura;
SHOW SLAVE STATUS\G
