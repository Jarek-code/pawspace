from sqlalchemy import Column, String, Boolean, DateTime, Index, text
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.orm import declarative_base
from src.database import engine

Base = declarative_base()

class usuario(Base):
    __tablename__ = 'USUARIO'
    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)

    nombre = Column(String(255), nullable=False)

    email = Column(String(320), nullable=False, unique=True)

    contrasena_hash = Column(String(255), nullable=False)

    creado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))

    actualizado_en = Column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'), 
    server_onupdate=text('CURRENT_TIMESTAMP'))

    activo = Column(Boolean, nullable=False, server_default=text('1'))

    __table_args__ = (Index('idx_usuario_activo', 'activo'), Index('idx_usuario_creado_en', 'creado_en'))