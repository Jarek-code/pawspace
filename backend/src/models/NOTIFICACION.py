from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.mysql import BIGINT,ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.orm import declarative_base
from src.config.database import engine

Base = declarative_base()

#-------------------------------------------------------------------------------------------
class Notificacion(Base):

    __tablename__ = 'NOTIFICACION'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    destinatario_id = Column(BIGINT(unsigned=True), primary_key=True)

    actor_id = Column(BIGINT(unsigned=True), nullable=True)

    tipo = Column(
        ENUM(
            'SEGUIMIENTO',
            'SOLICITUD_SEGUIMIENTO',
            'LIKE_PUBLICACION',
            'LIKE_COMENTARIO',
            'LIKE_HISTORIA',
            'COMENTARIO',
            'RESPUESTA',
            'MENCION',
            'REPOST',
            'MENSAJE',
            'RESPUESTA_HISTORIA',
            'APELACION',
            'SOPORTE',
        ),
        nullable=False,
    )

    publicacion_id = Column(BIGINT(unsigned=True), nullable=True)

    comentario_id = Column(BIGINT(unsigned=True), nullable=True)

    historia_id = Column(BIGINT(unsigned=True), nullable=True)

    conversacion_id = Column(BIGINT(unsigned=True), nullable=True)

    mensaje_id = Column(BIGINT(unsigned=True), nullable=True)

    leida_en = Column(DateTime, nullable=True)

    creado_en = Column(
        DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')
    )

    __table_args__ = (
        Index('idx_notificacion_destinatario_creado', 'destinatario_id', 'creado_en'),
        Index('idx_notificacion_no_leida', 'destinatario_id', 'leida_en'),
        Index('idx_notificacion_actor', 'actor_id'),
        Index('idx_notificacion_publicacion', 'publicacion_id'),
        Index('idx_notificacion_comentario', 'comentario_id'),
        Index('idx_notificacion_historia', 'historia_id'),
        Index('idx_notificacion_conversacion', 'conversacion_id'),
        Index('idx_notificacion_mensaje', 'mensaje_id'),
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", table "NOTIFICACION"',
            'mysql_partition_by': 'HASH(destinatario_id)',
        },
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
        'MENSAJE',
        'RESPUESTA_HISTORIA',
        'APELACION',
        'SOPORTE'
    ) NOT NULL,
    publicacion_id BIGINT UNSIGNED NULL,
    comentario_id BIGINT UNSIGNED NULL,
    historia_id BIGINT UNSIGNED NULL,
    conversacion_id BIGINT UNSIGNED NULL,
    mensaje_id BIGINT UNSIGNED NULL,
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
        (historia_id),
    INDEX idx_notificacion_conversacion
        (conversacion_id),
    INDEX idx_notificacion_mensaje
        (mensaje_id)
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

    # Se especifica el nombre de la tabla.
    __tablename__ = 'REPORTE'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    reportado_por_mascota_id = Column(BIGINT(unsigned=True), nullable=False)

    categoria = Column(
        ENUM(
            'SPAM',
            'ACOSO',
            'CONTENIDO_INAPROPIADO',
            'VIOLENCIA',
            'SUPLANTACION',
            'DERECHOS_AUTOR',
            'OTRO',
        ),
        nullable=False,
    )
    publicacion_id = Column(BIGINT(unsigned=True), nullable=True)
    comentario_id = Column(BIGINT(unsigned=True), nullable=True)
    historia_id = Column(BIGINT(unsigned=True), nullable=True)
    mensaje_id = Column(BIGINT(unsigned=True), nullable=True)
    mascota_id = Column(BIGINT(unsigned=True), nullable=True)
    detalle = Column(String(2000), nullable=True)
    estado = Column(
        ENUM('PENDIENTE', 'EN_REVISION', 'RESUELTO', 'RECHAZADO'),
        nullable=False,
        server_default=text("'PENDIENTE'"),
    )
    resolucion = Column(String(1000), nullable=True)
    creado_en = Column(
        DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')
    )
    resuelto_en = Column(DateTime, nullable=True)
    archivado_en = Column(DateTime, nullable=True)

    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"',
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
    resolucion VARCHAR(1000) NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resuelto_en DATETIME NULL,
    archivado_en DATETIME NULL,
    CONSTRAINT pk_reporte
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''
#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------

class ReporteApelacion(Base):

    # Se especifica el nombre de la tabla.
    __tablename__ = 'REPORTE_APELACION'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    reporte_id = Column(BIGINT(unsigned=True), nullable=False)

    mascota_id = Column(BIGINT(unsigned=True), nullable=False)

    motivo = Column(String(2000), nullable=False)

    estado = Column(
        ENUM('PENDIENTE', 'ACEPTADA', 'RECHAZADA'),
        nullable=False,
        server_default=text("'PENDIENTE'"),
    )

    resolucion = Column(String(1000), nullable=True)

    creado_en = Column(
        DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')
    )

    resuelto_en = Column(DateTime, nullable=True)

    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"',
        }
    )

'''
CREATE TABLE REPORTE_APELACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reporte_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    motivo VARCHAR(2000) NOT NULL,
    estado ENUM(
        'PENDIENTE',
        'ACEPTADA',
        'RECHAZADA'
    ) NOT NULL DEFAULT 'PENDIENTE',
    resolucion VARCHAR(1000) NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resuelto_en DATETIME NULL,
    CONSTRAINT pk_reporte_apelacion
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''

#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------

class TicketSoporte(Base):

    # Se especifica el nombre de la tabla.
    __tablename__ = 'TICKET_SOPORTE'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    usuario_id = Column(BIGINT(unsigned=True), nullable=False)

    mascota_id = Column(BIGINT(unsigned=True), nullable=True)

    tema = Column(
        ENUM(
            'CUENTA',
            'PRIVACIDAD',
            'MENSAJES',
            'REPORTES',
            'HISTORIAS',
            'OTRO',
        ),
        nullable=False,
    )
    correo_contacto = Column(String(320), nullable=False)

    asunto = Column(String(200), nullable=False)

    descripcion = Column(Text, nullable=False)

    estado = Column(
        ENUM(
            'ABIERTA',
            'EN_REVISION',
            'ESPERANDO_USUARIO',
            'RESUELTA',
            'CERRADA',
        ),
        nullable=False,
        server_default=text("'ABIERTA'"),
    )
    privacidad_aceptada_en = Column(DateTime, nullable=False)

    creado_en = Column(
        DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP')
    )
    actualizado_en = Column(
        DateTime,
        nullable=False,
        server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    )

    cerrada_en = Column(DateTime, nullable=True)

    __table_args__ = (
        {
            'mysql_engine': 'Spider',
            'mysql_comment': 'wrapper "mysql", srv "dn_a"',
        }
    )

'''
CREATE TABLE TICKET_SOPORTE (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NULL,
    tema ENUM(
        'CUENTA',
        'PRIVACIDAD',
        'MENSAJES',
        'REPORTES',
        'HISTORIAS',
        'OTRO'
    ) NOT NULL,
    correo_contacto VARCHAR(320) NOT NULL,
    asunto VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    estado ENUM(
        'ABIERTA',
        'EN_REVISION',
        'ESPERANDO_USUARIO',
        'RESUELTA',
        'CERRADA'
    ) NOT NULL DEFAULT 'ABIERTA',
    privacidad_aceptada_en DATETIME NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    cerrada_en DATETIME NULL,
    CONSTRAINT pk_ticket_soporte
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''

#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------

class TicketMensaje(Base):

    # Se especifica el nombre de la tabla.
    __tablename__ = 'TICKET_MENSAJE'

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    ticket_id = Column(BIGINT(unsigned=True), nullable=False)

    autor_tipo = Column(ENUM('USUARIO', 'SOPORTE'), nullable=False)

    autor_usuario_id = Column(BIGINT(unsigned=True), nullable=True)

    texto = Column(Text, nullable=False)

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
CREATE TABLE TICKET_MENSAJE (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ticket_id BIGINT UNSIGNED NOT NULL,
    autor_tipo ENUM(
        'USUARIO',
        'SOPORTE'
    ) NOT NULL,
    autor_usuario_id BIGINT UNSIGNED NULL,
    texto TEXT NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_ticket_mensaje
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''

#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------

class AyudaCategoria(Base):

    # Se especifica el nombre de la tabla.
    __tablename__ = 'AYUDA_CATEGORIA'

    # Se mapean todos los campos de la tabla para que coincidan con los de la base de datos.
    id = Column('id', SMALLINT(unsigned=True), primary_key=True, autoincrement=True)

    slug = Column(String(60), nullable=False)

    nombre = Column(String(120), nullable=False)

    descripcion = Column(String(255), nullable=True)

    orden = Column(SmallInteger, nullable=False, server_default=text('0'))

    activo = Column(Boolean, nullable=False, server_default=text('1'))

    # Relacion 1 a muchos con los articulos pertenecientes a esta categoria.
    articulos = relationship('AyudaArticulo', back_populates='categoria')

    # Diccionario donde le pasamos las configuraciones exclusivas del motor a SQLAlchemy.
    __table_args__ = (
        {
            # Traduccion directa de "ENGINE=SPIDER".
            'mysql_engine': 'Spider',

            # Metadatos necesarios para que SPIDER sepa donde debe buscar o guardar los datos.
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )

'''
CREATE TABLE AYUDA_CATEGORIA (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug VARCHAR(60) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion VARCHAR(255) NULL,
    orden SMALLINT NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_ayuda_categoria
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''

#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------

class AyudaArticulo(Base):

    # Se especifica el nombre de la tabla.
    __tablename__ = 'AYUDA_ARTICULO'

    # Se mapean todos los campos de la tabla para que coincidan con los de la base de datos.
    id = Column('id', BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    categoria_id = Column(SMALLINT(unsigned=True), ForeignKey('AYUDA_CATEGORIA.id'), nullable=False)

    slug = Column(String(120), nullable=False)

    titulo = Column(String(200), nullable=False)

    resumen = Column(String(500), nullable=True)

    contenido = Column(MEDIUMTEXT, nullable=False)

    minutos_lectura = Column(SmallInteger, nullable=False, server_default=text('1'))

    estado = Column(
        Enum('BORRADOR', 'PUBLICADO', 'RETIRADO'),
        nullable=False,
        server_default=text("'BORRADOR'")
    )

    publicado_en = Column(DateTime, nullable=True)

    actualizado_en = Column(
        DateTime,
        nullable=False,
        server_default=text('CURRENT_TIMESTAMP'),
        server_onupdate=text('CURRENT_TIMESTAMP')
    )

    orden = Column(SmallInteger, nullable=False, server_default=text('0'))

    # Relaciones con la categoria padre y los registros de utilidad del articulo.
    categoria = relationship('AyudaCategoria', back_populates='articulos')

    valoraciones = relationship('AyudaArticuloUtil', back_populates='articulo')

    # Diccionario donde le pasamos las configuraciones exclusivas del motor a SQLAlchemy.
    __table_args__ = (
        {
            # Traduccion directa de "ENGINE=SPIDER".
            'mysql_engine': 'Spider',

            # Metadatos necesarios para que SPIDER sepa donde debe buscar o guardar los datos.
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )

'''
CREATE TABLE AYUDA_ARTICULO (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    categoria_id SMALLINT UNSIGNED NOT NULL,
    slug VARCHAR(120) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    resumen VARCHAR(500) NULL,
    contenido MEDIUMTEXT NOT NULL,
    minutos_lectura SMALLINT NOT NULL DEFAULT 1,
    estado ENUM(
        'BORRADOR',
        'PUBLICADO',
        'RETIRADO'
    ) NOT NULL DEFAULT 'BORRADOR',
    publicado_en DATETIME NULL,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    orden SMALLINT NOT NULL DEFAULT 0,
    CONSTRAINT pk_ayuda_articulo
        PRIMARY KEY (id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''

#-------------------------------------------------------------------------------------------

#-------------------------------------------------------------------------------------------

class AyudaArticuloUtil(Base):

    # Se especifica el nombre de la tabla.
    __tablename__ = 'AYUDA_ARTICULO_UTIL'

    # Se mapean todos los campos de la tabla para que coincidan con los de la base de datos.
    articulo_id = Column(
        'articulo_id',
        BIGINT(unsigned=True),
        ForeignKey('AYUDA_ARTICULO.id'),
        primary_key=True,
        nullable=False
    )

    mascota_id = Column('mascota_id', BIGINT(unsigned=True), primary_key=True, nullable=False)

    util = Column(Boolean, nullable=False)

    creado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))

    # Relacion inversa hacia el articulo evaluado.
    articulo = relationship('AyudaArticulo', back_populates='valoraciones')

    # Diccionario donde le pasamos las configuraciones exclusivas del motor a SQLAlchemy.
    __table_args__ = (
        {
            # Traduccion directa de "ENGINE=SPIDER".
            'mysql_engine': 'Spider',

            # Metadatos necesarios para que SPIDER sepa donde debe buscar o guardar los datos.
            'mysql_comment': 'wrapper "mysql", srv "dn_a"'
        }
    )

'''
CREATE TABLE AYUDA_ARTICULO_UTIL (
    articulo_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    util BOOLEAN NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_ayuda_articulo_util
        PRIMARY KEY (articulo_id, mascota_id)
) ENGINE=SPIDER
  COMMENT='wrapper "mysql", srv "dn_a"';
'''

#-------------------------------------------------------------------------------------------