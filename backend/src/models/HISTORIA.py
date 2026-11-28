from sqlalchemy import Boolean, Column, DateTime, Index, SmallInteger, String, text
from sqlalchemy.dialects.mysql import BIGINT, SMALLINT, INTEGER, ENUM
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship
from src.config.database import engine

Base = declarative_base()

#-------------------------------------------------------------------------------------------
class Historia(Base):
    __tablename__ = 'HISTORIA'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    mascota_id = Column(BIGINT(unsigned=True), nullable=False)

    texto = Column(String(500), nullable=True)

    audiencia = Column(
        ENUM('PUBLICO', 'SEGUIDORES', 'SOLO_YO'),
        nullable=False,
        server_default=text("'PUBLICO'"),
    )

    permite_respuestas = Column(Boolean, nullable=False, server_default=text('1'))

    creado_en = Column(
        DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')
    )

    vence_en = Column(DateTime, nullable=False)

    eliminada_en = Column(DateTime, nullable=True)


    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"',
        }
    )

'''
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
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class HistoriaVista(Base):
    __tablename__ = 'HISTORIA_VISTA'

    # Llave primaria compuesta
    historia_id = Column(BIGINT(unsigned=True), primary_key=True)
    mascota_id = Column(BIGINT(unsigned=True), primary_key=True)
    
    # Fecha de visualización
    vista_en = Column(
        DateTime, 
        nullable=False, 
        server_default=text('CURRENT_TIMESTAMP')
    )

    # Índices y configuración del motor Spider
    __table_args__ = (
        Index('idx_hv_mascota', 'mascota_id'),
        Index('idx_hv_historia_vista', 'historia_id', 'vista_en'),
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", table "HISTORIA_VISTA"'
        }
    )

'''
CREATE TABLE HISTORIA_VISTA (
    historia_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    vista_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_historia_vista
        PRIMARY KEY (historia_id, mascota_id),
    INDEX idx_hv_mascota
        (mascota_id),
    INDEX idx_hv_historia_vista
        (historia_id, vista_en)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", table "HISTORIA_VISTA"'
PARTITION BY HASH (mascota_id)
(
    PARTITION p0 COMMENT = 'srv "dn_a", table "HISTORIA_VISTA"',
    PARTITION p1 COMMENT = 'srv "dn_b", table "HISTORIA_VISTA"'
);
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------

class HistoriaDestacada(Base):
    __tablename__ = 'HISTORIA_DESTACADA'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    mascota_id = Column(BIGINT(unsigned=True), nullable=False)

    titulo = Column(String(60), nullable=False)

    portada_historia_id = Column(BIGINT(unsigned=True), nullable=True)

    orden = Column(SMALLINT, nullable=False, server_default=text('0'))

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
'''

#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------

class HistoriaDestacadaElemento(Base):
    __tablename__ = 'HISTORIA_DESTACADA_ELEMENTO'

    destacada_id = Column(BIGINT(unsigned=True), primary_key=True)
    historia_id = Column(BIGINT(unsigned=True), primary_key=True)
    posicion = Column(SMALLINT, nullable=False, server_default=text('0'))
    agregada_en = Column(
        DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')
    )

    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"',
        }
    )

'''
CREATE TABLE HISTORIA_DESTACADA_ELEMENTO (
    destacada_id BIGINT UNSIGNED NOT NULL,
    historia_id BIGINT UNSIGNED NOT NULL,
    posicion SMALLINT NOT NULL DEFAULT 0,
    agregada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_historia_destacada_elemento
        PRIMARY KEY (destacada_id, historia_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''

#-------------------------------------------------------------------------------------------