-- VALIDACION 7 - el nodo de respaldo NO acepta escrituras

USE pawspace;

SELECT @@server_id AS server_id, @@read_only AS solo_lectura,
       @@hostname AS nodo;

SELECT '--- intento de escritura: DEBE fallar con ERROR 1290 ---' AS nota;

INSERT INTO MASCOTA (id, nombre, nombre_usuario, especie_id)
VALUES (99, 'No', 'no', 1);
