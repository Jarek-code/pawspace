-- ============================================================
-- PAWSPACE
-- Datos de ejemplo
-- ============================================================
-- Solo para desarrollo. No usar en producción.
-- Los valores de contrasena_hash son marcadores, NO hashes reales.
-- Se puede ejecutar varias veces sin duplicar filas (INSERT IGNORE).

USE pawspace;

-- ------------------------------------------------------------
-- ESPECIE
-- ------------------------------------------------------------

INSERT IGNORE INTO ESPECIE (id, nombre) VALUES
    (1, 'Perro'),
    (2, 'Gato'),
    (3, 'Conejo'),
    (4, 'Ave');

-- ------------------------------------------------------------
-- RAZA
-- ------------------------------------------------------------

INSERT IGNORE INTO RAZA (id, especie_id, nombre) VALUES
    (1, 1, 'Labrador Retriever'),
    (2, 1, 'Pastor Aleman'),
    (3, 1, 'Mestizo'),
    (4, 2, 'Siames'),
    (5, 2, 'Persa'),
    (6, 2, 'Comun Europeo'),
    (7, 3, 'Enano'),
    (8, 4, 'Periquito');

-- ------------------------------------------------------------
-- USUARIO
-- ------------------------------------------------------------

INSERT IGNORE INTO USUARIO (id, nombre, email, contrasena_hash) VALUES
    (1, 'Ana Garcia',  'ana@example.com',   'CAMBIA_ESTO_hash_de_prueba_1'),
    (2, 'Luis Perez',  'luis@example.com',  'CAMBIA_ESTO_hash_de_prueba_2'),
    (3, 'Marta Ruiz',  'marta@example.com', 'CAMBIA_ESTO_hash_de_prueba_3');

-- ------------------------------------------------------------
-- MASCOTA
-- ------------------------------------------------------------

INSERT IGNORE INTO MASCOTA
    (id, nombre, nombre_usuario, especie_id, raza_id, sexo, fecha_nacimiento, biografia)
VALUES
    (1, 'Rocky', 'rocky', 1, 1, 'M', '2021-05-10', 'Le encanta correr y nadar.'),
    (2, 'Michi', 'michi', 2, 4, 'F', '2022-03-02', 'Gata tranquila, muy dormilona.'),
    (3, 'Nube',  'nube',  3, 7, 'F', '2023-01-20', 'Coneja curiosa.'),
    (4, 'Kira',  'kira',  1, 2, 'F', '2020-11-15', 'Pastora alemana guardian.');

-- ------------------------------------------------------------
-- USUARIO_MASCOTA
-- ------------------------------------------------------------

INSERT IGNORE INTO USUARIO_MASCOTA (usuario_id, mascota_id) VALUES
    (1, 1),
    (1, 4),
    (2, 2),
    (3, 3);

-- ------------------------------------------------------------
-- COMPROBACION
-- ------------------------------------------------------------

SELECT 'ESPECIE' AS tabla, COUNT(*) AS filas FROM ESPECIE
UNION ALL SELECT 'RAZA',            COUNT(*) FROM RAZA
UNION ALL SELECT 'USUARIO',         COUNT(*) FROM USUARIO
UNION ALL SELECT 'MASCOTA',         COUNT(*) FROM MASCOTA
UNION ALL SELECT 'USUARIO_MASCOTA', COUNT(*) FROM USUARIO_MASCOTA;
