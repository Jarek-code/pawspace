-- NODO SPIDER - PROCEDIMIENTOS ALMACENADOS
-- GENERADO por devops/scripts/generar_sql.py -- no editar a mano

USE pawspace;

-- 1. FRAGMENTACION HORIZONTAL

DELIMITER //

-- ME_GUSTA_PUBLICACION   (dueno = mascota_id)
CREATE PROCEDURE sp_me_gusta_publicacion
(
    IN p_mascota_id BIGINT UNSIGNED,
    IN p_publicacion_id BIGINT UNSIGNED,
    OUT p_id BIGINT UNSIGNED
)
BEGIN
    -- No se dice a que nodo va: lo decide la particion.
    INSERT INTO ME_GUSTA_PUBLICACION (mascota_id, publicacion_id) VALUES (p_mascota_id, p_publicacion_id);
    SET p_id = LAST_INSERT_ID();
END;
//

-- ME_GUSTA_COMENTARIO   (dueno = mascota_id)
CREATE PROCEDURE sp_me_gusta_comentario
(
    IN p_mascota_id BIGINT UNSIGNED,
    IN p_comentario_id BIGINT UNSIGNED,
    OUT p_id BIGINT UNSIGNED
)
BEGIN
    -- No se dice a que nodo va: lo decide la particion.
    INSERT INTO ME_GUSTA_COMENTARIO (mascota_id, comentario_id) VALUES (p_mascota_id, p_comentario_id);
    SET p_id = LAST_INSERT_ID();
END;
//

-- ME_GUSTA_HISTORIA   (dueno = mascota_id)
CREATE PROCEDURE sp_me_gusta_historia
(
    IN p_mascota_id BIGINT UNSIGNED,
    IN p_historia_id BIGINT UNSIGNED,
    OUT p_id BIGINT UNSIGNED
)
BEGIN
    -- No se dice a que nodo va: lo decide la particion.
    INSERT INTO ME_GUSTA_HISTORIA (mascota_id, historia_id) VALUES (p_mascota_id, p_historia_id);
    SET p_id = LAST_INSERT_ID();
END;
//

-- HISTORIA_VISTA   (dueno = mascota_id)
CREATE PROCEDURE sp_historia_vista
(
    IN p_mascota_id BIGINT UNSIGNED,
    IN p_historia_id BIGINT UNSIGNED
)
BEGIN
    -- No se dice a que nodo va: lo decide la particion.
    INSERT INTO HISTORIA_VISTA (mascota_id, historia_id) VALUES (p_mascota_id, p_historia_id)
    ON DUPLICATE KEY UPDATE vista_en = NOW();
END;
//

-- NOTIFICACION   (dueno = destinatario_id)
CREATE PROCEDURE sp_notificacion
(
    IN p_destinatario_id BIGINT UNSIGNED,
    IN p_actor_id BIGINT UNSIGNED,
    IN p_tipo ENUM('SEGUIMIENTO', 'SOLICITUD_SEGUIMIENTO', 'LIKE_PUBLICACION', 'LIKE_COMENTARIO', 'LIKE_HISTORIA', 'COMENTARIO', 'RESPUESTA', 'MENCION', 'REPOST', 'MENSAJE'),
    IN p_publicacion_id BIGINT UNSIGNED,
    IN p_comentario_id BIGINT UNSIGNED,
    IN p_historia_id BIGINT UNSIGNED,
    OUT p_id BIGINT UNSIGNED
)
BEGIN
    -- No se dice a que nodo va: lo decide la particion.
    INSERT INTO NOTIFICACION (destinatario_id, actor_id, tipo, publicacion_id, comentario_id, historia_id) VALUES (p_destinatario_id, p_actor_id, p_tipo, p_publicacion_id, p_comentario_id, p_historia_id);
    SET p_id = LAST_INSERT_ID();
END;
//

DELIMITER ;

-- 2. FRAGMENTACION VERTICAL

DELIMITER //

-- USUARIO + USUARIO_CREDENCIALES   (contrasena_hash)
-- sensibilidad: el hash no debe viajar en cada listado de usuarios
CREATE PROCEDURE sp_usuario_crear
(
    IN p_nombre VARCHAR(255),
    IN p_email VARCHAR(320),
    IN p_contrasena_hash VARCHAR(255),
    OUT p_id BIGINT UNSIGNED
)
BEGIN
    -- Corte vertical: la fila vive en dos tablas y las dos escrituras
    -- van juntas. Se escribe en la tabla del dato y en su satelite.
    INSERT INTO USUARIO (nombre, email)
    VALUES (p_nombre, p_email);
    SET p_id = LAST_INSERT_ID();
    INSERT INTO USUARIO_CREDENCIALES (usuario_id, contrasena_hash)
    VALUES (p_id, p_contrasena_hash);
END;
//

-- MASCOTA + MASCOTA_PERFIL   (biografia, foto_perfil_url)
-- columnas frias, de tamano variable, que no se filtran ni se ordenan
CREATE PROCEDURE sp_mascota_crear
(
    IN p_nombre VARCHAR(100),
    IN p_nombre_usuario VARCHAR(50),
    IN p_especie_id SMALLINT UNSIGNED,
    IN p_biografia VARCHAR(1000),
    IN p_foto_perfil_url VARCHAR(2048),
    OUT p_id BIGINT UNSIGNED
)
BEGIN
    -- Corte vertical: la fila vive en dos tablas y las dos escrituras
    -- van juntas. Se escribe en la tabla del dato y en su satelite.
    INSERT INTO MASCOTA (nombre, nombre_usuario, especie_id)
    VALUES (p_nombre, p_nombre_usuario, p_especie_id);
    SET p_id = LAST_INSERT_ID();
    INSERT INTO MASCOTA_PERFIL (mascota_id, biografia, foto_perfil_url)
    VALUES (p_id, p_biografia, p_foto_perfil_url);
END;
//

-- PUBLICACION + PUBLICACION_TEXTO   (texto)
-- el TEXT del post: la fila caliente del feed deja de arrastrarlo
CREATE PROCEDURE sp_publicacion_crear
(
    IN p_mascota_id BIGINT UNSIGNED,
    IN p_texto TEXT,
    OUT p_id BIGINT UNSIGNED
)
BEGIN
    -- Corte vertical: la fila vive en dos tablas y las dos escrituras
    -- van juntas. Se escribe en la tabla del dato y en su satelite.
    INSERT INTO PUBLICACION (mascota_id)
    VALUES (p_mascota_id);
    SET p_id = LAST_INSERT_ID();
    INSERT INTO PUBLICACION_TEXTO (publicacion_id, texto)
    VALUES (p_id, p_texto);
END;
//

DELIMITER ;

-- 3. COMO SE USAN
