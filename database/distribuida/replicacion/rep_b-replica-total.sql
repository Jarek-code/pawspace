-- REPLICACION ASINCRONA TOTAL:  dn_b  ->  rep_b
-- GENERADO por devops/scripts/generar_sql.py -- no editar a mano

-- OJO: rep_b NO sigue a dn_a directamente, sigue a dn_b.

-- Arranca desde el principio del binlog del maestro.

CHANGE MASTER TO
  MASTER_HOST='172.30.0.12',
  MASTER_PORT=3306,
  MASTER_USER='repl',
  MASTER_PASSWORD='replpw',
  MASTER_LOG_FILE='',
  MASTER_LOG_POS=0,
  MASTER_CONNECT_RETRY=5;

START SLAVE;

SELECT @@server_id AS server_id, @@read_only AS solo_lectura;
SHOW SLAVE STATUS\G
