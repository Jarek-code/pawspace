from sqlalchemy import Boolean, CHAR, Column, Date, DateTime, DECIMAL, ForeignKey, JSON, String, text
from sqlalchemy.dialects.mysql import BIGINT, SMALLINT, INTEGER
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship
from src.config.database import engine

Base = declarative_base()

#-------------------------------------------------------------------------------------------
class Mascota(Base):
   # Se especifica el nombre de la tabla.
    __tablename__ = 'MASCOTA'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    nombre_usuario = Column(String(50), nullable=False)
    especie_id = Column(SMALLINT(unsigned=True), nullable=False)
    raza_id = Column(INTEGER(unsigned=True), nullable=True)
    sexo = Column(CHAR(1), nullable=True)
    fecha_nacimiento = Column(Date, nullable=True)
    es_privada = Column(Boolean, nullable=False, server_default=text('0'))
    verificada = Column(Boolean, nullable=False, server_default=text('0'))
    verificada_en = Column(DateTime, nullable=True)
    eliminada_en = Column(DateTime, nullable=True)
    creado_en = Column(
        DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')
    )
    actualizado_en = Column(
        DateTime,
        nullable=False,
        server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    )

    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"',
        }
    )

'''
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
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class Raza(Base):
    __tablename__ = 'RAZA'

    # INT UNSIGNED
    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    
    # SMALLINT UNSIGNED
    especie_id = Column(SMALLINT(unsigned=True), nullable=False)
    
    # VARCHAR(100)
    nombre = Column(String(100), nullable=False)

    # Configuración del motor Spider
    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )
    
'''
CREATE TABLE RAZA (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    especie_id SMALLINT UNSIGNED NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT pk_raza
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class Especie(Base):
    __tablename__ = 'ESPECIE'

    # Usamos el dialecto específico de MySQL para el SMALLINT UNSIGNED
    id = Column(SMALLINT(unsigned=True), primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)

    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )

'''
CREATE TABLE ESPECIE (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT pk_especie
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class MascotaPerfil(Base):
   # Se especifica el nombre de la tabla.
    __tablename__ = 'MASCOTA_PERFIL'

    mascota_id = Column(BIGINT(unsigned=True), primary_key=True)

    biografia = Column(String(1000), nullable=True)

    foto_perfil_url = Column(String(2048), nullable=True)

    foto_portada_url = Column(String(2048), nullable=True)

    sitio_web = Column(String(255), nullable=True)

    ubicacion_ciudad = Column(String(100), nullable=True)

    ubicacion_pais = Column(String(100), nullable=True)

    latitud = Column(DECIMAL(9, 6), nullable=True)

    longitud = Column(DECIMAL(9, 6), nullable=True)


    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"',
        }
    )

'''
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
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class UsuarioMascota(Base):
    __tablename__ = 'USUARIO_MASCOTA'

    # Llave primaria compuesta (ambas columnas forman el identificador único)
    usuario_id = Column(BIGINT(unsigned=True), primary_key=True)
    mascota_id = Column(BIGINT(unsigned=True), primary_key=True)
    
    creado_en = Column(
        DateTime, 
        nullable=False, 
        server_default=text('CURRENT_TIMESTAMP')
    )

    # Configuración del motor distribuido Spider
    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )
'''
CREATE TABLE USUARIO_MASCOTA (
    usuario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuario_mascota
        PRIMARY KEY (usuario_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------

class MascotaPreferencias(Base):

    # Se especifica el nombre de la tabla.
    __tablename__ = 'MASCOTA_PREFERENCIAS'

    mascota_id = Column(BIGINT(unsigned=True), primary_key=True)

    mostrar_ubicacion = Column(Boolean, nullable=False, server_default=text('0'))

    permitir_mensajes_desconocidos = Column(
        Boolean, nullable=False, server_default=text('0')
    )
    
    compartir_historias_seguidores = Column(
        Boolean, nullable=False, server_default=text('1')
    )

    permitir_descarga_historias = Column(
        Boolean, nullable=False, server_default=text('0')
    )

    filtro_comentarios_ofensivos = Column(
        Boolean, nullable=False, server_default=text('0')
    )

    filtro_cuentas_sin_foto = Column(
        Boolean, nullable=False, server_default=text('0')
    )

    filtro_palabras = Column(JSON, nullable=True)
    
    actualizado_en = Column(
        DateTime,
        nullable=False,
        server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    )

    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"',
        }
    )

'''
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
'''

#-------------------------------------------------------------------------------------------