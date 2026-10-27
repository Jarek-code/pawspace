-- VALIDACION 2 - el disparador de paridad rechaza la fila mal colocada

USE pawspace;

SELECT '--- el reparto que ha hecho Spider, fila por fila ---' AS nota;

SELECT id, mascota_id,
       CASE MOD(mascota_id,2) WHEN 0 THEN 'dn_a (par)' ELSE 'dn_b (impar)' END AS nodo
  FROM ME_GUSTA_PUBLICACION
 ORDER BY mascota_id, id;

SELECT '--- ahora la fila mal colocada: mascota_id = 2 por el nodo de los impares ---' AS nota;

INSERT INTO ME_GUSTA_PUBLICACION_NODO_B (id, mascota_id, publicacion_id)
VALUES (9001, 2, 5);
