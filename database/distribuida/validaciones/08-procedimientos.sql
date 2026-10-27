-- VALIDACION 8 - ESCRIBIR DESDE EL NODO SPIDER SIN SABER DE NODOS

USE pawspace;

-- A. INSERT a pelo: cada fila va a la mitad de su dueno
SELECT '=== A. INSERT contra la tabla particionada ===' AS validacion;

-- Mascota 2 (PAR, va a dn_a) y mascota 3 (IMPAR, va a dn_b). La sentencia es
-- identica para las dos: lo unico que cambia es el dueno.
INSERT INTO ME_GUSTA_PUBLICACION (mascota_id, publicacion_id) VALUES (2, 7);
INSERT INTO ME_GUSTA_PUBLICACION (mascota_id, publicacion_id) VALUES (3, 7);

SELECT 'ME_GUSTA_PUBLICACION' AS tabla,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_A
         WHERE publicacion_id = 7 AND mascota_id = 2) AS en_dn_a,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_B
         WHERE publicacion_id = 7 AND mascota_id = 3) AS en_dn_b;

-- Y al reves: preguntar por una mascota PAR en el nodo de los IMPARES da 0.
SELECT 'mascota PAR (2) buscada en el nodo IMPAR' AS comprobacion,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_B WHERE mascota_id = 2) AS filas;

-- B. Procedimiento almacenado: lo mismo, sin escribir el INSERT
SELECT '=== B. Procedimientos almacenados ===' AS validacion;

CALL sp_me_gusta_publicacion(2, 8, @id_par);
CALL sp_me_gusta_publicacion(3, 8, @id_impar);
CALL sp_notificacion(2, 3, 'LIKE_PUBLICACION', 8, NULL, NULL, @id_notif);

SELECT @id_par AS like_par, @id_impar AS like_impar, @id_notif AS notificacion;

-- El procedimiento no dice donde va cada fila: aqui se comprueba donde fueron.
SELECT 'like de la mascota 2' AS fila, id, mascota_id AS dueno, 'dn_a' AS nodo
  FROM ME_GUSTA_PUBLICACION_NODO_A WHERE id = @id_par
UNION ALL
SELECT 'like de la mascota 3', id, mascota_id, 'dn_b'
  FROM ME_GUSTA_PUBLICACION_NODO_B WHERE id = @id_impar
UNION ALL
SELECT 'notificacion de la mascota 2', id, destinatario_id, 'dn_a'
  FROM NOTIFICACION_NODO_A WHERE id = @id_notif;

-- Volver a ver la misma historia no duplica la fila: solo actualiza la fecha.
CALL sp_historia_vista(2, 6);
CALL sp_historia_vista(2, 6);
SELECT 'HISTORIA_VISTA (historia 6, mascota 2)' AS fila, COUNT(*) AS filas
  FROM HISTORIA_VISTA_NODO_A WHERE historia_id = 6 AND mascota_id = 2;

-- C. Corte vertical: una sola llamada, dos tablas
SELECT '=== C. El corte vertical, resuelto por el procedimiento ===' AS validacion;

CALL sp_mascota_crear('Trufa', 'trufa', 3,
                      'Coneja de prueba del procedimiento.', NULL, @id_mascota);
CALL sp_usuario_crear('Nuria Soto', 'nuria@example.com', 'hash_de_prueba', @id_usuario);
CALL sp_publicacion_crear(1, 'Publicacion creada desde un procedimiento.', @id_pub);

SELECT @id_mascota AS mascota_creada, @id_usuario AS usuario_creado,
       @id_pub AS publicacion_creada;

-- La columna movida NO esta en la tabla caliente... (biografia no sale)
SELECT 'MASCOTA por la tabla caliente' AS consulta, id, nombre
  FROM MASCOTA WHERE id = @id_mascota;

-- ...y la vista las vuelve a juntar, como si el corte vertical no existiera.
SELECT 'las tres vistas de union' AS consulta, id, nombre, biografia
  FROM vMASCOTA WHERE id = @id_mascota;
SELECT 'vUSUARIO' AS consulta, id, nombre, email, contrasena_hash
  FROM vUSUARIO WHERE id = @id_usuario;
SELECT 'vPUBLICACION' AS consulta, id, mascota_id, texto
  FROM vPUBLICACION WHERE id = @id_pub;

-- D. El reparto sigue intacto despues de escribir
SELECT '=== D. El predicado y la disyuncion siguen cumpliendose ===' AS validacion;

-- Todo tiene que dar 0.
SELECT 'ME_GUSTA_PUBLICACION' AS tabla,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_A
         WHERE MOD(mascota_id, 2) = 1) AS impares_en_dn_a,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_B
         WHERE MOD(mascota_id, 2) = 0) AS pares_en_dn_b,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION_NODO_A a
          JOIN ME_GUSTA_PUBLICACION_NODO_B b
            ON b.mascota_id = a.mascota_id AND b.id = a.id) AS en_los_dos
UNION ALL
SELECT 'NOTIFICACION',
       (SELECT COUNT(*) FROM NOTIFICACION_NODO_A
         WHERE MOD(destinatario_id, 2) = 1),
       (SELECT COUNT(*) FROM NOTIFICACION_NODO_B
         WHERE MOD(destinatario_id, 2) = 0),
       (SELECT COUNT(*) FROM NOTIFICACION_NODO_A a
          JOIN NOTIFICACION_NODO_B b
            ON b.destinatario_id = a.destinatario_id AND b.id = a.id);
