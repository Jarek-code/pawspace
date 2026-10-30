from sqlalchemy import Column, String, Boolean, DateTime, Index, text
from sqlalchemy.dialects.mysql import BIGINT, ENUM
from sqlalchemy.orm import declarative_base
from src.config.database import engine

Base = declarative_base()

#-------------------------------------------------------------------------------------------
class Notificacion(Base):

    __tablename__ = 'NOTIFICACION'

    id = Column(BIGINT(unsigned=True), nullable=False, autoincrement=True, primary_key=True)

    destinatario_id = Column (BIGINT(unsigned=True), nullable=False, primary_key=True)

    actor_id = Column (BIGINT(unsigned=True), nullable=True)

    tipo = Column(ENUM('SEGUIMIENTO','SOLICITUD_SEGUIMIENTO','LIKE_PUBLICACION','LIKE_COMENTARIO',
        'LIKE_HISTORIA','COMENTARIO','RESPUESTA','MENCION','REPOST','MENSAJE'), nullable=False)
    
    publicacion_id = Column(BIGINT(unsigned=True), nullable=False)

    comentario_id = Column(BIGINT(unsigned=True), nullable=False)

    historia_id = Column(BIGINT(unsigned=True), nullable=False)

    leida_en = Column(DateTime, nullable=True)

    creado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        Index(
            'idx_notificacion_destinatario_creado',
            'destinatario_id', 
            'creado_en'),

        Index(
            'idx_notificacion_no_leida'
            'destinatario_id', 
            'leida_en'),

        Index(
            'idx_notificacion_actor'
            'actor_id'),

        Index(
            'idx_notificacion_publicacion'
            'publicacion_id'),

        Index(
            'idx_notificacion_comentario'
            'comentario_id'),

        Index(
            'idx_notificacion_historia'
            'historia_id'),

      {
        #Traduccion directa de "ENGINE=SPIDER".
        'mysql_engine': 'Spider'
        #Aqui abajo hay una coma como esta que esta que senale (no puedo escibir la letra no que saben los gringos)-> ,
        ,
        #Metadatos necesarios para que SPIDER sepa donde debe buscar o guardar los datos.
        'mysql_comment':'wrapper "mysql", table "NOTIFICACION"'
      }
    )

'''
CREATE TABLE NOTIFICACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    destinatario_id BIGINT UNSIGNED NOT NULL,
    actor_id BIGINT UNSIGNED NULL,
    tipo ENUM(
        'SEGUIMIENTO',
        'SOLICITUD_SEGUIMIENTO',
        'LIKE_PUBLICACION',
        'LIKE_COMENTARIO',
        'LIKE_HISTORIA',
        'COMENTARIO',
        'RESPUESTA',
        'MENCION',
        'REPOST',
        'MENSAJE'
    ) NOT NULL,
    publicacion_id BIGINT UNSIGNED NULL,
    comentario_id BIGINT UNSIGNED NULL,
    historia_id BIGINT UNSIGNED NULL,
    leida_en DATETIME NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT pk_notificacion
        PRIMARY KEY (id, destinatario_id),
    INDEX idx_notificacion_destinatario_creado
        (destinatario_id, creado_en),
    INDEX idx_notificacion_no_leida
        (destinatario_id, leida_en),
    INDEX idx_notificacion_actor
        (actor_id),
    INDEX idx_notificacion_publicacion
        (publicacion_id),
    INDEX idx_notificacion_comentario
        (comentario_id),
    INDEX idx_notificacion_historia
        (historia_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", table "NOTIFICACION"'
PARTITION BY HASH (destinatario_id)
(
    PARTITION p0 COMMENT = 'srv "dn_a", table "NOTIFICACION"',
    PARTITION p1 COMMENT = 'srv "dn_b", table "NOTIFICACION"'
);
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class Reporte(Base):

    __tablename__ = 'REPORTE'

    id = Column(BIGINT(unsigned=True), nullable=False, autoincrement=True, primary_key=True)

    reportado_por_mascota_id = Column(BIGINT(unsigned=True), nullable=False)

    categoria =Column (ENUM('SPAM','ACOSO','CONTENIDO_INAPROPIADO','VIOLENCIA','SUPLANTACION','DERECHOS_AUTOR',
        'OTRO'), nullable=False)
    
    publicacion_id = Column(BIGINT(unsigned=True), nullable=True)
 
    comentario_id = Column(BIGINT(unsigned=True), nullable=True)

    historia_id = Column(BIGINT(unsigned=True), nullable=True)

    mensaje_id = Column(BIGINT(unsigned=True), nullable=True)

    mascota_id = Column(BIGINT(unsigned=True), nullable=True)

    detalle = Column(String(2000), nullable=True)

    estado = Column(ENUM('PENDIENTE','EN_REVISION','RESUELTO','RECHAZADO'), nullable=False, 
    server_default=text('PENDIENTE'))

    creado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))

    resuelto_en = Column(DateTime, nullable=True)

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
CREATE TABLE REPORTE (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reportado_por_mascota_id BIGINT UNSIGNED NOT NULL,
    categoria ENUM(
        'SPAM',
        'ACOSO',
        'CONTENIDO_INAPROPIADO',
        'VIOLENCIA',
        'SUPLANTACION',
        'DERECHOS_AUTOR',
        'OTRO'
    ) NOT NULL,
    publicacion_id BIGINT UNSIGNED NULL,
    comentario_id BIGINT UNSIGNED NULL,
    historia_id BIGINT UNSIGNED NULL,
    mensaje_id BIGINT UNSIGNED NULL,
    mascota_id BIGINT UNSIGNED NULL,
    detalle VARCHAR(2000) NULL,
    estado ENUM(
        'PENDIENTE',
        'EN_REVISION',
        'RESUELTO',
        'RECHAZADO'
    ) NOT NULL DEFAULT 'PENDIENTE',
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resuelto_en DATETIME NULL,
    CONSTRAINT pk_reporte
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------
