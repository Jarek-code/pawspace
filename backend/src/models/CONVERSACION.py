from sqlalchemy import Column, String, Boolean, DateTime, Index, text
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.orm import declarative_base
from src.config.database import engine

Base = declarative_base()

#-------------------------------------------------------------------------------------------
class Conversacion(Base):
    __tablename__ = 'CONVERSACION'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    
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
CREATE TABLE CONVERSACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_conversacion
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class ConversacionParticipante(Base):
    __tablename__ = 'CONVERSACION_PARTICIPANTE'

    # Llave primaria compuesta
    conversacion_id = Column(BIGINT(unsigned=True), primary_key=True)
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
CREATE TABLE CONVERSACION_PARTICIPANTE (
    conversacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_conversacion_participante
        PRIMARY KEY (conversacion_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class Mensaje(Base):
    __tablename__ = 'MENSAJE'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    
    # Referencia a qué chat pertenece el mensaje
    conversacion_id = Column(BIGINT(unsigned=True), nullable=False)
    
    # Referencia a qué mascota envió el mensaje
    remitente_id = Column(BIGINT(unsigned=True), nullable=False)
    
    # Se usa Text en lugar de String para permitir mensajes largos sin límite de caracteres estricto
    texto = Column(Text, nullable=False)
    
    creado_en = Column(
        DateTime, 
        nullable=False, 
        server_default=text('CURRENT_TIMESTAMP')
    )
    
    # Columna para borrado lógico (Soft Delete)
    eliminado_en = Column(DateTime, nullable=True)

    # Configuración del motor distribuido Spider
    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )

'''
CREATE TABLE MENSAJE (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    conversacion_id BIGINT UNSIGNED NOT NULL,
    remitente_id BIGINT UNSIGNED NOT NULL,
    texto TEXT NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    eliminado_en DATETIME NULL,
    CONSTRAINT pk_mensaje
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------
