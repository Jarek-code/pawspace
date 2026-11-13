-- NODO SPIDER - FRAGMENTACION VERTICAL
-- GENERADO por devops/scripts/generar_sql.py -- no editar a mano

USE pawspace;

-- USUARIO_CREDENCIALES  <-  USUARIO(contrasena_hash)

CREATE TABLE USUARIO_CREDENCIALES (
    usuario_id BIGINT UNSIGNED NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    CONSTRAINT pk_usuario_credenciales
        PRIMARY KEY (usuario_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

-- USUARIO_PERFIL  <-  USUARIO(telefono, ubicacion_ciudad, ubicacion_pais, biografia)

CREATE TABLE USUARIO_PERFIL (
    usuario_id BIGINT UNSIGNED NOT NULL,
    telefono VARCHAR(32) NULL,
    ubicacion_ciudad VARCHAR(100) NULL,
    ubicacion_pais VARCHAR(100) NULL,
    biografia VARCHAR(500) NULL,
    CONSTRAINT pk_usuario_perfil
        PRIMARY KEY (usuario_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

-- MASCOTA_PERFIL  <-  MASCOTA(biografia, foto_perfil_url, foto_portada_url, sitio_web, ubicacion_ciudad, ubicacion_pais, latitud, longitud)

CREATE TABLE MASCOTA_PERFIL (
    mascota_id BIGINT UNSIGNED NOT NULL,
    biografia VARCHAR(1000) NULL,
    foto_perfil_url VARCHAR(2048) NULL,
    foto_portada_url VARCHAR(2048) NULL,
    sitio_web VARCHAR(255) NULL,
    ubicacion_ciudad VARCHAR(100) NULL,
    ubicacion_pais VARCHAR(100) NULL,
    latitud DECIMAL(9, 6) NULL,
    longitud DECIMAL(9, 6) NULL,
    CONSTRAINT pk_mascota_perfil
        PRIMARY KEY (mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

-- PUBLICACION_TEXTO  <-  PUBLICACION(texto)

CREATE TABLE PUBLICACION_TEXTO (
    publicacion_id BIGINT UNSIGNED NOT NULL,
    texto TEXT NULL,
    CONSTRAINT pk_publicacion_texto
        PRIMARY KEY (publicacion_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';

-- Vistas de conveniencia: se lee como antes de fragmentar

CREATE OR REPLACE VIEW vUSUARIO AS
SELECT p.id, p.nombre, p.email, p.contrasena_actualizada_en, p.creado_en, p.actualizado_en, p.activo, p.plan, p.eliminada_en,
         s0.contrasena_hash,
         s1.telefono,
         s1.ubicacion_ciudad,
         s1.ubicacion_pais,
         s1.biografia
  FROM USUARIO p
  LEFT JOIN USUARIO_CREDENCIALES s0 ON s0.usuario_id = p.id
  LEFT JOIN USUARIO_PERFIL s1 ON s1.usuario_id = p.id;

CREATE OR REPLACE VIEW vMASCOTA AS
SELECT p.id, p.nombre, p.nombre_usuario, p.especie_id, p.raza_id, p.sexo, p.fecha_nacimiento, p.es_privada, p.verificada, p.verificada_en, p.eliminada_en, p.creado_en, p.actualizado_en,
         s0.biografia,
         s0.foto_perfil_url,
         s0.foto_portada_url,
         s0.sitio_web,
         s0.ubicacion_ciudad,
         s0.ubicacion_pais,
         s0.latitud,
         s0.longitud
  FROM MASCOTA p
  LEFT JOIN MASCOTA_PERFIL s0 ON s0.mascota_id = p.id;

CREATE OR REPLACE VIEW vPUBLICACION AS
SELECT p.id, p.mascota_id, p.publicacion_origen_id, p.creado_en, p.actualizado_en, p.eliminado_en,
         s0.texto
  FROM PUBLICACION p
  LEFT JOIN PUBLICACION_TEXTO s0 ON s0.publicacion_id = p.id;
