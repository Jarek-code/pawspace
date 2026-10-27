-- NODOS DE DATOS - USUARIO DE REPLICACION

CREATE USER IF NOT EXISTS 'repl'@'172.30.0.%' IDENTIFIED BY 'replpw';

GRANT REPLICATION SLAVE ON *.* TO 'repl'@'172.30.0.%';

FLUSH PRIVILEGES;

SELECT grantee AS usuario,
       GROUP_CONCAT(DISTINCT privilege_type ORDER BY privilege_type) AS privilegios
  FROM information_schema.user_privileges
 WHERE grantee LIKE "'repl'@%"
 GROUP BY grantee;
