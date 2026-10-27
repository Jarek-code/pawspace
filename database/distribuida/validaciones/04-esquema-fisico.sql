-- VALIDACION 4 - el corte vertical es FISICO en el nodo de datos

USE pawspace;

SELECT '--- columnas fisicas de padre y satelite en dn_a ---' AS nota;

SELECT table_name AS tabla, COUNT(*) AS n_columnas,
       GROUP_CONCAT(column_name ORDER BY ordinal_position) AS columnas
  FROM information_schema.columns
 WHERE table_schema = 'pawspace'
   AND table_name IN ('USUARIO','USUARIO_CREDENCIALES',
                      'MASCOTA','MASCOTA_PERFIL',
                      'PUBLICACION','PUBLICACION_TEXTO')
 GROUP BY table_name
 ORDER BY table_name;

SELECT '--- quien tiene la columna movida ---' AS nota;

-- Cada columna movida tiene que aparecer UNA sola vez (en su satelite). texto
-- aparece tambien en COMENTARIO, HASHTAG y MENSAJE: son columnas homonimas de
-- otras tablas, no la de PUBLICACION.
SELECT column_name AS columna,
       GROUP_CONCAT(table_name ORDER BY table_name) AS esta_en
  FROM information_schema.columns
 WHERE table_schema = 'pawspace'
   AND column_name IN ('contrasena_hash','biografia','foto_perfil_url','texto')
 GROUP BY column_name;

SELECT '--- y el satelite tiene las mismas filas que su padre ---' AS nota;

SELECT 'USUARIO' AS padre, (SELECT COUNT(*) FROM USUARIO) AS filas_padre,
       'USUARIO_CREDENCIALES' AS satelite,
       (SELECT COUNT(*) FROM USUARIO_CREDENCIALES) AS filas_satelite
UNION ALL SELECT 'MASCOTA', (SELECT COUNT(*) FROM MASCOTA),
       'MASCOTA_PERFIL', (SELECT COUNT(*) FROM MASCOTA_PERFIL)
UNION ALL SELECT 'PUBLICACION', (SELECT COUNT(*) FROM PUBLICACION),
       'PUBLICACION_TEXTO', (SELECT COUNT(*) FROM PUBLICACION_TEXTO);

SELECT '--- las claves foraneas siguen puestas en cada fragmento ---' AS nota;

SELECT TABLE_NAME AS tabla, CONSTRAINT_NAME AS clave_foranea,
       COLUMN_NAME AS columna, REFERENCED_TABLE_NAME AS referencia_a
  FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA = 'pawspace' AND REFERENCED_TABLE_NAME IS NOT NULL
   AND TABLE_NAME IN ('ME_GUSTA_PUBLICACION','ME_GUSTA_COMENTARIO','ME_GUSTA_HISTORIA',
                      'HISTORIA_VISTA','NOTIFICACION')
 ORDER BY TABLE_NAME, CONSTRAINT_NAME;
