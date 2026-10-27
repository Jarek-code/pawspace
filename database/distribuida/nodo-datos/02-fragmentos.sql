-- NODOS DE DATOS (dn_a y dn_b) - FRAGMENTOS HORIZONTALES
-- GENERADO por devops/scripts/generar_sql.py -- no editar a mano

USE pawspace;

-- ME_GUSTA_PUBLICACION   dueno = mascota_id
--   PRIMARY KEY (id)  ->  PRIMARY KEY (id, mascota_id)
-- ---------------------------------------------------------------------------

CREATE TABLE ME_GUSTA_PUBLICACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    publicacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_me_gusta_publicacion
        PRIMARY KEY (id, mascota_id),
    CONSTRAINT uq_mgp_publicacion_mascota
        UNIQUE (publicacion_id, mascota_id),
    CONSTRAINT fk_mgp_publicacion
        FOREIGN KEY (publicacion_id)
        REFERENCES PUBLICACION(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_mgp_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_mgp_publicacion
        (publicacion_id),
    INDEX idx_mgp_mascota
        (mascota_id)
) ENGINE=InnoDB;;

-- ME_GUSTA_COMENTARIO   dueno = mascota_id
--   PRIMARY KEY (id)  ->  PRIMARY KEY (id, mascota_id)
-- ---------------------------------------------------------------------------

CREATE TABLE ME_GUSTA_COMENTARIO (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    comentario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_me_gusta_comentario
        PRIMARY KEY (id, mascota_id),
    CONSTRAINT uq_mgc_comentario_mascota
        UNIQUE (comentario_id, mascota_id),
    CONSTRAINT fk_mgc_comentario
        FOREIGN KEY (comentario_id)
        REFERENCES COMENTARIO(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_mgc_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_mgc_comentario
        (comentario_id),
    INDEX idx_mgc_mascota
        (mascota_id)
) ENGINE=InnoDB;;

-- ME_GUSTA_HISTORIA   dueno = mascota_id
--   PRIMARY KEY (id)  ->  PRIMARY KEY (id, mascota_id)
-- ---------------------------------------------------------------------------

CREATE TABLE ME_GUSTA_HISTORIA (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    historia_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_me_gusta_historia
        PRIMARY KEY (id, mascota_id),
    CONSTRAINT uq_mgh_historia_mascota
        UNIQUE (historia_id, mascota_id),
    CONSTRAINT fk_mgh_historia
        FOREIGN KEY (historia_id)
        REFERENCES HISTORIA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_mgh_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_mgh_historia
        (historia_id),
    INDEX idx_mgh_mascota
        (mascota_id)
) ENGINE=InnoDB;;

-- HISTORIA_VISTA   dueno = mascota_id
--   la PK original (historia_id, mascota_id) ya incluye mascota_id: no cambia
-- ---------------------------------------------------------------------------

CREATE TABLE HISTORIA_VISTA (
    historia_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    vista_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_historia_vista
        PRIMARY KEY (historia_id, mascota_id),
    CONSTRAINT fk_hv_historia
        FOREIGN KEY (historia_id)
        REFERENCES HISTORIA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_hv_mascota
        FOREIGN KEY (mascota_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_hv_mascota
        (mascota_id),
    INDEX idx_hv_historia_vista
        (historia_id, vista_en)
) ENGINE=InnoDB;;

-- NOTIFICACION   dueno = destinatario_id
--   PRIMARY KEY (id)  ->  PRIMARY KEY (id, destinatario_id)
-- ---------------------------------------------------------------------------

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
    CONSTRAINT fk_notificacion_destinatario
        FOREIGN KEY (destinatario_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_notificacion_actor
        FOREIGN KEY (actor_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_notificacion_publicacion
        FOREIGN KEY (publicacion_id)
        REFERENCES PUBLICACION(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_notificacion_comentario
        FOREIGN KEY (comentario_id)
        REFERENCES COMENTARIO(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_notificacion_historia
        FOREIGN KEY (historia_id)
        REFERENCES HISTORIA(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
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
) ENGINE=InnoDB;;
