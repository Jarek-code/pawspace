-- VALIDACION 6 - escritura en el fragmento de dn_b

USE pawspace;

SELECT '--- escritura en el fragmento de dn_b (dueno impar, id 8002) ---' AS paso;

INSERT INTO ME_GUSTA_PUBLICACION (id, mascota_id, publicacion_id) VALUES (8002, 3, 6);

SELECT id, mascota_id, publicacion_id FROM ME_GUSTA_PUBLICACION WHERE id = 8002;

SELECT '--- lo que tiene dn_b justo despues de escribir ---' AS paso;

SELECT (SELECT COUNT(*) FROM MASCOTA WHERE id = 9) AS mascota_9_que_llego_por_replicacion,
       (SELECT COUNT(*) FROM ME_GUSTA_PUBLICACION WHERE id = 8002) AS like_8002;
