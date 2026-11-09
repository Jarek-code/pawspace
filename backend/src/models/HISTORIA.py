from sqlalchemy import Column, String, DateTime, Enum, Index, text
from sqlalchemy.dialects.mysql import BIGINT, SMALLINT, INTEGER
from sqlalchemy.orm import declarative_base
from src.config.database import engine

Base = declarative_base()

#-------------------------------------------------------------------------------------------
class Historia(Base):
    __tablename__ = 'HISTORIA'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    
    # Referencia a la mascota que sube la historia
    mascota_id = Column(BIGINT(unsigned=True), nullable=False)
    
    # Fecha de creación automática
    creado_en = Column(
        DateTime, 
        nullable=False, 
        server_default=text('CURRENT_TIMESTAMP')
    )
    
    # Fecha de vencimiento (calculada y enviada desde el backend, usualmente creado_en + 24 horas)
    vence_en = Column(DateTime, nullable=False)

    # Configuración del motor distribuido Spider
    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )

'''
CREATE TABLE HISTORIA (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vence_en DATETIME NOT NULL,
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
