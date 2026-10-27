-- NODO dn_a - ESQUEMA REPLICADO (maestro de las tablas replicadas)
-- GENERADO por devops/scripts/generar_sql.py -- no editar a mano

--     USUARIO      -> USUARIO_CREDENCIALES  (contrasena_hash)
--       sensibilidad: el hash no debe viajar en cada listado de usuarios
--     MASCOTA      -> MASCOTA_PERFIL        (biografia, foto_perfil_url)
--       columnas frias, de tamano variable, que no se filtran ni se ordenan
--     PUBLICACION  -> PUBLICACION_TEXTO     (texto)
--       el TEXT del post: la fila caliente del feed deja de arrastrarlo
--

DROP DATABASE IF EXISTS pawspace;

CREATE DATABASE pawspace
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE pawspace;

-- USUARIO: sin contrasena_hash (viven en el satelite vertical)
CREATE TABLE USUARIO (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_usuario
        PRIMARY KEY (id),
    CONSTRAINT uq_usuario_email
        UNIQUE (email),
    INDEX idx_usuario_activo (activo),
    INDEX idx_usuario_creado_en (creado_en)
) ENGINE=InnoDB;;

CREATE TABLE ESPECIE (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT pk_especie
        PRIMARY KEY (id),
    CONSTRAINT uq_especie_nombre
        UNIQUE (nombre)
) ENGINE=InnoDB;;

CREATE TABLE RAZA (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    especie_id SMALLINT UNSIGNED NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT pk_raza
        PRIMARY KEY (id),
    CONSTRAINT uq_raza_especie_nombre
        UNIQUE (especie_id, nombre),
    CONSTRAINT fk_raza_especie
        FOREIGN KEY (especie_id)
        REFERENCES ESPECIE(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    INDEX idx_raza_especie_id (especie_id)
) ENGINE=InnoDB;;

-- MASCOTA: sin biografia, foto_perfil_url (viven en el satelite vertical)
CREATE TABLE MASCOTA (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    nombre_usuario VARCHAR(50) NOT NULL,
    especie_id SMALLINT UNSIGNED NOT NULL,
    raza_id INT UNSIGNED NULL,
    sexo CHAR(1) NULL,
    fecha_nacimiento DATE NULL,
    es_privada BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_mascota
        PRIMARY KEY (id),
    CONSTRAINT uq_mascota_nombre_usuario
        UNIQUE (nombre_usuario),
    CONSTRAINT fk_mascota_especie
        FOREIGN KEY (especie_id)
        REFERENCES ESPECIE(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_mascota_raza
        FOREIGN KEY (raza_id)
        REFERENCES RAZA(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_mascota_especie_id (especie_id),
    INDEX idx_mascota_raza_id (raza_id),
    INDEX idx_mascota_nombre (nombre),
    INDEX idx_mascota_privada (es_privada)
) ENGINE=InnoDB;;

CREATE TABLE USUARIO_MASCOTA (
    usuario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuario_mascota
        PRIMARY KEY (usuario_id, mascota_id),
    CONSTRAINT fk_um_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES USUARIO(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_um_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_um_mascota_usuario (mascota_id, usuario_id)
) ENGINE=InnoDB;;

CREATE TABLE SEGUIMIENTO (
    seguidor_id BIGINT UNSIGNED NOT NULL,
    seguido_id BIGINT UNSIGNED NOT NULL,
    estado ENUM(
        'PENDIENTE',
        'ACEPTADO',
        'RECHAZADO'
    ) NOT NULL DEFAULT 'PENDIENTE',
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_seguimiento
        PRIMARY KEY (seguidor_id, seguido_id),
    CONSTRAINT fk_seguimiento_seguidor
        FOREIGN KEY (seguidor_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_seguimiento_seguido
        FOREIGN KEY (seguido_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_seguimiento_seguido_estado
        (seguido_id, estado),
    INDEX idx_seguimiento_seguidor_estado
        (seguidor_id, estado)
) ENGINE=InnoDB;;

CREATE TABLE BLOQUEO (
    bloqueador_id BIGINT UNSIGNED NOT NULL,
    bloqueado_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_bloqueo
        PRIMARY KEY (bloqueador_id, bloqueado_id),
    CONSTRAINT fk_bloqueo_bloqueador
        FOREIGN KEY (bloqueador_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_bloqueo_bloqueado
        FOREIGN KEY (bloqueado_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_bloqueo_bloqueado
        (bloqueado_id)
) ENGINE=InnoDB;;

-- PUBLICACION: sin texto (viven en el satelite vertical)
CREATE TABLE PUBLICACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mascota_id BIGINT UNSIGNED NOT NULL,
    publicacion_origen_id BIGINT UNSIGNED NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    eliminado_en DATETIME NULL,
    CONSTRAINT pk_publicacion
        PRIMARY KEY (id),
    CONSTRAINT fk_publicacion_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_publicacion_origen
        FOREIGN KEY (publicacion_origen_id)
        REFERENCES PUBLICACION(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_publicacion_mascota_creado
        (mascota_id, creado_en),
    INDEX idx_publicacion_origen
        (publicacion_origen_id),
    INDEX idx_publicacion_creado
        (creado_en),
    INDEX idx_publicacion_eliminado
        (eliminado_en)
) ENGINE=InnoDB;;

CREATE TABLE PUBLICACION_ADJUNTO (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    publicacion_id BIGINT UNSIGNED NOT NULL,
    tipo ENUM(
        'IMAGEN',
        'VIDEO'
    ) NOT NULL,
    posicion SMALLINT UNSIGNED NOT NULL,
    archivo_url VARCHAR(2048) NOT NULL,
    duracion_seg INT UNSIGNED NULL,
    CONSTRAINT pk_publicacion_adjunto
        PRIMARY KEY (id),
    CONSTRAINT fk_pa_publicacion
        FOREIGN KEY (publicacion_id)
        REFERENCES PUBLICACION(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT uq_pa_posicion
        UNIQUE (publicacion_id, posicion),
    INDEX idx_pa_publicacion
        (publicacion_id)
) ENGINE=InnoDB;;

CREATE TABLE COMENTARIO (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    publicacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    comentario_padre_id BIGINT UNSIGNED NULL,
    texto TEXT NOT NULL,
    fijado_en DATETIME NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    eliminado_en DATETIME NULL,
    CONSTRAINT pk_comentario
        PRIMARY KEY (id),
    CONSTRAINT fk_comentario_publicacion
        FOREIGN KEY (publicacion_id)
        REFERENCES PUBLICACION(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_comentario_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_comentario_padre
        FOREIGN KEY (comentario_padre_id)
        REFERENCES COMENTARIO(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_comentario_publicacion_creado
        (publicacion_id, creado_en),
    INDEX idx_comentario_mascota
        (mascota_id),
    INDEX idx_comentario_padre
        (comentario_padre_id),
    INDEX idx_comentario_eliminado
        (eliminado_en)
) ENGINE=InnoDB;;

CREATE TABLE COMENTARIO_IMAGEN (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    comentario_id BIGINT UNSIGNED NOT NULL,
    posicion SMALLINT UNSIGNED NOT NULL,
    archivo_url VARCHAR(2048) NOT NULL,
    CONSTRAINT pk_comentario_imagen
        PRIMARY KEY (id),
    CONSTRAINT fk_ci_comentario
        FOREIGN KEY (comentario_id)
        REFERENCES COMENTARIO(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT uq_ci_posicion
        UNIQUE (comentario_id, posicion),
    INDEX idx_ci_comentario
        (comentario_id)
) ENGINE=InnoDB;;

CREATE TABLE HASHTAG (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    texto VARCHAR(255) NOT NULL,
    CONSTRAINT pk_hashtag
        PRIMARY KEY (id),
    CONSTRAINT uq_hashtag_texto
        UNIQUE (texto)
) ENGINE=InnoDB;;

CREATE TABLE PUBLICACION_HASHTAG (
    publicacion_id BIGINT UNSIGNED NOT NULL,
    hashtag_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT pk_publicacion_hashtag
        PRIMARY KEY (publicacion_id, hashtag_id),
    CONSTRAINT fk_ph_publicacion
        FOREIGN KEY (publicacion_id)
        REFERENCES PUBLICACION(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_ph_hashtag
        FOREIGN KEY (hashtag_id)
        REFERENCES HASHTAG(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_ph_hashtag
        (hashtag_id)
) ENGINE=InnoDB;;

CREATE TABLE COMENTARIO_HASHTAG (
    comentario_id BIGINT UNSIGNED NOT NULL,
    hashtag_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT pk_comentario_hashtag
        PRIMARY KEY (comentario_id, hashtag_id),
    CONSTRAINT fk_ch_comentario
        FOREIGN KEY (comentario_id)
        REFERENCES COMENTARIO(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_ch_hashtag
        FOREIGN KEY (hashtag_id)
        REFERENCES HASHTAG(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_ch_hashtag
        (hashtag_id)
) ENGINE=InnoDB;;

CREATE TABLE PUBLICACION_MENCION (
    publicacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT pk_publicacion_mencion
        PRIMARY KEY (publicacion_id, mascota_id),
    CONSTRAINT fk_pm_publicacion
        FOREIGN KEY (publicacion_id)
        REFERENCES PUBLICACION(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_pm_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_pm_mascota
        (mascota_id)
) ENGINE=InnoDB;;

CREATE TABLE COMENTARIO_MENCION (
    comentario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT pk_comentario_mencion
        PRIMARY KEY (comentario_id, mascota_id),
    CONSTRAINT fk_cm_comentario
        FOREIGN KEY (comentario_id)
        REFERENCES COMENTARIO(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_cm_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_cm_mascota
        (mascota_id)
) ENGINE=InnoDB;;

CREATE TABLE HASHTAG_SEGUIDOR (
    hashtag_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_hashtag_seguidor
        PRIMARY KEY (hashtag_id, mascota_id),
    CONSTRAINT fk_hs_hashtag
        FOREIGN KEY (hashtag_id)
        REFERENCES HASHTAG(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_hs_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_hs_mascota
        (mascota_id)
) ENGINE=InnoDB;;

CREATE TABLE PUBLICACION_GUARDADA (
    usuario_id BIGINT UNSIGNED NOT NULL,
    publicacion_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_publicacion_guardada
        PRIMARY KEY (usuario_id, publicacion_id),
    CONSTRAINT fk_pg_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES USUARIO(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_pg_publicacion
        FOREIGN KEY (publicacion_id)
        REFERENCES PUBLICACION(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_pg_publicacion
        (publicacion_id)
) ENGINE=InnoDB;;

CREATE TABLE HISTORIA (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vence_en DATETIME NOT NULL,
    CONSTRAINT pk_historia
        PRIMARY KEY (id),
    CONSTRAINT fk_historia_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_historia_mascota_creado
        (mascota_id, creado_en),
    INDEX idx_historia_vence
        (vence_en)
) ENGINE=InnoDB;;

CREATE TABLE HISTORIA_ADJUNTO (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    historia_id BIGINT UNSIGNED NOT NULL,
    tipo ENUM(
        'IMAGEN',
        'VIDEO'
    ) NOT NULL,
    posicion SMALLINT UNSIGNED NOT NULL,
    archivo_url VARCHAR(2048) NOT NULL,
    duracion_seg INT UNSIGNED NULL,
    CONSTRAINT pk_historia_adjunto
        PRIMARY KEY (id),
    CONSTRAINT fk_ha_historia
        FOREIGN KEY (historia_id)
        REFERENCES HISTORIA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT uq_ha_posicion
        UNIQUE (historia_id, posicion),
    INDEX idx_ha_historia
        (historia_id)
) ENGINE=InnoDB;;

CREATE TABLE CONVERSACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_conversacion
        PRIMARY KEY (id),
    INDEX idx_conversacion_creado
        (creado_en)
) ENGINE=InnoDB;;

CREATE TABLE CONVERSACION_PARTICIPANTE (
    conversacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_conversacion_participante
        PRIMARY KEY (conversacion_id, mascota_id),
    CONSTRAINT fk_cp_conversacion
        FOREIGN KEY (conversacion_id)
        REFERENCES CONVERSACION(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_cp_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_cp_mascota
        (mascota_id)
) ENGINE=InnoDB;;

CREATE TABLE MENSAJE (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    conversacion_id BIGINT UNSIGNED NOT NULL,
    remitente_id BIGINT UNSIGNED NOT NULL,
    texto TEXT NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    eliminado_en DATETIME NULL,
    CONSTRAINT pk_mensaje
        PRIMARY KEY (id),
    CONSTRAINT fk_mensaje_conversacion
        FOREIGN KEY (conversacion_id)
        REFERENCES CONVERSACION(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_mensaje_remitente
        FOREIGN KEY (remitente_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_mensaje_conversacion_creado
        (conversacion_id, creado_en),
    INDEX idx_mensaje_remitente
        (remitente_id),
    INDEX idx_mensaje_eliminado
        (eliminado_en)
) ENGINE=InnoDB;;

CREATE TABLE REPORTE (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reportado_por_mascota_id BIGINT UNSIGNED NOT NULL,
    categoria ENUM(
        'SPAM',
        'ACOSO',
        'CONTENIDO_INAPROPIADO',
        'VIOLENCIA',
        'SUPLANTACION',
        'DERECHOS_AUTOR',
        'OTRO'
    ) NOT NULL,
    publicacion_id BIGINT UNSIGNED NULL,
    comentario_id BIGINT UNSIGNED NULL,
    historia_id BIGINT UNSIGNED NULL,
    mensaje_id BIGINT UNSIGNED NULL,
    mascota_id BIGINT UNSIGNED NULL,
    detalle VARCHAR(2000) NULL,
    estado ENUM(
        'PENDIENTE',
        'EN_REVISION',
        'RESUELTO',
        'RECHAZADO'
    ) NOT NULL DEFAULT 'PENDIENTE',
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resuelto_en DATETIME NULL,
    CONSTRAINT pk_reporte
        PRIMARY KEY (id),
    CONSTRAINT fk_reporte_reportante
        FOREIGN KEY (reportado_por_mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_reporte_publicacion
        FOREIGN KEY (publicacion_id)
        REFERENCES PUBLICACION(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_reporte_comentario
        FOREIGN KEY (comentario_id)
        REFERENCES COMENTARIO(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_reporte_historia
        FOREIGN KEY (historia_id)
        REFERENCES HISTORIA(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_reporte_mensaje
        FOREIGN KEY (mensaje_id)
        REFERENCES MENSAJE(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_reporte_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_reporte_reportante
        (reportado_por_mascota_id),
    INDEX idx_reporte_estado_creado
        (estado, creado_en),
    INDEX idx_reporte_publicacion
        (publicacion_id),
    INDEX idx_reporte_comentario
        (comentario_id),
    INDEX idx_reporte_historia
        (historia_id),
    INDEX idx_reporte_mensaje
        (mensaje_id),
    INDEX idx_reporte_mascota
        (mascota_id)
) ENGINE=InnoDB;;

-- Satelite vertical: USUARIO_CREDENCIALES  <-  USUARIO(contrasena_hash)

CREATE TABLE USUARIO_CREDENCIALES (
    usuario_id BIGINT UNSIGNED NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    CONSTRAINT pk_usuario_credenciales
        PRIMARY KEY (usuario_id),
    CONSTRAINT fk_usuario_credenciales_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES USUARIO(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Satelite vertical: MASCOTA_PERFIL  <-  MASCOTA(biografia, foto_perfil_url)

CREATE TABLE MASCOTA_PERFIL (
    mascota_id BIGINT UNSIGNED NOT NULL,
    biografia VARCHAR(1000) NULL,
    foto_perfil_url VARCHAR(2048) NULL,
    CONSTRAINT pk_mascota_perfil
        PRIMARY KEY (mascota_id),
    CONSTRAINT fk_mascota_perfil_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Satelite vertical: PUBLICACION_TEXTO  <-  PUBLICACION(texto)

CREATE TABLE PUBLICACION_TEXTO (
    publicacion_id BIGINT UNSIGNED NOT NULL,
    texto TEXT NULL,
    CONSTRAINT pk_publicacion_texto
        PRIMARY KEY (publicacion_id),
    CONSTRAINT fk_publicacion_texto_publicacion
        FOREIGN KEY (publicacion_id)
        REFERENCES PUBLICACION(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Cola literal del schema.sql original

-- TRIGGERS

DELIMITER //

CREATE TRIGGER trg_seguimiento_no_auto_insert
BEFORE INSERT ON SEGUIMIENTO
FOR EACH ROW
BEGIN
    IF NEW.seguidor_id = NEW.seguido_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Una mascota no puede seguirse a si misma';
    END IF;
END//

CREATE TRIGGER trg_seguimiento_no_auto_update
BEFORE UPDATE ON SEGUIMIENTO
FOR EACH ROW
BEGIN
    IF NEW.seguidor_id = NEW.seguido_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Una mascota no puede seguirse a si misma';
    END IF;
END//

CREATE TRIGGER trg_bloqueo_no_auto_insert
BEFORE INSERT ON BLOQUEO
FOR EACH ROW
BEGIN
    IF NEW.bloqueador_id = NEW.bloqueado_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Una mascota no puede bloquearse a si misma';
    END IF;
END//

CREATE TRIGGER trg_bloqueo_no_auto_update
BEFORE UPDATE ON BLOQUEO
FOR EACH ROW
BEGIN
    IF NEW.bloqueador_id = NEW.bloqueado_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Una mascota no puede bloquearse a si misma';
    END IF;
END//

DELIMITER ;


-- USUARIO ADMINISTRADOR DE LA BD

DROP USER IF EXISTS 'admin'@'localhost';

CREATE USER 'admin'@'localhost'
    IDENTIFIED BY 'admin123';

GRANT ALL PRIVILEGES
    ON pawspace.*
    TO 'admin'@'localhost';

FLUSH PRIVILEGES;


-- VERIFICACION

USE pawspace;

SHOW TABLES;
