from sqlalchemy import Column, String, Boolean, DateTime, Index, text
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.orm import declarative_base
from src.config.database import engine

Base = declarative_base()

#-------------------------------------------------------------------------------------------
class Mascota(Base):
    __tablename__ = 'MASCOTA'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    
    nombre = Column(String(100), nullable=False)
    
    nombre_usuario = Column(String(50), nullable=False)
    
    # SMALLINT UNSIGNED de MySQL
    especie_id = Column(SMALLINT(unsigned=True), nullable=False)
    
    # INT UNSIGNED de MySQL (INTEGER)
    raza_id = Column(INTEGER(unsigned=True), nullable=True)
    
    # CHAR(1) estricto
    sexo = Column(CHAR(1), nullable=True)
    
    # DATE (solo fecha, sin hora)
    fecha_nacimiento = Column(Date, nullable=True)
    
    # FALSE en MySQL se almacena como 0
    es_privada = Column(Boolean, nullable=False, server_default=text('0'))
    
    creado_en = Column(
        DateTime, 
        nullable=False, 
        server_default=text('CURRENT_TIMESTAMP')
    )
    
    actualizado_en = Column(
        DateTime, 
        nullable=False, 
        server_default=text('CURRENT_TIMESTAMP'),
        server_onupdate=text('CURRENT_TIMESTAMP')
    )

    # Configuración del motor distribuido Spider
    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
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
    __tablename__ = 'MASCOTA_PERFIL'

    # IMPORTANTE: No lleva autoincrement=True
    mascota_id = Column(BIGINT(unsigned=True), primary_key=True)
    
    biografia = Column(String(1000), nullable=True)
    
    foto_perfil_url = Column(String(2048), nullable=True)

    # Configuración del motor distribuido Spider
    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )
'''
CREATE TABLE MASCOTA_PERFIL (
    mascota_id BIGINT UNSIGNED NOT NULL,
    biografia VARCHAR(1000) NULL,
    foto_perfil_url VARCHAR(2048) NULL,
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
