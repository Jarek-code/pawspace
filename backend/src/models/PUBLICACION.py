from sqlalchemy import Column, String, Boolean, DateTime, Index, text, Text
from sqlalchemy.dialects.mysql import BIGINT, SMALLINT, ENUM
from sqlalchemy.orm import declarative_base
from src.config.database import engine

Base = declarative_base()

#-------------------------------------------------------------------------------------------
class Publicacion(Base):
  
  __tablename__ = 'PUBLICACION'
  
  id = Column (BIGINT(unsigned=True), nullable=False, primary_key=True, autoincrement=True)
  
  mascota_id = Column(BIGINT(unsigned=True), nullable=False)
  
  publicacion_origen_id = Column(BIGINT(unsigned=True), nullable=False)
  
  creado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
  
  actualizado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'), 
  server_onupdate=text('CURRENT_TIMESTAMP'))

  eliminado_en = Column(DateTime, nullable=True, server_default=text('CURRENT_TIMESTAMP'))
  
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
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class Publicacion_texto(Base):

  __tablename__ = 'PUBLICACION_TEXTO'

  publicacion_id = Column(BIGINT(unsigned=True), nullable=False, primary_key=True)

  texto =Column(Text, nullable=True)
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
CREATE TABLE PUBLICACION_TEXTO (
    publicacion_id BIGINT UNSIGNED NOT NULL,
    texto TEXT NULL,
    CONSTRAINT pk_publicacion_texto
        PRIMARY KEY (publicacion_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class Publicacion_guardada(Base):

  __tablename__ = 'PUBLICACION_GUARDADA'
  
  usuario_id = Column(BIGINT(unsigned=True), nullable=False, primary_key=True)

  publicacion_id = Column(BIGINT(unsigned=True), nullable=False, primary_key=True)

  creado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))

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
CREATE TABLE PUBLICACION_GUARDADA (
    usuario_id BIGINT UNSIGNED NOT NULL,
    publicacion_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_publicacion_guardada
        PRIMARY KEY (usuario_id, publicacion_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class Publicacion_adjunto(Base):

  __tablename__ = 'PUBLICACION_ADJUNTO'

  id = Column (BIGINT(unsigned=True), nullable=False, primary_key=True, autoincrement=True)

  publicacion_id = Column(BIGINT(unsigned=True), nullable=False, primary_key=True)

  tipo = Column(ENUM('IMAGEN','VIDEO'), nullable=False)

  posicion = Column(SMALLINT(unsigned=True), nullable=False)

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
'''
#-------------------------------------------------------------------------------------------
