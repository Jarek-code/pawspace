-- NODO SPIDER - FRAGMENTACION HORIZONTAL
-- GENERADO por devops/scripts/generar_sql.py -- no editar a mano

USE pawspace;

-- ME_GUSTA_PUBLICACION   (dueno = mascota_id)

-- 1) La tabla de uso normal: particionada por la paridad del dueno.
--    p0 = MOD(mascota_id,2)=0 -> dn_a    p1 = MOD(mascota_id,2)=1 -> dn_b
CREATE TABLE ME_GUSTA_PUBLICACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    publicacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_me_gusta_publicacion
        PRIMARY KEY (id, mascota_id),
    CONSTRAINT uq_mgp_publicacion_mascota
        UNIQUE (publicacion_id, mascota_id),
    INDEX idx_mgp_publicacion
        (publicacion_id),
    INDEX idx_mgp_mascota
        (mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", table "ME_GUSTA_PUBLICACION"'
PARTITION BY HASH (mascota_id)
(
    PARTITION p0 COMMENT = 'srv "dn_a", table "ME_GUSTA_PUBLICACION"',
    PARTITION p1 COMMENT = 'srv "dn_b", table "ME_GUSTA_PUBLICACION"'
);

-- 2) Solo la mitad de dn_a.
CREATE TABLE ME_GUSTA_PUBLICACION_NODO_A (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    publicacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a", table "ME_GUSTA_PUBLICACION"';

-- 2) Solo la mitad de dn_b.
CREATE TABLE ME_GUSTA_PUBLICACION_NODO_B (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    publicacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_b", table "ME_GUSTA_PUBLICACION"';

-- 3) La tabla original reconstruida.
CREATE OR REPLACE VIEW ME_GUSTA_PUBLICACION_GLOBAL AS
SELECT id, publicacion_id, mascota_id, creado_en FROM ME_GUSTA_PUBLICACION_NODO_A
UNION ALL
SELECT id, publicacion_id, mascota_id, creado_en FROM ME_GUSTA_PUBLICACION_NODO_B;

-- ME_GUSTA_COMENTARIO   (dueno = mascota_id)

-- 1) La tabla de uso normal: particionada por la paridad del dueno.
--    p0 = MOD(mascota_id,2)=0 -> dn_a    p1 = MOD(mascota_id,2)=1 -> dn_b
CREATE TABLE ME_GUSTA_COMENTARIO (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    comentario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_me_gusta_comentario
        PRIMARY KEY (id, mascota_id),
    CONSTRAINT uq_mgc_comentario_mascota
        UNIQUE (comentario_id, mascota_id),
    INDEX idx_mgc_comentario
        (comentario_id),
    INDEX idx_mgc_mascota
        (mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", table "ME_GUSTA_COMENTARIO"'
PARTITION BY HASH (mascota_id)
(
    PARTITION p0 COMMENT = 'srv "dn_a", table "ME_GUSTA_COMENTARIO"',
    PARTITION p1 COMMENT = 'srv "dn_b", table "ME_GUSTA_COMENTARIO"'
);

-- 2) Solo la mitad de dn_a.
CREATE TABLE ME_GUSTA_COMENTARIO_NODO_A (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    comentario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a", table "ME_GUSTA_COMENTARIO"';

-- 2) Solo la mitad de dn_b.
CREATE TABLE ME_GUSTA_COMENTARIO_NODO_B (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    comentario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_b", table "ME_GUSTA_COMENTARIO"';

-- 3) La tabla original reconstruida.
CREATE OR REPLACE VIEW ME_GUSTA_COMENTARIO_GLOBAL AS
SELECT id, comentario_id, mascota_id, creado_en FROM ME_GUSTA_COMENTARIO_NODO_A
UNION ALL
SELECT id, comentario_id, mascota_id, creado_en FROM ME_GUSTA_COMENTARIO_NODO_B;

-- ME_GUSTA_HISTORIA   (dueno = mascota_id)

-- 1) La tabla de uso normal: particionada por la paridad del dueno.
--    p0 = MOD(mascota_id,2)=0 -> dn_a    p1 = MOD(mascota_id,2)=1 -> dn_b
CREATE TABLE ME_GUSTA_HISTORIA (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    historia_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_me_gusta_historia
        PRIMARY KEY (id, mascota_id),
    CONSTRAINT uq_mgh_historia_mascota
        UNIQUE (historia_id, mascota_id),
    INDEX idx_mgh_historia
        (historia_id),
    INDEX idx_mgh_mascota
        (mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", table "ME_GUSTA_HISTORIA"'
PARTITION BY HASH (mascota_id)
(
    PARTITION p0 COMMENT = 'srv "dn_a", table "ME_GUSTA_HISTORIA"',
    PARTITION p1 COMMENT = 'srv "dn_b", table "ME_GUSTA_HISTORIA"'
);

-- 2) Solo la mitad de dn_a.
CREATE TABLE ME_GUSTA_HISTORIA_NODO_A (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    historia_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a", table "ME_GUSTA_HISTORIA"';

-- 2) Solo la mitad de dn_b.
CREATE TABLE ME_GUSTA_HISTORIA_NODO_B (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    historia_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_b", table "ME_GUSTA_HISTORIA"';

-- 3) La tabla original reconstruida.
CREATE OR REPLACE VIEW ME_GUSTA_HISTORIA_GLOBAL AS
SELECT id, historia_id, mascota_id, creado_en FROM ME_GUSTA_HISTORIA_NODO_A
UNION ALL
SELECT id, historia_id, mascota_id, creado_en FROM ME_GUSTA_HISTORIA_NODO_B;

-- HISTORIA_VISTA   (dueno = mascota_id)

-- 1) La tabla de uso normal: particionada por la paridad del dueno.
--    p0 = MOD(mascota_id,2)=0 -> dn_a    p1 = MOD(mascota_id,2)=1 -> dn_b
CREATE TABLE HISTORIA_VISTA (
    historia_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    vista_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_historia_vista
        PRIMARY KEY (historia_id, mascota_id),
    INDEX idx_hv_mascota
        (mascota_id),
    INDEX idx_hv_historia_vista
        (historia_id, vista_en)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", table "HISTORIA_VISTA"'
PARTITION BY HASH (mascota_id)
(
    PARTITION p0 COMMENT = 'srv "dn_a", table "HISTORIA_VISTA"',
    PARTITION p1 COMMENT = 'srv "dn_b", table "HISTORIA_VISTA"'
);

-- 2) Solo la mitad de dn_a.
CREATE TABLE HISTORIA_VISTA_NODO_A (
    historia_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    vista_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (historia_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a", table "HISTORIA_VISTA"';

-- 2) Solo la mitad de dn_b.
CREATE TABLE HISTORIA_VISTA_NODO_B (
    historia_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    vista_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (historia_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_b", table "HISTORIA_VISTA"';

-- 3) La tabla original reconstruida.
CREATE OR REPLACE VIEW HISTORIA_VISTA_GLOBAL AS
SELECT historia_id, mascota_id, vista_en FROM HISTORIA_VISTA_NODO_A
UNION ALL
SELECT historia_id, mascota_id, vista_en FROM HISTORIA_VISTA_NODO_B;

-- NOTIFICACION   (dueno = destinatario_id)

-- 1) La tabla de uso normal: particionada por la paridad del dueno.
--    p0 = MOD(destinatario_id,2)=0 -> dn_a    p1 = MOD(destinatario_id,2)=1 -> dn_b
CREATE TABLE NOTIFICACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    destinatario_id BIGINT UNSIGNED NOT NULL,
    actor_id BIGINT UNSIGNED NULL,
    tipo ENUM(
        'SEGUIMIENTO',
        'SOLICITUD_SEGUIMIENTO',
        'LIKE_PUBLICACION',
        'LIKE_COMENTARIO',
        'LIKE_HISTORIA',
        'COMENTARIO',
        'RESPUESTA',
        'MENCION',
        'REPOST',
        'MENSAJE'
    ) NOT NULL,
    publicacion_id BIGINT UNSIGNED NULL,
    comentario_id BIGINT UNSIGNED NULL,
    historia_id BIGINT UNSIGNED NULL,
    leida_en DATETIME NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_notificacion
        PRIMARY KEY (id, destinatario_id),
    INDEX idx_notificacion_destinatario_creado
        (destinatario_id, creado_en),
    INDEX idx_notificacion_no_leida
        (destinatario_id, leida_en),
    INDEX idx_notificacion_actor
        (actor_id),
    INDEX idx_notificacion_publicacion
        (publicacion_id),
    INDEX idx_notificacion_comentario
        (comentario_id),
    INDEX idx_notificacion_historia
        (historia_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", table "NOTIFICACION"'
PARTITION BY HASH (destinatario_id)
(
    PARTITION p0 COMMENT = 'srv "dn_a", table "NOTIFICACION"',
    PARTITION p1 COMMENT = 'srv "dn_b", table "NOTIFICACION"'
);

-- 2) Solo la mitad de dn_a.
CREATE TABLE NOTIFICACION_NODO_A (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    destinatario_id BIGINT UNSIGNED NOT NULL,
    actor_id BIGINT UNSIGNED NULL,
    tipo ENUM(
        'SEGUIMIENTO',
        'SOLICITUD_SEGUIMIENTO',
        'LIKE_PUBLICACION',
        'LIKE_COMENTARIO',
        'LIKE_HISTORIA',
        'COMENTARIO',
        'RESPUESTA',
        'MENCION',
        'REPOST',
        'MENSAJE'
    ) NOT NULL,
    publicacion_id BIGINT UNSIGNED NULL,
    comentario_id BIGINT UNSIGNED NULL,
    historia_id BIGINT UNSIGNED NULL,
    leida_en DATETIME NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, destinatario_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a", table "NOTIFICACION"';

-- 2) Solo la mitad de dn_b.
CREATE TABLE NOTIFICACION_NODO_B (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    destinatario_id BIGINT UNSIGNED NOT NULL,
    actor_id BIGINT UNSIGNED NULL,
    tipo ENUM(
        'SEGUIMIENTO',
        'SOLICITUD_SEGUIMIENTO',
        'LIKE_PUBLICACION',
        'LIKE_COMENTARIO',
        'LIKE_HISTORIA',
        'COMENTARIO',
        'RESPUESTA',
        'MENCION',
        'REPOST',
        'MENSAJE'
    ) NOT NULL,
    publicacion_id BIGINT UNSIGNED NULL,
    comentario_id BIGINT UNSIGNED NULL,
    historia_id BIGINT UNSIGNED NULL,
    leida_en DATETIME NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, destinatario_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_b", table "NOTIFICACION"';

-- 3) La tabla original reconstruida.
CREATE OR REPLACE VIEW NOTIFICACION_GLOBAL AS
SELECT id, destinatario_id, actor_id, tipo, publicacion_id, comentario_id, historia_id, leida_en, creado_en FROM NOTIFICACION_NODO_A
UNION ALL
SELECT id, destinatario_id, actor_id, tipo, publicacion_id, comentario_id, historia_id, leida_en, creado_en FROM NOTIFICACION_NODO_B;
