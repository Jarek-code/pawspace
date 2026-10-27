-- VALIDACION 5 - la replicacion se mantiene VIVA al escribir

USE pawspace;

SELECT '--- (a) escritura en una tabla REPLICADA, en el maestro dn_a ---' AS paso;

INSERT INTO MASCOTA (id, nombre, nombre_usuario, especie_id, raza_id, sexo, fecha_nacimiento)
VALUES (9, 'Prueba', 'prueba', 1, 1, 'M', '2024-01-01');

-- El corte vertical obliga a escribir tambien en el satelite.
INSERT INTO MASCOTA_PERFIL (mascota_id, biografia, foto_perfil_url)
VALUES (9, 'Insertada en dn_a para probar la replicacion.', '/img/prueba.jpg');

-- Aqui no vale consultar vMASCOTA: las vistas del corte vertical las crea
-- 03-vertical.sql y viven en el nodo spider, no en el nodo de datos. En dn_a se
-- lee el padre y el satelite, que es donde esta de verdad la columna.
SELECT m.id, m.nombre, m.nombre_usuario, p.biografia
  FROM MASCOTA m
  JOIN MASCOTA_PERFIL p ON p.mascota_id = m.id
 WHERE m.id = 9;

SELECT '--- (b) escritura en SU fragmento (dueno par, id 8001) ---' AS paso;

INSERT INTO ME_GUSTA_PUBLICACION (id, mascota_id, publicacion_id) VALUES (8001, 2, 6);

SELECT id, mascota_id, publicacion_id FROM ME_GUSTA_PUBLICACION WHERE id = 8001;

SELECT '--- lo que tiene dn_a justo despues de escribir ---' AS paso;

SELECT (SELECT COUNT(*) FROM MASCOTA WHERE id = 9) AS mascota_9,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION WHERE id = 8001) AS like_8001;
