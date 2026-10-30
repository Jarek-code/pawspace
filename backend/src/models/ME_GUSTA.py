from sqlalchemy import Column, String, Boolean, DateTime, Index, text
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.orm import declarative_base
from src.config.database import engine

Base = declarative_base()

#-------------------------------------------------------------------------------------------
class Me_gusta_publicacion(Base):
    __tablename__ = 'ME_GUSTA_PUBLICACION'

    id = Column(BIGINT(unsigned=True), nullable=False, autoincrement=True, primary_key=True)

    publicacion_id = Column(BIGINT(unsigned=True), nullable=False)

    mascota_id = Column(BIGINT(unsigned=True), nullable=False, primary_key=True)

    creado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))

    __table_args__ = (
        Index(
            'idx_mgp_publicacion',
            'publicacion_id'),

        Index(
            'idx_mgp_mascota',
            'mascota_id'),
      {
        #Traduccion directa de "ENGINE=SPIDER".
        'mysql_engine': 'Spider'
        #Aqui abajo hay una coma como esta que esta que senale (no puedo escibir la letra no que saben los gringos)-> ,
        ,
        #Metadatos necesarios para que SPIDER sepa donde debe buscar o guardar los datos.
        'mysql_comment':'wrapper "mysql", table "ME_GUSTA_PUBLICACION"'
      }
    )    

'''
CREATE TABLE ME_GUSTA_PUBLICACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    publicacion_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_me_gusta_publicacion
        PRIMARY KEY (id, mascota_id),
    CONSTRAINT uq_mgp_publicacion_mascota
        UNIQUE (publicacion_id, mascota_id),
    INDEX idx_mgp_publicacion
        (publicacion_id),
    INDEX idx_mgp_mascota
        (mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", table "ME_GUSTA_PUBLICACION"'
PARTITION BY HASH (mascota_id)
(
    PARTITION p0 COMMENT = 'srv "dn_a", table "ME_GUSTA_PUBLICACION"',
    PARTITION p1 COMMENT = 'srv "dn_b", table "ME_GUSTA_PUBLICACION"'
);
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class Me_gusta_comentario(Base):
    __tablename__ = 'ME_GUSTA_COMENTARIO'

    id = Column(BIGINT(unsigned=True), nullable=False, autoincrement=True, primary_key=True)

    comentario_id = Column(BIGINT(unsigned=True), nullable=False, unique=True)

    mascota_id = Column(BIGINT(unsigned=True), nullable=False, primary_key=True, unique=True)

    creado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))

    __table_args__ = (

        Index(
            'idx_mgc_comentario',
            'comentario_id'),

        Index(
            'idx_mgc_mascota',
            'mascota_id'),

      {
        #Traduccion directa de "ENGINE=SPIDER".
        'mysql_engine': 'Spider'
        #Aqui abajo hay una coma como esta que esta que senale (no puedo escibir la letra no que saben los gringos)-> ,
        ,
        #Metadatos necesarios para que SPIDER sepa donde debe buscar o guardar los datos.
        'mysql_comment':'wrapper "mysql", table "ME_GUSTA_COMENTARIO"'
      }
    )

'''
CREATE TABLE ME_GUSTA_COMENTARIO (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    comentario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_me_gusta_comentario
        PRIMARY KEY (id, mascota_id),
    CONSTRAINT uq_mgc_comentario_mascota
        UNIQUE (comentario_id, mascota_id),
    INDEX idx_mgc_comentario
        (comentario_id),
    INDEX idx_mgc_mascota
        (mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", table "ME_GUSTA_COMENTARIO"'
PARTITION BY HASH (mascota_id)
(
    PARTITION p0 COMMENT = 'srv "dn_a", table "ME_GUSTA_COMENTARIO"',
    PARTITION p1 COMMENT = 'srv "dn_b", table "ME_GUSTA_COMENTARIO"'
);
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------
class Me_gusta_historia(Base):
    __tablename__ = 'ME_GUSTA_HISTORIA'

    id = Column(BIGINT(unsigned=True), nullable=False, autoincrement=True, primary_key=True)

    historia_id = Column(BIGINT(unsigned=True), nullable=False, unique=True)

    mascota_id = Column(BIGINT(unsigned=True), nullable=False, primary_key=True, unique=True)

    creado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))

    __table_args__ = (

        Index(
            'idx_mgh_historia',
            'historia_id'),

        Index(
            'idx_mgh_mascota',
            'mascota_id'),

      {
        #Traduccion directa de "ENGINE=SPIDER".
        'mysql_engine': 'Spider'
        #Aqui abajo hay una coma como esta que esta que senale (no puedo escibir la letra no que saben los gringos)-> ,
        ,
        #Metadatos necesarios para que SPIDER sepa donde debe buscar o guardar los datos.
        'mysql_comment':'wrapper "mysql", table "ME_GUSTA_COMENTARIO"'
      }
     )

    

'''
CREATE TABLE ME_GUSTA_HISTORIA (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    historia_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_me_gusta_historia
        PRIMARY KEY (id, mascota_id),
    CONSTRAINT uq_mgh_historia_mascota
        UNIQUE (historia_id, mascota_id),
    INDEX idx_mgh_historia
        (historia_id),
    INDEX idx_mgh_mascota
        (mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", table "ME_GUSTA_HISTORIA"'
PARTITION BY HASH (mascota_id)
(
    PARTITION p0 COMMENT = 'srv "dn_a", table "ME_GUSTA_HISTORIA"',
    PARTITION p1 COMMENT = 'srv "dn_b", table "ME_GUSTA_HISTORIA"'
);
'''
#-------------------------------------------------------------------------------------------
