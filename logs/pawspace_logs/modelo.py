"""Vocabulario cerrado y tipos del registro de acciones y sesiones.

Todo lo que el backend puede registrar está aquí: si una acción no está en `Accion`, no
existe para el sistema. El catálogo se carga en la colección `acciones` para poder
etiquetar los informes.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Optional


class Accion(str, Enum):
    """Acciones que se pueden registrar."""

    # sesión y cuenta
    SESION_INICIAR = "sesion.iniciar"
    SESION_LATIDO = "sesion.latido"
    SESION_CERRAR = "sesion.cerrar"
    CUENTA_ACCEDER = "cuenta.acceder"
    CUENTA_FALLAR = "cuenta.fallar"
    CUENTA_BLOQUEAR = "cuenta.bloquear"
    CUENTA_SALIR = "cuenta.salir"

    # contenido
    PUBLICACION_CREAR = "publicacion.crear"
    PUBLICACION_EDITAR = "publicacion.editar"
    PUBLICACION_BORRAR = "publicacion.borrar"
    COMENTARIO_CREAR = "comentario.crear"
    COMENTARIO_BORRAR = "comentario.borrar"
    HISTORIA_CREAR = "historia.crear"
    HISTORIA_VER = "historia.ver"

    # interacción
    REACCION_CREAR = "reaccion.crear"
    REACCION_QUITAR = "reaccion.quitar"
    SEGUIMIENTO_CREAR = "seguimiento.crear"
    SEGUIMIENTO_QUITAR = "seguimiento.quitar"

    # adjuntos y OODB
    ADJUNTO_SUBIR = "adjunto.subir"
    ADJUNTO_BORRAR = "adjunto.borrar"
    ADJUNTO_REORDENAR = "adjunto.reordenar"
    CONTENIDO_ANCLAR = "contenido.anclar"
    CONTENIDO_BORRAR = "contenido.borrar"

    # moderación y acceso
    REPORTE_CREAR = "reporte.crear"
    PETICION_LEER = "peticion.leer"
    PETICION_ESCRIBIR = "peticion.escribir"

    @property
    def categoria(self) -> str:
        """Familia a la que pertenece, para agrupar informes."""
        return CATALOGO[self.value][0]

    @property
    def descripcion(self) -> str:
        """Texto legible."""
        return CATALOGO[self.value][1]

    @property
    def sensible(self) -> bool:
        """Si conviene conservarla más tiempo o revisarla."""
        return CATALOGO[self.value][2]


# (categoría, descripción, sensible). Debe coincidir con database/mongo/01-colecciones.js.
CATALOGO: dict[str, tuple[str, str, bool]] = {
    "sesion.iniciar": ("sesion", "Se abre una sesión", False),
    "sesion.latido": ("sesion", "Actividad dentro de una sesión", False),
    "sesion.cerrar": ("sesion", "Se cierra una sesión", False),
    "cuenta.acceder": ("cuenta", "Acceso con credenciales", True),
    "cuenta.fallar": ("cuenta", "Intento de acceso fallido", True),
    "cuenta.bloquear": ("cuenta", "Cuenta bloqueada por intentos", True),
    "cuenta.salir": ("cuenta", "Cierre de sesión explícito", False),
    "publicacion.crear": ("contenido", "Publicación creada", False),
    "publicacion.editar": ("contenido", "Publicación modificada", False),
    "publicacion.borrar": ("contenido", "Publicación eliminada", True),
    "comentario.crear": ("contenido", "Comentario creado", False),
    "comentario.borrar": ("contenido", "Comentario eliminado", True),
    "historia.crear": ("contenido", "Historia publicada", False),
    "historia.ver": ("contenido", "Historia vista", False),
    "reaccion.crear": ("interaccion", "Me gusta otorgado", False),
    "reaccion.quitar": ("interaccion", "Me gusta retirado", False),
    "seguimiento.crear": ("interaccion", "Se empieza a seguir", False),
    "seguimiento.quitar": ("interaccion", "Se deja de seguir", False),
    "adjunto.subir": ("adjuntos", "Archivo subido a la OODB", False),
    "adjunto.borrar": ("adjuntos", "Archivo retirado de la OODB", True),
    "adjunto.reordenar": ("adjuntos", "Se cambian las posiciones", False),
    "contenido.anclar": ("adjuntos", "Contenido anclado a su fila", False),
    "contenido.borrar": ("adjuntos", "Contenido borrado con sus adjuntos", True),
    "reporte.crear": ("moderacion", "Contenido reportado", True),
    "peticion.leer": ("acceso", "Petición de lectura muestreada", False),
    "peticion.escribir": ("acceso", "Petición de escritura", False),
}

MOTIVOS_FIN = ("logout", "expiracion", "cierre_navegador", "revocada", "error")

# Motivos de un intento fallido. `metadatos.motivo` lleva uno de estos.
MOTIVOS_FALLO = (
    "credenciales",      # usuario o contraseña incorrectos
    "cuenta_inactiva",   # la cuenta existe pero está desactivada
    "sin_mascota",       # autenticó pero no tiene mascota activa
    "token_invalido",    # token de sesión caducado o falsificado
    "bloqueada",         # demasiados intentos previos
)


@dataclass(frozen=True)
class Actor:
    """Quién realiza la acción. En PawSpace el actor es la mascota."""

    tipo: str
    id: int
    cuenta_id: Optional[int] = None

    def como_documento(self) -> dict[str, Any]:
        return {"tipo": self.tipo, "id": int(self.id), "cuenta_id": self.cuenta_id}


def mascota(mascota_id: int, cuenta_id: Optional[int] = None) -> Actor:
    """Actor mascota, con la cuenta que la administra detrás."""
    return Actor("MASCOTA", mascota_id, cuenta_id)


def usuario(usuario_id: int) -> Actor:
    """Actor persona, para acciones de cuenta."""
    return Actor("USUARIO", usuario_id, usuario_id)


def sistema() -> Actor:
    """Actor de procesos automáticos: reconciliación, tareas, migraciones."""
    return Actor("SISTEMA", 0, None)


def entidad(tipo: str, id: int) -> tuple[str, int]:
    """Entidad afectada por la acción, como (`PUBLICACION`, 1207)."""
    return (tipo.upper(), int(id))


def hash_identificador(valor: str, sal: str = "") -> str:
    """Hash corto del identificador usado en un intento: nunca se guarda el correo en claro."""
    import hashlib

    return hashlib.sha256(f"{sal}{valor.strip().lower()}".encode()).hexdigest()[:16]


def origen(metodo: str, ruta: str, ip: str = "", agente: str = "", sal: str = "") -> dict[str, Any]:
    """Origen de la petición, con la IP hasheada: nunca se guarda en claro."""
    import hashlib

    ip_hash = ""
    if ip:
        ip_hash = hashlib.sha256(f"{sal}{ip}".encode()).hexdigest()[:16]
    return {
        "metodo": metodo.upper()[:10],
        "ruta": ruta[:200],
        "ip_hash": ip_hash,
        "agente": agente[:300],
    }


def origen_de(peticion: Any, sal: str = "") -> dict[str, Any]:
    """Igual que `origen`, a partir de una petición tipo Starlette (sin depender de ella)."""
    metodo = getattr(peticion, "method", "") or ""
    url = getattr(peticion, "url", None)
    ruta = getattr(url, "path", "") if url is not None else ""
    cliente = getattr(peticion, "client", None)
    ip = getattr(cliente, "host", "") if cliente is not None else ""
    cabeceras = getattr(peticion, "headers", {}) or {}
    agente = cabeceras.get("user-agent", "") if hasattr(cabeceras, "get") else ""
    return origen(metodo, ruta, ip, agente, sal)
