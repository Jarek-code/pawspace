from sqlalchemy import Boolean, Column, DateTime, JSON, String, text
from sqlalchemy.dialects.mysql import BIGINT, ENUM
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship
from src.config.database import engine

Base = declarative_base()

#Se modelo la tabala USUARIO en base a sqlalchemy para volverla una clase de python.
class Usuario(Base):

   # Se especifica el nombre de la tabla.
    __tablename__ = 'USUARIO'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    nombre = Column(String(255), nullable=False)

    email = Column(String(320), nullable=False)

    contrasena_actualizada_en = Column(
        DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')
    )

    creado_en = Column(
        DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')
    )

    actualizado_en = Column(
        DateTime,
        nullable=False,
        server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    )

    activo = Column(Boolean, nullable=False, server_default=text('1'))
    plan = Column(
        ENUM('GRATUITO', 'PREMIUM'),
        nullable=False,
        server_default=text("'GRATUITO'"),
    )

    eliminada_en = Column(DateTime, nullable=True)

    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"',
        }
    )

    
"""
Tabla original sin mapear

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
"""

#-------------------------------------------------------------------------------------------

class Usuario_Credenciales(Base):
    
    __tablename__ = 'USUARIO_CREDENCIALES'

    usuario_id = Column('usuario_id',BIGINT(unsigned=True), primary_key=True, )

    contrasena_hash = Column(String(255), nullable=False)

    __table_args__ = (

        {
            #Traduccion directa de "ENGINE=SPIDER".
            'mysql_engine': 'Spider'
            
            #Aqui abajo hay una coma como esta que esta que senale (no puedo escibir la letra no que saben los gringos)-> ,
            ,

            #Metadatos necesarios para que SPIDER sepa donde debe buscar o guardar los datos.
            'mysql_comment':'wrapper "mysql", srv "dn_a"'
        }

    )


'''
Tabla original sin mapear

CREATE TABLE USUARIO_CREDENCIALES (
    usuario_id BIGINT UNSIGNED NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    CONSTRAINT pk_usuario_credenciales
        PRIMARY KEY (usuario_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class UsuarioPreferencias(Base):

    # Se especifica el nombre de la tabla.
    __tablename__ = 'USUARIO_PREFERENCIAS'

    usuario_id = Column(BIGINT(unsigned=True), primary_key=True)

    avisos_correo = Column(Boolean, nullable=False, server_default=text('1'))

    avisos_push = Column(Boolean, nullable=False, server_default=text('1'))

    avisos_tipos = Column(JSON, nullable=True)

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
'''

#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class UsuarioPerfil(Base):

    # Se especifica el nombre de la tabla.
    __tablename__ = 'USUARIO_PERFIL'

    usuario_id = Column(BIGINT(unsigned=True), primary_key=True)

    telefono = Column(String(32), nullable=True)

    ubicacion_ciudad = Column(String(100), nullable=True)

    ubicacion_pais = Column(String(100), nullable=True)
    
    biografia = Column(String(500), nullable=True)

    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"',
        }
    )
    
'''
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
'''

#-------------------------------------------------------------------------------------------