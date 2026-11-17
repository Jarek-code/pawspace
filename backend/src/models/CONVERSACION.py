from sqlalchemy import CHAR, Column, DateTime, Index, String, Text, text
from sqlalchemy.dialects.mysql import BIGINT, ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.orm import declarative_base
from src.config.database import engine

Base = declarative_base()

#-------------------------------------------------------------------------------------------
class Conversacion(Base):
  # Se especifica el nombre de la tabla.
    __tablename__ = 'CONVERSACION'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    solicitante_id = Column(BIGINT(unsigned=True), nullable=True)

    estado = Column(
        ENUM('SOLICITUD', 'ACTIVA', 'IGNORADA'),
        nullable=False,
        server_default=text("'ACTIVA'"),
    )

    ultimo_mensaje_en = Column(DateTime, nullable=True)

    creado_en = Column(
        DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')
    )

    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"',
        }
    )

'''
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

'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class ConversacionParticipante(Base):
   # Se especifica el nombre de la tabla.
    __tablename__ = 'CONVERSACION_PARTICIPANTE'

    conversacion_id = Column(BIGINT(unsigned=True), primary_key=True)

    mascota_id = Column(BIGINT(unsigned=True), primary_key=True)

    leido_hasta_mensaje_id = Column(BIGINT(unsigned=True), nullable=True)
    
    leido_en = Column(DateTime, nullable=True)

    silenciada_hasta = Column(DateTime, nullable=True)

    silenciada_en = Column(DateTime, nullable=True)

    nota = Column(String(500), nullable=True)

    creado_en = Column(
        DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')
    )

    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"',
        }
    )

'''
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
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class Mensaje(Base):
   # Se especifica el nombre de la tabla.
    __tablename__ = 'MENSAJE'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    conversacion_id = Column(BIGINT(unsigned=True), nullable=False)

    remitente_id = Column(BIGINT(unsigned=True), nullable=False)

    historia_id = Column(BIGINT(unsigned=True), nullable=True)

    clave_cliente = Column(CHAR(36), nullable=True)

    texto = Column(Text, nullable=False)

    creado_en = Column(
        DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')
    )

    eliminado_en = Column(DateTime, nullable=True)

    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"',
        }
    )

'''
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
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------

class MensajeLectura(Base):

    # Se especifica el nombre de la tabla.
    __tablename__ = 'MENSAJE_LECTURA'

    mensaje_id = Column(BIGINT(unsigned=True), primary_key=True)

    mascota_id = Column(BIGINT(unsigned=True), primary_key=True)
    
    leido_en = Column(
        DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')
    )

    __table_args__ = (
        Index('idx_ml_mascota', 'mascota_id'),
        Index('idx_ml_mensaje_leido', 'mensaje_id', 'leido_en'),
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", table "MENSAJE_LECTURA"',
            'mysql_partition_by': 'HASH(mascota_id)',
        },
    )

'''
CREATE TABLE MENSAJE_LECTURA (
    mensaje_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    leido_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_mensaje_lectura
        PRIMARY KEY (mensaje_id, mascota_id),
    INDEX idx_ml_mascota
        (mascota_id),
    INDEX idx_ml_mensaje_leido
        (mensaje_id, leido_en)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", table "MENSAJE_LECTURA"'
PARTITION BY HASH (mascota_id)
(
    PARTITION p0 COMMENT = 'srv "dn_a", table "MENSAJE_LECTURA"',
    PARTITION p1 COMMENT = 'srv "dn_b", table "MENSAJE_LECTURA"'
);
'''

#-------------------------------------------------------------------------------------------
