from sqlalchemy import Column, String, Boolean, DateTime, Index, text
from sqlalchemy.dialects.mysql import BIGINT, ENUM
from sqlalchemy.orm import declarative_base
from src.config.database import engine

Base = declarative_base()

#-------------------------------------------------------------------------------------------
class Seguimiento(Base):

    __tablename__ = 'SEGUIMIENTO'

    seguidor_id = Column(BIGINT(unsigned=True), nullable=False, primary_key=True)

    seguido_id = Column(BIGINT(unsigned=True), nullable=False, primary_key=True)

    estado = Column(ENUM('PENDIENTE','ACEPTADO','RECHAZADO'), nullable=False, server_default='PENDIENTE')

    creado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))

    actualizado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'), 
    server_onupdate=text('CURRENT_TIMESTAMP'))

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
CREATE TABLE SEGUIMIENTO (
    seguidor_id BIGINT UNSIGNED NOT NULL,
    seguido_id BIGINT UNSIGNED NOT NULL,
    estado ENUM(
        'PENDIENTE',
        'ACEPTADO',
        'RECHAZADO'
    ) NOT NULL DEFAULT 'PENDIENTE',
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_seguimiento
        PRIMARY KEY (seguidor_id, seguido_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class Bloqueo(Base):
    __tablename__ = 'BLOQUEO'

    bloqueador_id = Column(BIGINT(unsigned=True), primary_key=True)

    bloqueado_id = Column(BIGINT(unsigned=True), primary_key=True)

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
CREATE TABLE BLOQUEO (
    bloqueador_id BIGINT UNSIGNED NOT NULL,
    bloqueado_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_bloqueo
        PRIMARY KEY (bloqueador_id, bloqueado_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------