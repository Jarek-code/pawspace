from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.mysql import BIGINT, ENUM
from src.config.database import Base
#-------------------------------------------------------------------------------------------
class Sesion(Base):
    __tablename__ = 'SESION'

    id = Column(String(64), primary_key=True)
    usuario_id = Column(BIGINT(unsigned=True), nullable=False)
    mascota_id = Column(BIGINT(unsigned=True), nullable=True)
    dispositivo = Column(String(120), nullable=True)
    plataforma = Column(String(60), nullable=True)
    ubicacion_ciudad = Column(String(100), nullable=True)
    ubicacion_pais = Column(String(100), nullable=True)
    iniciada_en = Column(DateTime, nullable=False)
    ultima_actividad_en = Column(DateTime, nullable=False)
    expira_en = Column(DateTime, nullable=False)
    cerrada_en = Column(DateTime, nullable=True)
    cerrada_por = Column(
        ENUM('USUARIO', 'TODAS', 'CONTRASENA', 'EXPIRADA', 'CUENTA_ELIMINADA'),
        nullable=True,
    )

    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"',
        }
    )

'''
Tabla Original

CREATE TABLE SESION (
    id VARCHAR(64) NOT NULL,
    usuario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NULL,
    dispositivo VARCHAR(120) NULL,
    plataforma VARCHAR(60) NULL,
    ubicacion_ciudad VARCHAR(100) NULL,
    ubicacion_pais VARCHAR(100) NULL,
    iniciada_en DATETIME NOT NULL,
    ultima_actividad_en DATETIME NOT NULL,
    expira_en DATETIME NOT NULL,
    cerrada_en DATETIME NULL,
    cerrada_por ENUM(
        'USUARIO',
        'TODAS',
        'CONTRASENA',
        'EXPIRADA',
        'CUENTA_ELIMINADA'
    ) NULL,
    CONSTRAINT pk_sesion
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------