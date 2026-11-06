"""Registro de acciones y sesiones de PawSpace en MongoDB.

El almacén es derivado: si se pierde un evento se pierde auditoría, nunca datos de negocio.
El middleware es opcional y vive en `pawspace_logs.middleware`, para no exigir Starlette.
"""

from .cliente import ClienteLogs
from .consultas import Consultas
from .modelo import (
    CATALOGO,
    MOTIVOS_FALLO,
    MOTIVOS_FIN,
    Accion,
    Actor,
    entidad,
    hash_identificador,
    mascota,
    origen,
    origen_de,
    sistema,
    usuario,
)

__all__ = [
    "CATALOGO",
    "MOTIVOS_FALLO",
    "MOTIVOS_FIN",
    "Accion",
    "Actor",
    "ClienteLogs",
    "Consultas",
    "entidad",
    "hash_identificador",
    "mascota",
    "origen",
    "origen_de",
    "sistema",
    "usuario",
]
