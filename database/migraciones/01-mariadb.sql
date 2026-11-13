-- PAWSPACE - MIGRACION 01 - ESQUEMA RELACIONAL
--
-- Se aplica sobre el nodo maestro (dn_a) de una base ya construida.
--
--     docker exec -i pawspace-dn-a mariadb -uroot -p"$DB_ROOT_PASSWORD" \
--         < database/migraciones/01-mariadb.sql
--
-- Despues hay que aplicar 02-distribucion.sql (fragmento del lado de dn_b y
-- envoltorios del nodo Spider) y 02b-usuarios.sql.
--
-- Los eventos de retencion que crea este archivo necesitan
-- event_scheduler=ON: MariaDB lo trae apagado por defecto.

USE pawspace;


-- AYUDAS DE MIGRACION

-- ALTER TABLE ... ADD CONSTRAINT IF NOT EXISTS no existe en MariaDB 11.4:
-- las claves ajenas que se agregan a tablas ya creadas pasan por aqui.
DROP PROCEDURE IF EXISTS sp_migracion_fk;

DELIMITER //

CREATE PROCEDURE sp_migracion_fk
(
    IN p_tabla VARCHAR(64),
    IN p_nombre VARCHAR(64),
    IN p_definicion TEXT
)
BEGIN
    IF (SELECT COUNT(*) FROM information_schema.table_constraints
         WHERE constraint_schema = DATABASE()
           AND table_name = p_tabla
           AND constraint_name = p_nombre) = 0 THEN
        SET @ddl = CONCAT('ALTER TABLE ', p_tabla,
                          ' ADD CONSTRAINT ', p_nombre, ' ', p_definicion);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DELIMITER ;


-- USUARIO

-- telefono, ubicacion_ciudad, ubicacion_pais, biografia y contrasena_hash no
-- estan en esta tabla: viven en USUARIO_PERFIL y USUARIO_CREDENCIALES.

ALTER TABLE USUARIO
    ADD COLUMN IF NOT EXISTS contrasena_actualizada_en DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP AFTER email,
    ADD COLUMN IF NOT EXISTS plan ENUM(
        'GRATUITO',
        'PREMIUM'
    ) NOT NULL DEFAULT 'GRATUITO' AFTER activo,
    ADD COLUMN IF NOT EXISTS eliminada_en DATETIME NULL AFTER plan;

CREATE INDEX IF NOT EXISTS idx_usuario_eliminada ON USUARIO (eliminada_en);


CREATE TABLE IF NOT EXISTS USUARIO_PERFIL (
    usuario_id BIGINT UNSIGNED NOT NULL,
    telefono VARCHAR(32) NULL,
    ubicacion_ciudad VARCHAR(100) NULL,
    ubicacion_pais VARCHAR(100) NULL,
    biografia VARCHAR(500) NULL,
    CONSTRAINT pk_usuario_perfil
        PRIMARY KEY (usuario_id),
    CONSTRAINT fk_usuario_perfil_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES USUARIO(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO USUARIO_PERFIL (usuario_id)
SELECT u.id
  FROM USUARIO u
 WHERE NOT EXISTS (SELECT 1 FROM USUARIO_PERFIL p WHERE p.usuario_id = u.id);


CREATE TABLE IF NOT EXISTS USUARIO_PREFERENCIAS (
    usuario_id BIGINT UNSIGNED NOT NULL,
    avisos_correo BOOLEAN NOT NULL DEFAULT TRUE,
    avisos_push BOOLEAN NOT NULL DEFAULT TRUE,
    avisos_tipos JSON NULL,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuario_preferencias
        PRIMARY KEY (usuario_id),
    CONSTRAINT fk_up_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES USUARIO(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO USUARIO_PREFERENCIAS (usuario_id)
SELECT u.id
  FROM USUARIO u
 WHERE NOT EXISTS (SELECT 1 FROM USUARIO_PREFERENCIAS p WHERE p.usuario_id = u.id);


-- MASCOTA

ALTER TABLE MASCOTA
    ADD COLUMN IF NOT EXISTS verificada BOOLEAN NOT NULL DEFAULT FALSE
        AFTER es_privada,
    ADD COLUMN IF NOT EXISTS verificada_en DATETIME NULL AFTER verificada,
    ADD COLUMN IF NOT EXISTS eliminada_en DATETIME NULL AFTER verificada_en;

CREATE INDEX IF NOT EXISTS idx_mascota_verificada ON MASCOTA (verificada);
CREATE INDEX IF NOT EXISTS idx_mascota_eliminada ON MASCOTA (eliminada_en);

-- Columnas del satelite MASCOTA_PERFIL: al satelite, no a la tabla caliente.
ALTER TABLE MASCOTA_PERFIL
    ADD COLUMN IF NOT EXISTS foto_portada_url VARCHAR(2048) NULL
        AFTER foto_perfil_url,
    ADD COLUMN IF NOT EXISTS sitio_web VARCHAR(255) NULL AFTER foto_portada_url,
    ADD COLUMN IF NOT EXISTS ubicacion_ciudad VARCHAR(100) NULL AFTER sitio_web,
    ADD COLUMN IF NOT EXISTS ubicacion_pais VARCHAR(100) NULL
        AFTER ubicacion_ciudad,
    ADD COLUMN IF NOT EXISTS latitud DECIMAL(9, 6) NULL AFTER ubicacion_pais,
    ADD COLUMN IF NOT EXISTS longitud DECIMAL(9, 6) NULL AFTER latitud;


CREATE TABLE IF NOT EXISTS MASCOTA_PREFERENCIAS (
    mascota_id BIGINT UNSIGNED NOT NULL,
    mostrar_ubicacion BOOLEAN NOT NULL DEFAULT FALSE,
    permitir_mensajes_desconocidos BOOLEAN NOT NULL DEFAULT FALSE,
    compartir_historias_seguidores BOOLEAN NOT NULL DEFAULT TRUE,
    permitir_descarga_historias BOOLEAN NOT NULL DEFAULT FALSE,
    filtro_comentarios_ofensivos BOOLEAN NOT NULL DEFAULT FALSE,
    filtro_cuentas_sin_foto BOOLEAN NOT NULL DEFAULT FALSE,
    filtro_palabras JSON NULL,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_mascota_preferencias
        PRIMARY KEY (mascota_id),
    CONSTRAINT fk_mp_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO MASCOTA_PREFERENCIAS (mascota_id)
SELECT m.id
  FROM MASCOTA m
 WHERE NOT EXISTS (SELECT 1 FROM MASCOTA_PREFERENCIAS p WHERE p.mascota_id = m.id);


-- SESION

CREATE TABLE IF NOT EXISTS SESION (
    id VARCHAR(64) NOT NULL,
    usuario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NULL,
    dispositivo VARCHAR(120) NULL,
    plataforma VARCHAR(60) NULL,
    ubicacion_ciudad VARCHAR(100) NULL,
    ubicacion_pais VARCHAR(100) NULL,
    iniciada_en DATETIME NOT NULL,
    ultima_actividad_en DATETIME NOT NULL,
    expira_en DATETIME NOT NULL,
    cerrada_en DATETIME NULL,
    cerrada_por ENUM(
        'USUARIO',
        'TODAS',
        'CONTRASENA',
        'EXPIRADA',
        'CUENTA_ELIMINADA'
    ) NULL,
    CONSTRAINT pk_sesion
        PRIMARY KEY (id),
    CONSTRAINT fk_sesion_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES USUARIO(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_sesion_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_sesion_usuario_abierta
        (usuario_id, cerrada_en),
    INDEX idx_sesion_mascota_abierta
        (mascota_id, cerrada_en),
    INDEX idx_sesion_expira
        (expira_en),
    INDEX idx_sesion_ultima_actividad
        (ultima_actividad_en)
) ENGINE=InnoDB;


-- HISTORIA

ALTER TABLE HISTORIA
    ADD COLUMN IF NOT EXISTS texto VARCHAR(500) NULL AFTER mascota_id,
    ADD COLUMN IF NOT EXISTS audiencia ENUM(
        'PUBLICO',
        'SEGUIDORES',
        'SOLO_YO'
    ) NOT NULL DEFAULT 'PUBLICO' AFTER texto,
    ADD COLUMN IF NOT EXISTS permite_respuestas BOOLEAN NOT NULL DEFAULT TRUE
        AFTER audiencia,
    ADD COLUMN IF NOT EXISTS eliminada_en DATETIME NULL AFTER vence_en;

CREATE INDEX IF NOT EXISTS idx_historia_eliminada ON HISTORIA (eliminada_en);


CREATE TABLE IF NOT EXISTS HISTORIA_DESTACADA (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mascota_id BIGINT UNSIGNED NOT NULL,
    titulo VARCHAR(60) NOT NULL,
    portada_historia_id BIGINT UNSIGNED NULL,
    orden SMALLINT NOT NULL DEFAULT 0,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_historia_destacada
        PRIMARY KEY (id),
    CONSTRAINT fk_hd_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_hd_portada
        FOREIGN KEY (portada_historia_id)
        REFERENCES HISTORIA(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_hd_mascota_orden
        (mascota_id, orden)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS HISTORIA_DESTACADA_ELEMENTO (
    destacada_id BIGINT UNSIGNED NOT NULL,
    historia_id BIGINT UNSIGNED NOT NULL,
    posicion SMALLINT NOT NULL DEFAULT 0,
    agregada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_historia_destacada_elemento
        PRIMARY KEY (destacada_id, historia_id),
    CONSTRAINT fk_hde_destacada
        FOREIGN KEY (destacada_id)
        REFERENCES HISTORIA_DESTACADA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_hde_historia
        FOREIGN KEY (historia_id)
        REFERENCES HISTORIA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_hde_historia
        (historia_id)
) ENGINE=InnoDB;


-- CONVERSACION

ALTER TABLE CONVERSACION
    ADD COLUMN IF NOT EXISTS solicitante_id BIGINT UNSIGNED NULL AFTER id,
    ADD COLUMN IF NOT EXISTS estado ENUM(
        'SOLICITUD',
        'ACTIVA',
        'IGNORADA'
    ) NOT NULL DEFAULT 'ACTIVA' AFTER solicitante_id,
    ADD COLUMN IF NOT EXISTS ultimo_mensaje_en DATETIME NULL AFTER estado;

CREATE INDEX IF NOT EXISTS idx_conversacion_bandeja
    ON CONVERSACION (estado, ultimo_mensaje_en);

CALL sp_migracion_fk('CONVERSACION', 'fk_conversacion_solicitante',
    'FOREIGN KEY (solicitante_id) REFERENCES MASCOTA(id)
     ON UPDATE CASCADE ON DELETE SET NULL');


ALTER TABLE CONVERSACION_PARTICIPANTE
    -- Puntero de lectura sin clave ajena: MENSAJE es la tabla siguiente y el
    -- puntero se escribe en la misma transaccion que la lectura.
    ADD COLUMN IF NOT EXISTS leido_hasta_mensaje_id BIGINT UNSIGNED NULL
        AFTER mascota_id,
    ADD COLUMN IF NOT EXISTS leido_en DATETIME NULL AFTER leido_hasta_mensaje_id,
    ADD COLUMN IF NOT EXISTS silenciada_hasta DATETIME NULL AFTER leido_en,
    ADD COLUMN IF NOT EXISTS silenciada_en DATETIME NULL AFTER silenciada_hasta,
    ADD COLUMN IF NOT EXISTS nota VARCHAR(500) NULL AFTER silenciada_en;


-- MENSAJE

ALTER TABLE MENSAJE
    ADD COLUMN IF NOT EXISTS historia_id BIGINT UNSIGNED NULL AFTER remitente_id,
    ADD COLUMN IF NOT EXISTS clave_cliente CHAR(36) NULL AFTER historia_id;

CREATE INDEX IF NOT EXISTS idx_mensaje_historia ON MENSAJE (historia_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_mensaje_clave_cliente
    ON MENSAJE (conversacion_id, remitente_id, clave_cliente);

CALL sp_migracion_fk('MENSAJE', 'fk_mensaje_historia',
    'FOREIGN KEY (historia_id) REFERENCES HISTORIA(id)
     ON UPDATE CASCADE ON DELETE SET NULL');


-- El fragmento del mensaje leido. La clave ya incluye a la duena del
-- fragmento, que es lo que exige la particion por hash.
CREATE TABLE IF NOT EXISTS MENSAJE_LECTURA (
    mensaje_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    leido_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_mensaje_lectura
        PRIMARY KEY (mensaje_id, mascota_id),
    CONSTRAINT fk_ml_mensaje
        FOREIGN KEY (mensaje_id)
        REFERENCES MENSAJE(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_ml_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_ml_mascota
        (mascota_id),
    INDEX idx_ml_mensaje_leido
        (mensaje_id, leido_en)
) ENGINE=InnoDB;


-- REPORTE

ALTER TABLE REPORTE
    ADD COLUMN IF NOT EXISTS resolucion VARCHAR(1000) NULL AFTER estado,
    ADD COLUMN IF NOT EXISTS archivado_en DATETIME NULL AFTER resuelto_en;

CREATE INDEX IF NOT EXISTS idx_reporte_reportante_archivado
    ON REPORTE (reportado_por_mascota_id, archivado_en);


CREATE TABLE IF NOT EXISTS REPORTE_APELACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reporte_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    motivo VARCHAR(2000) NOT NULL,
    estado ENUM(
        'PENDIENTE',
        'ACEPTADA',
        'RECHAZADA'
    ) NOT NULL DEFAULT 'PENDIENTE',
    resolucion VARCHAR(1000) NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resuelto_en DATETIME NULL,
    CONSTRAINT pk_reporte_apelacion
        PRIMARY KEY (id),
    CONSTRAINT uq_ra_una_por_reporte
        UNIQUE (reporte_id),
    CONSTRAINT fk_ra_reporte
        FOREIGN KEY (reporte_id)
        REFERENCES REPORTE(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_ra_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_ra_mascota
        (mascota_id),
    INDEX idx_ra_estado
        (estado, creado_en)
) ENGINE=InnoDB;


-- NOTIFICACION

-- La tabla esta fragmentada por destinatario_id: este ALTER cubre la mitad de
-- dn_a, y 02-distribucion.sql repite lo mismo en dn_b y en el nodo Spider.
ALTER TABLE NOTIFICACION
    MODIFY COLUMN tipo ENUM(
        'SEGUIMIENTO',
        'SOLICITUD_SEGUIMIENTO',
        'LIKE_PUBLICACION',
        'LIKE_COMENTARIO',
        'LIKE_HISTORIA',
        'COMENTARIO',
        'RESPUESTA',
        'MENCION',
        'REPOST',
        'MENSAJE',
        'RESPUESTA_HISTORIA',
        'APELACION',
        'SOPORTE'
    ) NOT NULL,
    ADD COLUMN IF NOT EXISTS conversacion_id BIGINT UNSIGNED NULL
        AFTER historia_id,
    ADD COLUMN IF NOT EXISTS mensaje_id BIGINT UNSIGNED NULL
        AFTER conversacion_id;

CREATE INDEX IF NOT EXISTS idx_notificacion_conversacion
    ON NOTIFICACION (conversacion_id);

CREATE INDEX IF NOT EXISTS idx_notificacion_mensaje
    ON NOTIFICACION (mensaje_id);

CALL sp_migracion_fk('NOTIFICACION', 'fk_notificacion_conversacion',
    'FOREIGN KEY (conversacion_id) REFERENCES CONVERSACION(id)
     ON UPDATE CASCADE ON DELETE SET NULL');

CALL sp_migracion_fk('NOTIFICACION', 'fk_notificacion_mensaje',
    'FOREIGN KEY (mensaje_id) REFERENCES MENSAJE(id)
     ON UPDATE CASCADE ON DELETE SET NULL');


-- TICKET_SOPORTE

CREATE TABLE IF NOT EXISTS TICKET_SOPORTE (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NULL,
    tema ENUM(
        'CUENTA',
        'PRIVACIDAD',
        'MENSAJES',
        'REPORTES',
        'HISTORIAS',
        'OTRO'
    ) NOT NULL,
    correo_contacto VARCHAR(320) NOT NULL,
    asunto VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    estado ENUM(
        'ABIERTA',
        'EN_REVISION',
        'ESPERANDO_USUARIO',
        'RESUELTA',
        'CERRADA'
    ) NOT NULL DEFAULT 'ABIERTA',
    privacidad_aceptada_en DATETIME NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    cerrada_en DATETIME NULL,
    CONSTRAINT pk_ticket_soporte
        PRIMARY KEY (id),
    CONSTRAINT fk_ts_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES USUARIO(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_ts_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_ts_usuario_creado
        (usuario_id, creado_en),
    INDEX idx_ts_estado_creado
        (estado, creado_en)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS TICKET_MENSAJE (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ticket_id BIGINT UNSIGNED NOT NULL,
    autor_tipo ENUM(
        'USUARIO',
        'SOPORTE'
    ) NOT NULL,
    autor_usuario_id BIGINT UNSIGNED NULL,
    texto TEXT NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_ticket_mensaje
        PRIMARY KEY (id),
    CONSTRAINT fk_tm_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES TICKET_SOPORTE(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_tm_autor
        FOREIGN KEY (autor_usuario_id)
        REFERENCES USUARIO(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_tm_ticket_creado
        (ticket_id, creado_en)
) ENGINE=InnoDB;


-- AYUDA_CATEGORIA

CREATE TABLE IF NOT EXISTS AYUDA_CATEGORIA (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug VARCHAR(60) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion VARCHAR(255) NULL,
    orden SMALLINT NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_ayuda_categoria
        PRIMARY KEY (id),
    CONSTRAINT uq_ayuda_categoria_slug
        UNIQUE (slug)
) ENGINE=InnoDB;


-- AYUDA_ARTICULO

-- El indice FULLTEXT vive solo en este nodo: los envoltorios de Spider llevan
-- columnas y clave primaria, asi que la busqueda se consulta aqui.
CREATE TABLE IF NOT EXISTS AYUDA_ARTICULO (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    categoria_id SMALLINT UNSIGNED NOT NULL,
    slug VARCHAR(120) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    resumen VARCHAR(500) NULL,
    contenido MEDIUMTEXT NOT NULL,
    minutos_lectura SMALLINT NOT NULL DEFAULT 1,
    estado ENUM(
        'BORRADOR',
        'PUBLICADO',
        'RETIRADO'
    ) NOT NULL DEFAULT 'BORRADOR',
    publicado_en DATETIME NULL,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    orden SMALLINT NOT NULL DEFAULT 0,
    CONSTRAINT pk_ayuda_articulo
        PRIMARY KEY (id),
    CONSTRAINT uq_ayuda_articulo_slug
        UNIQUE (slug),
    CONSTRAINT fk_aa_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES AYUDA_CATEGORIA(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    INDEX idx_aa_categoria_estado
        (categoria_id, estado, orden),
    FULLTEXT idx_aa_busqueda
        (titulo, resumen, contenido)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS AYUDA_ARTICULO_UTIL (
    articulo_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    util BOOLEAN NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_ayuda_articulo_util
        PRIMARY KEY (articulo_id, mascota_id),
    CONSTRAINT fk_aau_articulo
        FOREIGN KEY (articulo_id)
        REFERENCES AYUDA_ARTICULO(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_aau_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;


INSERT INTO AYUDA_CATEGORIA (slug, nombre, descripcion, orden) VALUES
    ('cuenta', 'Cuenta y acceso', 'Correo, contrasena, sesiones y verificación.', 1),
    ('privacidad', 'Privacidad y seguridad', 'Permisos, bloqueos y control de datos.', 2),
    ('mensajeria', 'Mensajeria', 'Conversaciones, solicitudes y adjuntos.', 3),
    ('reportes', 'Reportes y moderacion', 'Como reportar, apelar y entender decisiones.', 4),
    ('historias', 'Historias', 'Publicar, archivar y destacar historias.', 5)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion),
    orden = VALUES(orden);


-- RETENCION

-- Las dos marcas de archivo. Despues, y fuera de la base, la revision de la
-- OODB libera los archivos de las historias marcadas.

CREATE EVENT IF NOT EXISTS ev_historia_archivo
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP + INTERVAL 1 HOUR
DO
    UPDATE HISTORIA h
       SET h.eliminada_en = NOW()
     WHERE h.eliminada_en IS NULL
       AND h.vence_en < NOW() - INTERVAL 30 DAY
       AND NOT EXISTS (SELECT 1
                         FROM HISTORIA_DESTACADA_ELEMENTO e
                        WHERE e.historia_id = h.id);

CREATE EVENT IF NOT EXISTS ev_reporte_archivo
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP + INTERVAL 2 HOUR
DO
    UPDATE REPORTE r
       SET r.archivado_en = NOW()
     WHERE r.archivado_en IS NULL
       AND r.resuelto_en IS NOT NULL
       AND r.resuelto_en < NOW() - INTERVAL 90 DAY;


DROP PROCEDURE IF EXISTS sp_migracion_fk;


-- COMPROBACION

SELECT table_name AS tabla
  FROM information_schema.tables
 WHERE table_schema = DATABASE()
   AND table_name IN ('USUARIO_PERFIL', 'USUARIO_PREFERENCIAS',
                      'MASCOTA_PREFERENCIAS', 'SESION', 'MENSAJE_LECTURA',
                      'HISTORIA_DESTACADA', 'HISTORIA_DESTACADA_ELEMENTO',
                      'REPORTE_APELACION', 'TICKET_SOPORTE', 'TICKET_MENSAJE',
                      'AYUDA_CATEGORIA', 'AYUDA_ARTICULO', 'AYUDA_ARTICULO_UTIL')
 ORDER BY table_name;
