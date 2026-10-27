-- NODO SPIDER - USUARIO DE LA APLICACION

CREATE USER IF NOT EXISTS 'pawuser'@'%' IDENTIFIED BY 'pawpass';

GRANT SELECT, INSERT, UPDATE, DELETE ON pawspace.* TO 'pawuser'@'%';

FLUSH PRIVILEGES;

SELECT grantee AS usuario,
       GROUP_CONCAT(DISTINCT privilege_type ORDER BY privilege_type) AS privilegios
  FROM information_schema.user_privileges
 WHERE grantee LIKE "'pawuser'@%"
 GROUP BY grantee;
