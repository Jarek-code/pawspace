-- VALIDACION 3 - escritura por la tabla particionada y lectura cruzada

USE pawspace;

SELECT '--- antes ---' AS paso;
SELECT COUNT(*) AS filas FROM ME_GUSTA_PUBLICACION;

SELECT '--- se inserta sin decir el nodo: solo el dueno ---' AS paso;

-- mascota_id = 2 (PAR) tiene que acabar en dn_a.
-- publicacion_id = 5: una pareja (publicacion, mascota) que no existe, para no
-- chocar con UNIQUE(publicacion_id, mascota_id) y que se vea el reparto limpio.
INSERT INTO ME_GUSTA_PUBLICACION (id, mascota_id, publicacion_id) VALUES (9001, 2, 5);
-- mascota_id = 3 (IMPAR) tiene que acabar en dn_b.
INSERT INTO ME_GUSTA_PUBLICACION (id, mascota_id, publicacion_id) VALUES (9002, 3, 5);

SELECT '--- donde ha caido cada una (lo dice Spider, no la aplicacion) ---' AS paso;

SELECT id, mascota_id, 'dn_a' AS nodo FROM ME_GUSTA_PUBLICACION_NODO_A WHERE id IN (9001, 9002)
UNION ALL
SELECT id, mascota_id, 'dn_b' FROM ME_GUSTA_PUBLICACION_NODO_B WHERE id IN (9001, 9002)
ORDER BY id;

SELECT '--- lectura cruzada: preguntar por el nodo que NO la tiene ---' AS paso;

-- 9001 esta en dn_a; se pregunta por el envoltorio de dn_b y devuelve 0 filas,
-- que es la respuesta correcta. La ruta normal (la tabla particionada) si la
-- encuentra, porque Spider sabe a que particion ir.
SELECT COUNT(*) AS en_dn_b_por_error FROM ME_GUSTA_PUBLICACION_NODO_B WHERE id = 9001;

SELECT COUNT(*) AS en_dn_a_correcto FROM ME_GUSTA_PUBLICACION_NODO_A WHERE id = 9001;

SELECT COUNT(*) AS por_la_particionada FROM ME_GUSTA_PUBLICACION WHERE id IN (9001, 9002);

SELECT '--- y se ven en la vista global ---' AS paso;

SELECT id, mascota_id FROM ME_GUSTA_PUBLICACION_GLOBAL WHERE id IN (9001, 9002) ORDER BY id;

SELECT '--- borrado: tambien sin decir el nodo ---' AS paso;

DELETE FROM ME_GUSTA_PUBLICACION WHERE id IN (9001, 9002);

-- OJO: ROW_COUNT() devuelve 0 aunque el DELETE haya borrado de verdad las dos
SELECT ROW_COUNT() AS borradas_segun_row_count;

SELECT '--- despues: como estaba ---' AS paso;
SELECT COUNT(*) AS filas FROM ME_GUSTA_PUBLICACION;
