-- NODO dn_b - DATOS DE EJEMPLO
-- GENERADO por devops/scripts/generar_sql.py -- no editar a mano

USE pawspace;

-- Comprobacion de que la replicacion ya trajo lo que hace falta:
SELECT COUNT(*) AS tablas_replicadas_que_necesitan_los_fragmentos
  FROM information_schema.tables
 WHERE table_schema = 'pawspace'
   AND table_name IN ('MASCOTA','PUBLICACION','COMENTARIO','HISTORIA');

-- El fragmento de dn_b: SOLO duenos IMPARES

-- ME_GUSTA_PUBLICACION: dueno mascota_id -> 6 de las 12 filas
INSERT INTO ME_GUSTA_PUBLICACION (id, mascota_id, publicacion_id) VALUES
    (1, 1, 1),
    (3, 3, 1),
    (5, 1, 2),
    (7, 3, 2),
    (9, 1, 3),
    (11, 3, 3);

-- ME_GUSTA_COMENTARIO: dueno mascota_id -> 5 de las 10 filas
INSERT INTO ME_GUSTA_COMENTARIO (id, mascota_id, comentario_id) VALUES
    (1, 1, 1),
    (3, 3, 1),
    (5, 1, 2),
    (7, 3, 2),
    (9, 1, 3);

-- ME_GUSTA_HISTORIA: dueno mascota_id -> 4 de las 8 filas
INSERT INTO ME_GUSTA_HISTORIA (id, mascota_id, historia_id) VALUES
    (1, 1, 1),
    (3, 3, 1),
    (5, 1, 2),
    (7, 3, 2);

-- HISTORIA_VISTA: dueno mascota_id -> 6 de las 12 filas
INSERT INTO HISTORIA_VISTA (historia_id, mascota_id, vista_en) VALUES
    (1, 1, '2026-02-01 09:00:00'),
    (1, 3, '2026-02-03 09:00:00'),
    (2, 1, '2026-02-05 09:00:00'),
    (2, 3, '2026-02-07 09:00:00'),
    (3, 1, '2026-02-09 09:00:00'),
    (3, 3, '2026-02-11 09:00:00');

-- NOTIFICACION: dueno destinatario_id -> 7 de las 14 filas
INSERT INTO NOTIFICACION (id, destinatario_id, actor_id, tipo, publicacion_id, creado_en) VALUES
    (1, 1, 2, 'LIKE_PUBLICACION', 1, '2026-02-01 09:00:00'),
    (3, 3, 4, 'LIKE_PUBLICACION', 1, '2026-02-03 09:00:00'),
    (5, 1, 2, 'LIKE_PUBLICACION', 2, '2026-02-05 09:00:00'),
    (7, 3, 4, 'LIKE_PUBLICACION', 2, '2026-02-07 09:00:00'),
    (9, 1, 2, 'LIKE_PUBLICACION', 3, '2026-02-09 09:00:00'),
    (11, 3, 4, 'LIKE_PUBLICACION', 3, '2026-02-11 09:00:00'),
    (13, 1, 2, 'LIKE_PUBLICACION', 4, '2026-02-13 09:00:00');

-- ---------------------------------------------------------------------------
-- Comprobacion: lo que hay en ESTE nodo (los fragmentos son IMPAR)
-- ---------------------------------------------------------------------------

SELECT 'ME_GUSTA_PUBLICACION' AS fragmento, COUNT(*) AS filas FROM ME_GUSTA_PUBLICACION
UNION ALL SELECT 'ME_GUSTA_COMENTARIO   ', COUNT(*) FROM ME_GUSTA_COMENTARIO
UNION ALL SELECT 'ME_GUSTA_HISTORIA     ', COUNT(*) FROM ME_GUSTA_HISTORIA
UNION ALL SELECT 'HISTORIA_VISTA        ', COUNT(*) FROM HISTORIA_VISTA
UNION ALL SELECT 'NOTIFICACION          ', COUNT(*) FROM NOTIFICACION
UNION ALL SELECT 'MASCOTA (replicada)', COUNT(*) FROM MASCOTA
UNION ALL SELECT 'PUBLICACION (replicada)', COUNT(*) FROM PUBLICACION
;
