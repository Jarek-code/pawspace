from sqlalchemy import Column, String, Boolean, DateTime, Index, text
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.orm import declarative_base
from src.config.database import engine

Base = declarative_base()

#Se modelo la tabala USUARIO en base a sqlalchemy para volverla una clase de python.
class Usuario(Base):

    #Se espesifica el nombre de la tabla.
    __tablename__ = 'USUARIO'

    #Se mapean todos los campos de la tabla para que coinsidan con los de la base de datos.
    id = Column('id', BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    nombre = Column(String(255), nullable=False)

    email = Column(String(320), nullable=False, unique=True)

    creado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))

    actualizado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'), 
    server_onupdate=text('CURRENT_TIMESTAMP'))

    activo = Column(Boolean, nullable=False, server_default=text('1'))

    #Diccionario donde le pasamos las configuraciones exclusivas del motor a SQLAlchemy .
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

    
"""
Tabla original sin mapear

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
