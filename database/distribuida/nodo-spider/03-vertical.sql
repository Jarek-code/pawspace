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

-- MASCOTA_PERFIL  <-  MASCOTA(biografia, foto_perfil_url)

CREATE TABLE MASCOTA_PERFIL (
    mascota_id BIGINT UNSIGNED NOT NULL,
    biografia VARCHAR(1000) NULL,
    foto_perfil_url VARCHAR(2048) NULL,
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
SELECT p.id, p.nombre, p.email, p.creado_en, p.actualizado_en, p.activo,
         s.contrasena_hash
  FROM USUARIO p
  LEFT JOIN USUARIO_CREDENCIALES s ON s.usuario_id = p.id;

CREATE OR REPLACE VIEW vMASCOTA AS
SELECT p.id, p.nombre, p.nombre_usuario, p.especie_id, p.raza_id, p.sexo, p.fecha_nacimiento, p.es_privada, p.creado_en, p.actualizado_en,
         s.biografia,
         s.foto_perfil_url
  FROM MASCOTA p
  LEFT JOIN MASCOTA_PERFIL s ON s.mascota_id = p.id;

CREATE OR REPLACE VIEW vPUBLICACION AS
SELECT p.id, p.mascota_id, p.publicacion_origen_id, p.creado_en, p.actualizado_en, p.eliminado_en,
         s.texto
  FROM PUBLICACION p
  LEFT JOIN PUBLICACION_TEXTO s ON s.publicacion_id = p.id;
