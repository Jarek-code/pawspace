-- NODO SPIDER - TABLAS REPLICADAS VISTAS DESDE EL NODO SPIDER
-- GENERADO por devops/scripts/generar_sql.py -- no editar a mano

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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE ESPECIE (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT pk_especie
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE RAZA (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    especie_id SMALLINT UNSIGNED NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT pk_raza
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE USUARIO_MASCOTA (
    usuario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuario_mascota
        PRIMARY KEY (usuario_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (seguidor_id, seguido_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE BLOQUEO (
    bloqueador_id BIGINT UNSIGNED NOT NULL,
    bloqueado_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_bloqueo
        PRIMARY KEY (bloqueador_id, bloqueado_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE COMENTARIO_IMAGEN (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    comentario_id BIGINT UNSIGNED NOT NULL,
    posicion SMALLINT UNSIGNED NOT NULL,
    archivo_url VARCHAR(2048) NOT NULL,
    CONSTRAINT pk_comentario_imagen
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE HASHTAG (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    texto VARCHAR(255) NOT NULL,
    CONSTRAINT pk_hashtag
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE PUBLICACION_HASHTAG (
    publicacion_id BIGINT UNSIGNED NOT NULL,
    hashtag_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT pk_publicacion_hashtag
        PRIMARY KEY (publicacion_id, hashtag_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE COMENTARIO_HASHTAG (
    comentario_id BIGINT UNSIGNED NOT NULL,
    hashtag_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT pk_comentario_hashtag
        PRIMARY KEY (comentario_id, hashtag_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE PUBLICACION_MENCION (
    publicacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT pk_publicacion_mencion
        PRIMARY KEY (publicacion_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE COMENTARIO_MENCION (
    comentario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT pk_comentario_mencion
        PRIMARY KEY (comentario_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE HASHTAG_SEGUIDOR (
    hashtag_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_hashtag_seguidor
        PRIMARY KEY (hashtag_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE PUBLICACION_GUARDADA (
    usuario_id BIGINT UNSIGNED NOT NULL,
    publicacion_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_publicacion_guardada
        PRIMARY KEY (usuario_id, publicacion_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE HISTORIA (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vence_en DATETIME NOT NULL,
    CONSTRAINT pk_historia
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE CONVERSACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_conversacion
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE CONVERSACION_PARTICIPANTE (
    conversacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_conversacion_participante
        PRIMARY KEY (conversacion_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE MENSAJE (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    conversacion_id BIGINT UNSIGNED NOT NULL,
    remitente_id BIGINT UNSIGNED NOT NULL,
    texto TEXT NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    eliminado_en DATETIME NULL,
    CONSTRAINT pk_mensaje
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
