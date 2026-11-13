-- PAWSPACE

DROP DATABASE IF EXISTS pawspace;

CREATE DATABASE pawspace
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE pawspace;


-- USUARIO

CREATE TABLE USUARIO (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL,
    telefono VARCHAR(32) NULL,
    ubicacion_ciudad VARCHAR(100) NULL,
    ubicacion_pais VARCHAR(100) NULL,
    biografia VARCHAR(500) NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    contrasena_actualizada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    plan ENUM(
        'GRATUITO',
        'PREMIUM'
    ) NOT NULL DEFAULT 'GRATUITO',
    eliminada_en DATETIME NULL,

    CONSTRAINT pk_usuario
        PRIMARY KEY (id),

    CONSTRAINT uq_usuario_email
        UNIQUE (email),

    INDEX idx_usuario_activo (activo),
    INDEX idx_usuario_creado_en (creado_en),
    INDEX idx_usuario_eliminada (eliminada_en)
) ENGINE=InnoDB;


-- ESPECIE

CREATE TABLE ESPECIE (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,

    CONSTRAINT pk_especie
        PRIMARY KEY (id),

    CONSTRAINT uq_especie_nombre
        UNIQUE (nombre)
) ENGINE=InnoDB;


-- RAZA

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
) ENGINE=InnoDB;


-- MASCOTA

CREATE TABLE MASCOTA (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    nombre_usuario VARCHAR(50) NOT NULL,
    especie_id SMALLINT UNSIGNED NOT NULL,
    raza_id INT UNSIGNED NULL,
    sexo CHAR(1) NULL,
    fecha_nacimiento DATE NULL,
    biografia VARCHAR(1000) NULL,
    foto_perfil_url VARCHAR(2048) NULL,
    foto_portada_url VARCHAR(2048) NULL,
    sitio_web VARCHAR(255) NULL,
    ubicacion_ciudad VARCHAR(100) NULL,
    ubicacion_pais VARCHAR(100) NULL,
    latitud DECIMAL(9, 6) NULL,
    longitud DECIMAL(9, 6) NULL,
    es_privada BOOLEAN NOT NULL DEFAULT FALSE,
    verificada BOOLEAN NOT NULL DEFAULT FALSE,
    verificada_en DATETIME NULL,
    eliminada_en DATETIME NULL,
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
    INDEX idx_mascota_privada (es_privada),
    INDEX idx_mascota_verificada (verificada),
    INDEX idx_mascota_eliminada (eliminada_en)
) ENGINE=InnoDB;


-- USUARIO_MASCOTA

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
) ENGINE=InnoDB;


-- SEGUIMIENTO

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
) ENGINE=InnoDB;


-- BLOQUEO

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
) ENGINE=InnoDB;


-- PUBLICACION

CREATE TABLE PUBLICACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mascota_id BIGINT UNSIGNED NOT NULL,
    publicacion_origen_id BIGINT UNSIGNED NULL,
    texto TEXT NULL,
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
) ENGINE=InnoDB;


-- ADJUNTOS

-- Las imágenes y los vídeos de publicaciones, historias y comentarios NO se guardan aquí:
-- viven en la base de datos orientada a objetos, anclados a su fila por (tabla, id).
-- El servicio `oodb` es la fuente de verdad de esos archivos.

-- ME_GUSTA_PUBLICACION

CREATE TABLE ME_GUSTA_PUBLICACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    publicacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_me_gusta_publicacion
        PRIMARY KEY (id),

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
) ENGINE=InnoDB;


-- COMENTARIO

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
) ENGINE=InnoDB;


-- ME_GUSTA_COMENTARIO

CREATE TABLE ME_GUSTA_COMENTARIO (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    comentario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_me_gusta_comentario
        PRIMARY KEY (id),

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
) ENGINE=InnoDB;


-- HASHTAG

CREATE TABLE HASHTAG (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    texto VARCHAR(255) NOT NULL,

    CONSTRAINT pk_hashtag
        PRIMARY KEY (id),

    CONSTRAINT uq_hashtag_texto
        UNIQUE (texto)
) ENGINE=InnoDB;


-- PUBLICACION_HASHTAG

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
) ENGINE=InnoDB;


-- COMENTARIO_HASHTAG

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
) ENGINE=InnoDB;


-- PUBLICACION_MENCION

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
) ENGINE=InnoDB;


-- COMENTARIO_MENCION

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
) ENGINE=InnoDB;


-- HASHTAG_SEGUIDOR

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
) ENGINE=InnoDB;


-- PUBLICACION_GUARDADA

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
) ENGINE=InnoDB;


-- HISTORIA

CREATE TABLE HISTORIA (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mascota_id BIGINT UNSIGNED NOT NULL,
    texto VARCHAR(500) NULL,
    audiencia ENUM(
        'PUBLICO',
        'SEGUIDORES',
        'SOLO_YO'
    ) NOT NULL DEFAULT 'PUBLICO',
    permite_respuestas BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vence_en DATETIME NOT NULL,
    eliminada_en DATETIME NULL,

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
        (vence_en),

    INDEX idx_historia_eliminada
        (eliminada_en)
) ENGINE=InnoDB;


-- HISTORIA_VISTA

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
) ENGINE=InnoDB;


-- ME_GUSTA_HISTORIA

CREATE TABLE ME_GUSTA_HISTORIA (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    historia_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_me_gusta_historia
        PRIMARY KEY (id),

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
) ENGINE=InnoDB;


-- CONVERSACION

CREATE TABLE CONVERSACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    solicitante_id BIGINT UNSIGNED NULL,
    estado ENUM(
        'SOLICITUD',
        'ACTIVA',
        'IGNORADA'
    ) NOT NULL DEFAULT 'ACTIVA',
    ultimo_mensaje_en DATETIME NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_conversacion
        PRIMARY KEY (id),

    CONSTRAINT fk_conversacion_solicitante
        FOREIGN KEY (solicitante_id)
        REFERENCES MASCOTA(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_conversacion_creado
        (creado_en),

    INDEX idx_conversacion_bandeja
        (estado, ultimo_mensaje_en)
) ENGINE=InnoDB;


-- CONVERSACION_PARTICIPANTE

CREATE TABLE CONVERSACION_PARTICIPANTE (
    conversacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    -- Puntero sin clave ajena: MENSAJE se declara mas abajo en este mismo esquema.
    leido_hasta_mensaje_id BIGINT UNSIGNED NULL,
    leido_en DATETIME NULL,
    silenciada_hasta DATETIME NULL,
    silenciada_en DATETIME NULL,
    nota VARCHAR(500) NULL,
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
) ENGINE=InnoDB;


-- MENSAJE

CREATE TABLE MENSAJE (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    conversacion_id BIGINT UNSIGNED NOT NULL,
    remitente_id BIGINT UNSIGNED NOT NULL,
    historia_id BIGINT UNSIGNED NULL,
    clave_cliente CHAR(36) NULL,
    texto TEXT NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    eliminado_en DATETIME NULL,

    CONSTRAINT pk_mensaje
        PRIMARY KEY (id),

    CONSTRAINT uq_mensaje_clave_cliente
        UNIQUE (conversacion_id, remitente_id, clave_cliente),

    CONSTRAINT fk_mensaje_historia
        FOREIGN KEY (historia_id)
        REFERENCES HISTORIA(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

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

    INDEX idx_mensaje_historia
        (historia_id),

    INDEX idx_mensaje_eliminado
        (eliminado_en)
) ENGINE=InnoDB;


-- REPORTE

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

    resolucion VARCHAR(1000) NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resuelto_en DATETIME NULL,
    archivado_en DATETIME NULL,

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

    INDEX idx_reporte_reportante_archivado
        (reportado_por_mascota_id, archivado_en),

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
) ENGINE=InnoDB;


-- NOTIFICACION

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
        'MENSAJE',
        'RESPUESTA_HISTORIA',
        'APELACION',
        'SOPORTE'
    ) NOT NULL,

    publicacion_id BIGINT UNSIGNED NULL,
    comentario_id BIGINT UNSIGNED NULL,
    historia_id BIGINT UNSIGNED NULL,
    conversacion_id BIGINT UNSIGNED NULL,
    mensaje_id BIGINT UNSIGNED NULL,

    leida_en DATETIME NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_notificacion
        PRIMARY KEY (id),

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

    CONSTRAINT fk_notificacion_conversacion
        FOREIGN KEY (conversacion_id)
        REFERENCES CONVERSACION(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_notificacion_mensaje
        FOREIGN KEY (mensaje_id)
        REFERENCES MENSAJE(id)
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
        (historia_id),

    INDEX idx_notificacion_conversacion
        (conversacion_id),

    INDEX idx_notificacion_mensaje
        (mensaje_id)
) ENGINE=InnoDB;


-- SESION

CREATE TABLE SESION (
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


-- MASCOTA_PREFERENCIAS

CREATE TABLE MASCOTA_PREFERENCIAS (
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


-- USUARIO_PREFERENCIAS

CREATE TABLE USUARIO_PREFERENCIAS (
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


-- MENSAJE_LECTURA

CREATE TABLE MENSAJE_LECTURA (
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


-- HISTORIA_DESTACADA

CREATE TABLE HISTORIA_DESTACADA (
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


-- HISTORIA_DESTACADA_ELEMENTO

CREATE TABLE HISTORIA_DESTACADA_ELEMENTO (
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


-- REPORTE_APELACION

CREATE TABLE REPORTE_APELACION (
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


-- TICKET_SOPORTE

CREATE TABLE TICKET_SOPORTE (
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


-- TICKET_MENSAJE

CREATE TABLE TICKET_MENSAJE (
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

CREATE TABLE AYUDA_CATEGORIA (
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

CREATE TABLE AYUDA_ARTICULO (
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


-- AYUDA_ARTICULO_UTIL

CREATE TABLE AYUDA_ARTICULO_UTIL (
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


-- RETENCION

CREATE EVENT ev_historia_archivo
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

CREATE EVENT ev_reporte_archivo
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP + INTERVAL 2 HOUR
DO
    UPDATE REPORTE r
       SET r.archivado_en = NOW()
     WHERE r.archivado_en IS NULL
       AND r.resuelto_en IS NOT NULL
       AND r.resuelto_en < NOW() - INTERVAL 90 DAY;


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
