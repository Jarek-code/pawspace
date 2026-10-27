-- NODOS DE DATOS - USUARIO DE LOS ENLACES SPIDER

CREATE USER IF NOT EXISTS 'spider'@'172.30.0.%' IDENTIFIED BY 'spiderpw';

-- Solo lo que necesita Spider para delegar consultas: leer, escribir, bloquear
GRANT SELECT, INSERT, UPDATE, DELETE, LOCK TABLES, CREATE TEMPORARY TABLES
   ON pawspace.* TO 'spider'@'172.30.0.%';

FLUSH PRIVILEGES;

-- Comprobacion: el usuario existe y con que privilegios.
SELECT grantee AS usuario,
       GROUP_CONCAT(DISTINCT privilege_type ORDER BY privilege_type) AS privilegios
  FROM information_schema.user_privileges
 WHERE grantee LIKE "'spider'@%"
 GROUP BY grantee;
