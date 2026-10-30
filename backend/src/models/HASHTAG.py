from sqlalchemy import Column, String, Boolean, DateTime, Index, text
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.orm import declarative_base
from src.config.database import engine

Base = declarative_base()

#-------------------------------------------------------------------------------------------
class Hashtag(Base):
    __tablename__ = 'HASHTAG'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    
    texto = Column(String(255), nullable=False)

    # Configuración del motor distribuido Spider
    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )

'''
CREATE TABLE HASHTAG (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    texto VARCHAR(255) NOT NULL,
    CONSTRAINT pk_hashtag
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class HashtagSeguidor(Base):
    __tablename__ = 'HASHTAG_SEGUIDOR'

    # Llave primaria compuesta (evita que una mascota siga el mismo hashtag dos veces)
    hashtag_id = Column(BIGINT(unsigned=True), primary_key=True)
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
CREATE TABLE HASHTAG_SEGUIDOR (
    hashtag_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_hashtag_seguidor
        PRIMARY KEY (hashtag_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class PublicacionMencion(Base):
    __tablename__ = 'PUBLICACION_MENCION'

    # Llave primaria compuesta
    publicacion_id = Column(BIGINT(unsigned=True), primary_key=True)
    mascota_id = Column(BIGINT(unsigned=True), primary_key=True)

    # Configuración del motor distribuido Spider
    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )

'''
CREATE TABLE PUBLICACION_MENCION (
    publicacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT pk_publicacion_mencion
        PRIMARY KEY (publicacion_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class PublicacionHashtag(Base):
    __tablename__ = 'PUBLICACION_HASHTAG'

    # Llave primaria compuesta
    publicacion_id = Column(BIGINT(unsigned=True), primary_key=True)
    hashtag_id = Column(BIGINT(unsigned=True), primary_key=True)

    # Configuración del motor distribuido Spider
    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )

'''
CREATE TABLE PUBLICACION_HASHTAG (
    publicacion_id BIGINT UNSIGNED NOT NULL,
    hashtag_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT pk_publicacion_hashtag
        PRIMARY KEY (publicacion_id, hashtag_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class ComentarioMencion(Base):
    __tablename__ = 'COMENTARIO_MENCION'

    # Llave primaria compuesta
    comentario_id = Column(BIGINT(unsigned=True), primary_key=True)
    mascota_id = Column(BIGINT(unsigned=True), primary_key=True)

    # Configuración del motor distribuido Spider
    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )

'''
CREATE TABLE COMENTARIO_MENCION (
    comentario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT pk_comentario_mencion
        PRIMARY KEY (comentario_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class ComentarioHashtag(Base):
    __tablename__ = 'COMENTARIO_HASHTAG'

    # Llave primaria compuesta
    comentario_id = Column(BIGINT(unsigned=True), primary_key=True)
    hashtag_id = Column(BIGINT(unsigned=True), primary_key=True)

    # Configuración del motor distribuido Spider
    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )

'''
CREATE TABLE COMENTARIO_HASHTAG (
    comentario_id BIGINT UNSIGNED NOT NULL,
    hashtag_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT pk_comentario_hashtag
        PRIMARY KEY (comentario_id, hashtag_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

