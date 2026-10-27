-- VALIDACION 1 - FRAGMENTACION (se ejecuta en el NODO SPIDER)

USE pawspace;

SELECT '=== 1. COMPLETITUD: cada mitad, la suma, y la tabla reconstruida ===' AS validacion;

-- Las tres ultimas columnas tienen que coincidir entre si: la suma de las dos
-- mitades, lo que devuelve la tabla Spider particionada, y lo que devuelve la
-- vista de reconstruccion.
SELECT 'ME_GUSTA_PUBLICACION' AS tabla,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_A) AS en_dn_a,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_B) AS en_dn_b,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_A)
     + (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_B) AS suma,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION) AS particionada,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_GLOBAL) AS vista_global
UNION ALL SELECT 'ME_GUSTA_COMENTARIO',
       (SELECT COUNT(*) FROM ME_GUSTA_COMENTARIO_NODO_A),
       (SELECT COUNT(*) FROM ME_GUSTA_COMENTARIO_NODO_B),
       (SELECT COUNT(*) FROM ME_GUSTA_COMENTARIO_NODO_A)
     + (SELECT COUNT(*) FROM ME_GUSTA_COMENTARIO_NODO_B),
       (SELECT COUNT(*) FROM ME_GUSTA_COMENTARIO),
       (SELECT COUNT(*) FROM ME_GUSTA_COMENTARIO_GLOBAL)
UNION ALL SELECT 'ME_GUSTA_HISTORIA',
       (SELECT COUNT(*) FROM ME_GUSTA_HISTORIA_NODO_A),
       (SELECT COUNT(*) FROM ME_GUSTA_HISTORIA_NODO_B),
       (SELECT COUNT(*) FROM ME_GUSTA_HISTORIA_NODO_A)
     + (SELECT COUNT(*) FROM ME_GUSTA_HISTORIA_NODO_B),
       (SELECT COUNT(*) FROM ME_GUSTA_HISTORIA),
       (SELECT COUNT(*) FROM ME_GUSTA_HISTORIA_GLOBAL)
UNION ALL SELECT 'HISTORIA_VISTA',
       (SELECT COUNT(*) FROM HISTORIA_VISTA_NODO_A),
       (SELECT COUNT(*) FROM HISTORIA_VISTA_NODO_B),
       (SELECT COUNT(*) FROM HISTORIA_VISTA_NODO_A)
     + (SELECT COUNT(*) FROM HISTORIA_VISTA_NODO_B),
       (SELECT COUNT(*) FROM HISTORIA_VISTA),
       (SELECT COUNT(*) FROM HISTORIA_VISTA_GLOBAL)
UNION ALL SELECT 'NOTIFICACION',
       (SELECT COUNT(*) FROM NOTIFICACION_NODO_A),
       (SELECT COUNT(*) FROM NOTIFICACION_NODO_B),
       (SELECT COUNT(*) FROM NOTIFICACION_NODO_A)
     + (SELECT COUNT(*) FROM NOTIFICACION_NODO_B),
       (SELECT COUNT(*) FROM NOTIFICACION),
       (SELECT COUNT(*) FROM NOTIFICACION_GLOBAL);


SELECT '=== 2. DISYUNCION: ninguna clave esta en los dos nodos ===' AS validacion;

-- Todo tiene que dar 0. Si no, la misma fila estaria en las dos mitades.
SELECT 'ME_GUSTA_PUBLICACION' AS tabla,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_A a
          JOIN ME_GUSTA_PUBLICACION_NODO_B b
            ON b.mascota_id = a.mascota_id AND b.id = a.id) AS en_los_dos
UNION ALL SELECT 'ME_GUSTA_COMENTARIO',
       (SELECT COUNT(*) FROM ME_GUSTA_COMENTARIO_NODO_A a
          JOIN ME_GUSTA_COMENTARIO_NODO_B b
            ON b.mascota_id = a.mascota_id AND b.id = a.id)
UNION ALL SELECT 'ME_GUSTA_HISTORIA',
       (SELECT COUNT(*) FROM ME_GUSTA_HISTORIA_NODO_A a
          JOIN ME_GUSTA_HISTORIA_NODO_B b
            ON b.mascota_id = a.mascota_id AND b.id = a.id)
UNION ALL SELECT 'HISTORIA_VISTA',
       (SELECT COUNT(*) FROM HISTORIA_VISTA_NODO_A a
          JOIN HISTORIA_VISTA_NODO_B b
            ON b.historia_id = a.historia_id AND b.mascota_id = a.mascota_id)
UNION ALL SELECT 'NOTIFICACION',
       (SELECT COUNT(*) FROM NOTIFICACION_NODO_A a
          JOIN NOTIFICACION_NODO_B b
            ON b.destinatario_id = a.destinatario_id AND b.id = a.id);


SELECT '=== 3. EL PREDICADO: cada nodo tiene solo su paridad ===' AS validacion;

-- Todo tiene que dar 0. Si algo diese distinto de 0, una fila estaria en el
-- nodo que no le toca (los disparadores no lo permiten, pero se comprueba
-- igual: es la garantia de que el reparto es correcto).
SELECT 'ME_GUSTA_PUBLICACION' AS tabla,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_A WHERE MOD(mascota_id,2) <> 0) AS mal_en_dn_a,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_B WHERE MOD(mascota_id,2) <> 1) AS mal_en_dn_b
UNION ALL SELECT 'ME_GUSTA_COMENTARIO',
       (SELECT COUNT(*) FROM ME_GUSTA_COMENTARIO_NODO_A WHERE MOD(mascota_id,2) <> 0),
       (SELECT COUNT(*) FROM ME_GUSTA_COMENTARIO_NODO_B WHERE MOD(mascota_id,2) <> 1)
UNION ALL SELECT 'ME_GUSTA_HISTORIA',
       (SELECT COUNT(*) FROM ME_GUSTA_HISTORIA_NODO_A WHERE MOD(mascota_id,2) <> 0),
       (SELECT COUNT(*) FROM ME_GUSTA_HISTORIA_NODO_B WHERE MOD(mascota_id,2) <> 1)
UNION ALL SELECT 'HISTORIA_VISTA',
       (SELECT COUNT(*) FROM HISTORIA_VISTA_NODO_A WHERE MOD(mascota_id,2) <> 0),
       (SELECT COUNT(*) FROM HISTORIA_VISTA_NODO_B WHERE MOD(mascota_id,2) <> 1)
UNION ALL SELECT 'NOTIFICACION',
       (SELECT COUNT(*) FROM NOTIFICACION_NODO_A WHERE MOD(destinatario_id,2) <> 0),
       (SELECT COUNT(*) FROM NOTIFICACION_NODO_B WHERE MOD(destinatario_id,2) <> 1);


SELECT '=== 4. AFINIDAD: la actividad de una mascota esta en un solo nodo ===' AS validacion;

-- Como las cinco tablas se fragmentan por la misma clave, toda la actividad de
-- una mascota cae en el mismo nodo. Mascota 2 (par) -> dn_a; mascota 3 (impar)
-- -> dn_b. El nodo contrario tiene que dar 0.
SELECT 'mascota 2 (par) -> dn_a' AS mascota, 'ME_GUSTA_PUBLICACION' AS tabla,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_A WHERE mascota_id = 2) AS en_dn_a,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_B WHERE mascota_id = 2) AS en_dn_b
UNION ALL SELECT 'mascota 2 (par) -> dn_a', 'ME_GUSTA_COMENTARIO',
       (SELECT COUNT(*) FROM ME_GUSTA_COMENTARIO_NODO_A WHERE mascota_id = 2),
       (SELECT COUNT(*) FROM ME_GUSTA_COMENTARIO_NODO_B WHERE mascota_id = 2)
UNION ALL SELECT 'mascota 2 (par) -> dn_a', 'ME_GUSTA_HISTORIA',
       (SELECT COUNT(*) FROM ME_GUSTA_HISTORIA_NODO_A WHERE mascota_id = 2),
       (SELECT COUNT(*) FROM ME_GUSTA_HISTORIA_NODO_B WHERE mascota_id = 2)
UNION ALL SELECT 'mascota 2 (par) -> dn_a', 'HISTORIA_VISTA',
       (SELECT COUNT(*) FROM HISTORIA_VISTA_NODO_A WHERE mascota_id = 2),
       (SELECT COUNT(*) FROM HISTORIA_VISTA_NODO_B WHERE mascota_id = 2)
UNION ALL SELECT 'mascota 3 (impar) -> dn_b', 'ME_GUSTA_PUBLICACION',
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_A WHERE mascota_id = 3),
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_B WHERE mascota_id = 3)
UNION ALL SELECT 'mascota 3 (impar) -> dn_b', 'ME_GUSTA_HISTORIA',
       (SELECT COUNT(*) FROM ME_GUSTA_HISTORIA_NODO_A WHERE mascota_id = 3),
       (SELECT COUNT(*) FROM ME_GUSTA_HISTORIA_NODO_B WHERE mascota_id = 3);


SELECT '=== 5. VERTICAL: el satelite cuadra con el padre y la vista los une ===' AS validacion;

SELECT 'USUARIO' AS padre, 'USUARIO_CREDENCIALES' AS satelite, 'contrasena_hash' AS columnas_movidas,
       (SELECT COUNT(*) FROM USUARIO) AS filas_padre,
       (SELECT COUNT(*) FROM USUARIO_CREDENCIALES) AS filas_satelite,
       (SELECT COUNT(*) FROM vUSUARIO) AS filas_vista,
       (SELECT COUNT(*) FROM vUSUARIO WHERE contrasena_hash IS NOT NULL) AS con_hash
UNION ALL SELECT 'MASCOTA', 'MASCOTA_PERFIL', 'biografia, foto_perfil_url',
       (SELECT COUNT(*) FROM MASCOTA),
       (SELECT COUNT(*) FROM MASCOTA_PERFIL),
       (SELECT COUNT(*) FROM vMASCOTA),
       (SELECT COUNT(*) FROM vMASCOTA WHERE biografia IS NOT NULL)
UNION ALL SELECT 'PUBLICACION', 'PUBLICACION_TEXTO', 'texto',
       (SELECT COUNT(*) FROM PUBLICACION),
       (SELECT COUNT(*) FROM PUBLICACION_TEXTO),
       (SELECT COUNT(*) FROM vPUBLICACION),
       (SELECT COUNT(*) FROM vPUBLICACION WHERE texto IS NOT NULL);

-- La columna movida NO esta en la tabla caliente del nodo spider: solo en el
-- satelite y en la vista.
SELECT table_name AS tabla, GROUP_CONCAT(column_name ORDER BY ordinal_position) AS columnas
  FROM information_schema.columns
 WHERE table_schema = 'pawspace'
   AND table_name IN ('USUARIO','USUARIO_CREDENCIALES','MASCOTA','MASCOTA_PERFIL',
                      'PUBLICACION','PUBLICACION_TEXTO')
 GROUP BY table_name ORDER BY table_name;
