"""Middleware opcional de Starlette: registra cada petición sin tocar las rutas.

    from pawspace_logs.middleware import MiddlewareLogs
    app.add_middleware(MiddlewareLogs, cliente=logs, excluir=("/health",), muestreo=0.1)

Espera que la dependencia de autenticación deje el actor en `request.state.actor` y la
sesión en `request.state.sesion_id`. Si no los deja, registra como `SISTEMA` y sin sesión.
"""

from __future__ import annotations

import random
import time
from typing import Any, Iterable, Optional

try:
    from starlette.middleware.base import BaseHTTPMiddleware
except ImportError as error:  # pragma: no cover
    raise ImportError(
        "el middleware necesita starlette: pip install 'pawspace-logs[fastapi]'"
    ) from error

from .cliente import ClienteLogs
from .modelo import Accion, Actor

POR_OMISION_EXCLUIR = ("/health", "/salud", "/docs", "/redoc", "/openapi.json", "/favicon.ico")


class MiddlewareLogs(BaseHTTPMiddleware):
    """Anota cada petición; las de escritura siempre, las de lectura según `muestreo`."""

    def __init__(
        self,
        app: Any,
        cliente: ClienteLogs,
        excluir: Iterable[str] = POR_OMISION_EXCLUIR,
        muestreo: Optional[float] = None,
    ) -> None:
        super().__init__(app)
        self.cliente = cliente
        self.excluir = tuple(excluir)
        self.muestreo = cliente.muestreo if muestreo is None else muestreo

    async def dispatch(self, request: Any, call_next: Any) -> Any:
        if not self.cliente.activo or request.url.path.startswith(self.excluir):
            return await call_next(request)

        inicio = time.perf_counter()
        respuesta = await call_next(request)
        if respuesta.status_code >= 500:
            return respuesta

        escritura = request.method not in ("GET", "HEAD", "OPTIONS")
        if not escritura and random.random() > self.muestreo:
            return respuesta

        sesion = getattr(request.state, "sesion_id", None)
        actor = getattr(request.state, "actor", None) or Actor("SISTEMA", 0)
        try:
            await self.cliente.evento(
                Accion.PETICION_ESCRIBIR if escritura else Accion.PETICION_LEER,
                actor,
                sesion=sesion,
                resultado="ok" if respuesta.status_code < 400 else "error",
                duracion_ms=int((time.perf_counter() - inicio) * 1000),
                metadatos={"estado": respuesta.status_code},
                origen=self.cliente.origen(request),
            )
            if sesion:
                await self.cliente.tocar_sesion(sesion)
        except Exception:  # noqa: BLE001 - los logs nunca estorban a la petición
            pass
        return respuesta
