-- NODO SPIDER - TABLAS REPLICADAS VISTAS DESDE EL NODO SPIDER
-- GENERADO por devops/scripts/generar_sql.py -- no editar a mano

USE pawspace;

-- USUARIO: sin contrasena_hash, telefono, ubicacion_ciudad, ubicacion_pais, biografia (viven en el satelite vertical)
CREATE TABLE USUARIO (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL,
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

-- MASCOTA: sin biografia, foto_perfil_url, foto_portada_url, sitio_web, ubicacion_ciudad, ubicacion_pais, latitud, longitud (viven en el satelite vertical)
CREATE TABLE MASCOTA (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    nombre_usuario VARCHAR(50) NOT NULL,
    especie_id SMALLINT UNSIGNED NOT NULL,
    raza_id INT UNSIGNED NULL,
    sexo CHAR(1) NULL,
    fecha_nacimiento DATE NULL,
    es_privada BOOLEAN NOT NULL DEFAULT FALSE,
    verificada BOOLEAN NOT NULL DEFAULT FALSE,
    verificada_en DATETIME NULL,
    eliminada_en DATETIME NULL,
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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE CONVERSACION_PARTICIPANTE (
    conversacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    -- Puntero sin clave ajena: MENSAJE se declara mas abajo en este mismo esquema.,
    leido_hasta_mensaje_id BIGINT UNSIGNED NULL,
    leido_en DATETIME NULL,
    silenciada_hasta DATETIME NULL,
    silenciada_en DATETIME NULL,
    nota VARCHAR(500) NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_conversacion_participante
        PRIMARY KEY (conversacion_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
    resolucion VARCHAR(1000) NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resuelto_en DATETIME NULL,
    archivado_en DATETIME NULL,
    CONSTRAINT pk_reporte
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE USUARIO_PREFERENCIAS (
    usuario_id BIGINT UNSIGNED NOT NULL,
    avisos_correo BOOLEAN NOT NULL DEFAULT TRUE,
    avisos_push BOOLEAN NOT NULL DEFAULT TRUE,
    avisos_tipos JSON NULL,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuario_preferencias
        PRIMARY KEY (usuario_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE HISTORIA_DESTACADA_ELEMENTO (
    destacada_id BIGINT UNSIGNED NOT NULL,
    historia_id BIGINT UNSIGNED NOT NULL,
    posicion SMALLINT NOT NULL DEFAULT 0,
    agregada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_historia_destacada_elemento
        PRIMARY KEY (destacada_id, historia_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE AYUDA_CATEGORIA (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug VARCHAR(60) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion VARCHAR(255) NULL,
    orden SMALLINT NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_ayuda_categoria
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

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
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

CREATE TABLE AYUDA_ARTICULO_UTIL (
    articulo_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    util BOOLEAN NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_ayuda_articulo_util
        PRIMARY KEY (articulo_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
