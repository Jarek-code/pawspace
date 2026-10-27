-- NODO dn_a - DATOS DE EJEMPLO
-- GENERADO por devops/scripts/generar_sql.py -- no editar a mano

USE pawspace;

-- Catalogos

INSERT INTO ESPECIE (id, nombre) VALUES
    (1, 'Perro'),
    (2, 'Gato'),
    (3, 'Conejo'),
    (4, 'Ave');

INSERT INTO RAZA (id, especie_id, nombre) VALUES
    (1, 1, 'Labrador Retriever'),
    (2, 1, 'Pastor Aleman'),
    (3, 1, 'Mestizo'),
    (4, 2, 'Siames'),
    (5, 2, 'Persa'),
    (6, 2, 'Comun Europeo'),
    (7, 3, 'Enano'),
    (8, 4, 'Periquito');

-- ---------------------------------------------------------------------------
-- Usuarios. Corte vertical 1: contrasena_hash vive en USUARIO_CREDENCIALES
-- ---------------------------------------------------------------------------

INSERT INTO USUARIO (id, nombre, email) VALUES
    (1, 'Ana Garcia', 'ana@example.com'),
    (2, 'Luis Perez', 'luis@example.com'),
    (3, 'Marta Ruiz', 'marta@example.com');

INSERT INTO USUARIO_CREDENCIALES (usuario_id, contrasena_hash) VALUES
    (1, 'CAMBIA_ESTO_hash_de_prueba_1'),
    (2, 'CAMBIA_ESTO_hash_de_prueba_2'),
    (3, 'CAMBIA_ESTO_hash_de_prueba_3');

-- ---------------------------------------------------------------------------
-- Mascotas: son el DUENO de la fragmentacion. Los ids 1 y 3 son impares
-- (van a dn_b), los ids 2 y 4 son pares (van a dn_a).
-- Corte vertical 2: biografia y foto_perfil_url viven en MASCOTA_PERFIL
-- ---------------------------------------------------------------------------

INSERT INTO MASCOTA (id, nombre, nombre_usuario, especie_id, raza_id, sexo, fecha_nacimiento) VALUES
    (1, 'Rocky', 'rocky', 1, 1, 'M', '2021-05-10'),
    (2, 'Michi', 'michi', 2, 4, 'F', '2022-03-02'),
    (3, 'Nube', 'nube', 3, 7, 'F', '2023-01-20'),
    (4, 'Kira', 'kira', 1, 2, 'F', '2020-11-15');

INSERT INTO MASCOTA_PERFIL (mascota_id, biografia, foto_perfil_url) VALUES
    (1, 'Le encanta correr y nadar.', '/img/mascota1.jpg'),
    (2, 'Gata tranquila, muy dormilona.', '/img/mascota2.jpg'),
    (3, 'Coneja curiosa.', '/img/mascota3.jpg'),
    (4, 'Pastora alemana guardian.', '/img/mascota4.jpg');

INSERT INTO USUARIO_MASCOTA (usuario_id, mascota_id) VALUES
    (1, 1),
    (1, 4),
    (2, 2),
    (3, 3);

-- ---------------------------------------------------------------------------
-- Contenido
-- Corte vertical 3: el texto del post vive en PUBLICACION_TEXTO
-- ---------------------------------------------------------------------------

INSERT INTO PUBLICACION (id, mascota_id, creado_en) VALUES
    (1, 2, '2026-01-01 10:00:00'),
    (2, 3, '2026-01-02 10:00:00'),
    (3, 4, '2026-01-03 10:00:00'),
    (4, 1, '2026-01-04 10:00:00'),
    (5, 2, '2026-01-05 10:00:00'),
    (6, 3, '2026-01-06 10:00:00'),
    (7, 4, '2026-01-07 10:00:00'),
    (8, 1, '2026-01-08 10:00:00');

INSERT INTO PUBLICACION_TEXTO (publicacion_id, texto) VALUES
    (1, 'Primer dia en el parque'),
    (2, 'Siesteando al sol'),
    (3, 'Carrera con los amigos'),
    (4, 'Mi juguete nuevo'),
    (5, 'Tarde de lluvia'),
    (6, 'Paseo por el rio'),
    (7, 'Merendando'),
    (8, 'Dormido en el sofa');

INSERT INTO COMENTARIO (id, publicacion_id, mascota_id, texto, creado_en) VALUES
    (1, 2, 2, 'Comentario 1', '2026-01-01 11:00:00'),
    (2, 3, 3, 'Comentario 2', '2026-01-02 11:00:00'),
    (3, 4, 4, 'Comentario 3', '2026-01-03 11:00:00'),
    (4, 5, 1, 'Comentario 4', '2026-01-04 11:00:00'),
    (5, 6, 2, 'Comentario 5', '2026-01-05 11:00:00'),
    (6, 7, 3, 'Comentario 6', '2026-01-06 11:00:00'),
    (7, 8, 4, 'Comentario 7', '2026-01-07 11:00:00'),
    (8, 1, 1, 'Comentario 8', '2026-01-08 11:00:00'),
    (9, 2, 2, 'Comentario 9', '2026-01-09 11:00:00'),
    (10, 3, 3, 'Comentario 10', '2026-01-10 11:00:00');

INSERT INTO HISTORIA (id, mascota_id, creado_en, vence_en) VALUES
    (1, 2, '2026-02-01 08:00:00', '2026-02-01 20:00:00'),
    (2, 3, '2026-02-02 08:00:00', '2026-02-02 20:00:00'),
    (3, 4, '2026-02-03 08:00:00', '2026-02-03 20:00:00'),
    (4, 1, '2026-02-04 08:00:00', '2026-02-04 20:00:00'),
    (5, 2, '2026-02-05 08:00:00', '2026-02-05 20:00:00'),
    (6, 3, '2026-02-06 08:00:00', '2026-02-06 20:00:00');

-- ---------------------------------------------------------------------------
-- El fragmento de dn_a: SOLO duenos PARES
-- ---------------------------------------------------------------------------

-- ME_GUSTA_PUBLICACION: dueno mascota_id -> 6 de las 12 filas
INSERT INTO ME_GUSTA_PUBLICACION (id, mascota_id, publicacion_id) VALUES
    (2, 2, 1),
    (4, 4, 1),
    (6, 2, 2),
    (8, 4, 2),
    (10, 2, 3),
    (12, 4, 3);

-- ME_GUSTA_COMENTARIO: dueno mascota_id -> 5 de las 10 filas
INSERT INTO ME_GUSTA_COMENTARIO (id, mascota_id, comentario_id) VALUES
    (2, 2, 1),
    (4, 4, 1),
    (6, 2, 2),
    (8, 4, 2),
    (10, 2, 3);

-- ME_GUSTA_HISTORIA: dueno mascota_id -> 4 de las 8 filas
INSERT INTO ME_GUSTA_HISTORIA (id, mascota_id, historia_id) VALUES
    (2, 2, 1),
    (4, 4, 1),
    (6, 2, 2),
    (8, 4, 2);

-- HISTORIA_VISTA: dueno mascota_id -> 6 de las 12 filas
INSERT INTO HISTORIA_VISTA (historia_id, mascota_id, vista_en) VALUES
    (1, 2, '2026-02-02 09:00:00'),
    (1, 4, '2026-02-04 09:00:00'),
    (2, 2, '2026-02-06 09:00:00'),
    (2, 4, '2026-02-08 09:00:00'),
    (3, 2, '2026-02-10 09:00:00'),
    (3, 4, '2026-02-12 09:00:00');

-- NOTIFICACION: dueno destinatario_id -> 7 de las 14 filas
INSERT INTO NOTIFICACION (id, destinatario_id, actor_id, tipo, publicacion_id, creado_en) VALUES
    (2, 2, 3, 'LIKE_PUBLICACION', 1, '2026-02-02 09:00:00'),
    (4, 4, 1, 'LIKE_PUBLICACION', 1, '2026-02-04 09:00:00'),
    (6, 2, 3, 'LIKE_PUBLICACION', 2, '2026-02-06 09:00:00'),
    (8, 4, 1, 'LIKE_PUBLICACION', 2, '2026-02-08 09:00:00'),
    (10, 2, 3, 'LIKE_PUBLICACION', 3, '2026-02-10 09:00:00'),
    (12, 4, 1, 'LIKE_PUBLICACION', 3, '2026-02-12 09:00:00'),
    (14, 2, 3, 'LIKE_PUBLICACION', 4, '2026-02-14 09:00:00');

-- ---------------------------------------------------------------------------
-- Comprobacion: lo que hay en ESTE nodo (los fragmentos son PAR)
-- ---------------------------------------------------------------------------

SELECT 'ME_GUSTA_PUBLICACION' AS fragmento, COUNT(*) AS filas FROM ME_GUSTA_PUBLICACION
UNION ALL SELECT 'ME_GUSTA_COMENTARIO   ', COUNT(*) FROM ME_GUSTA_COMENTARIO
UNION ALL SELECT 'ME_GUSTA_HISTORIA     ', COUNT(*) FROM ME_GUSTA_HISTORIA
UNION ALL SELECT 'HISTORIA_VISTA        ', COUNT(*) FROM HISTORIA_VISTA
UNION ALL SELECT 'NOTIFICACION          ', COUNT(*) FROM NOTIFICACION
UNION ALL SELECT 'MASCOTA (replicada)', COUNT(*) FROM MASCOTA
UNION ALL SELECT 'PUBLICACION (replicada)', COUNT(*) FROM PUBLICACION
;
