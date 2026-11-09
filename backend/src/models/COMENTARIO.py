from sqlalchemy import Column, String, DateTime, Text, text
from sqlalchemy.dialects.mysql import BIGINT, SMALLINT
from sqlalchemy.orm import declarative_base
from src.config.database import engine

Base = declarative_base()

#-------------------------------------------------------------------------------------------
class Comentario(Base):
    __tablename__ = 'COMENTARIO'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    
    # Referencia a dónde se hizo el comentario
    publicacion_id = Column(BIGINT(unsigned=True), nullable=False)
    
    # Referencia a quién hizo el comentario
    mascota_id = Column(BIGINT(unsigned=True), nullable=False)
    
    # Referencia recursiva para respuestas a otros comentarios (Hilos)
    comentario_padre_id = Column(BIGINT(unsigned=True), nullable=True)
    
    texto = Column(Text, nullable=False)
    
    # Fecha en la que el autor del post fijó (pineó) este comentario
    fijado_en = Column(DateTime, nullable=True)
    
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
    
    # Borrado lógico
    eliminado_en = Column(DateTime, nullable=True)

    # Configuración del motor distribuido Spider
    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )

'''
CREATE TABLE COMENTARIO (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    publicacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    comentario_padre_id BIGINT UNSIGNED NULL,
    texto TEXT NOT NULL,
    fijado_en DATETIME NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    eliminado_en DATETIME NULL,
    CONSTRAINT pk_comentario
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------
