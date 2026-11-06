"""Lecturas: las tres familias de consulta, más los resúmenes."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any, Iterable, Optional

from .modelo import Accion


def _dia(valor: str | date | datetime) -> datetime:
    """Medianoche UTC del día indicado."""
    if isinstance(valor, datetime):
        return valor.astimezone(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    if isinstance(valor, date):
        return datetime(valor.year, valor.month, valor.day, tzinfo=timezone.utc)
    return datetime.fromisoformat(str(valor)[:10]).replace(tzinfo=timezone.utc)


def _limpio(documento: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    """Convierte el documento a algo que se pueda devolver por una API en JSON."""
    if documento is None:
        return None
    limpio: dict[str, Any] = {}
    for clave, valor in documento.items():
        if isinstance(valor, datetime):
            limpio[clave] = valor.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        elif isinstance(valor, dict):
            limpio[clave] = _limpio(valor) or {}
        elif isinstance(valor, list):
            limpio[clave] = [_limpio(v) if isinstance(v, dict) else v for v in valor]
        else:
            limpio[clave] = valor
    return limpio


class Consultas:
    """Se mezcla en `ClienteLogs`; usa su conexión y su registro de avisos."""

    async def auditoria_actor(
        self,
        actor_id: int,
        desde: str | date | datetime | None = None,
        hasta: str | date | datetime | None = None,
        acciones: Optional[Iterable[Any]] = None,
        limite: int = 50,
        salto: int = 0,
    ) -> list[dict[str, Any]]:
        """Qué hizo un actor entre dos fechas, de lo más reciente a lo más antiguo."""
        filtro: dict[str, Any] = {"actor.id": int(actor_id)}
        rango: dict[str, Any] = {}
        if desde:
            rango["$gte"] = _dia(desde)
        if hasta:
            rango["$lt"] = _dia(hasta) + timedelta(days=1)
        if rango:
            filtro["ocurrido_en"] = rango
        if acciones:
            filtro["accion"] = {"$in": [a.value if hasattr(a, "value") else str(a) for a in acciones]}
        return await self._leer("eventos", filtro, limite=limite, salto=salto, orden=-1)

    async def historial_entidad(
        self, tipo: str, id: int, limite: int = 50
    ) -> list[dict[str, Any]]:
        """Quién tocó esta entidad y cuándo."""
        return await self._leer(
            "eventos",
            {"entidad.tipo": tipo.upper(), "entidad.id": int(id)},
            limite=limite,
            orden=-1,
        )

    async def intentos_fallidos(
        self,
        desde: str | date | datetime | None = None,
        hasta: str | date | datetime | None = None,
        motivo: Optional[str] = None,
        limite: int = 100,
        salto: int = 0,
    ) -> list[dict[str, Any]]:
        """Intentos de acceso rechazados, del más reciente al más antiguo."""
        filtro: dict[str, Any] = {"accion": Accion.CUENTA_FALLAR.value}
        rango: dict[str, Any] = {}
        if desde:
            rango["$gte"] = _dia(desde)
        if hasta:
            rango["$lt"] = _dia(hasta) + timedelta(days=1)
        if rango:
            filtro["ocurrido_en"] = rango
        if motivo:
            filtro["metadatos.motivo"] = motivo
        return await self._leer("eventos", filtro, limite=limite, salto=salto, orden=-1)

    async def sesiones_en(
        self,
        desde: str | date | datetime | None = None,
        hasta: str | date | datetime | None = None,
        actor_id: Optional[int] = None,
        abiertas: Optional[bool] = None,
        limite: int = 100,
        salto: int = 0,
    ) -> list[dict[str, Any]]:
        """Lista de sesiones por rango: todas, de un actor, o sólo las que siguen abiertas."""
        filtro: dict[str, Any] = {}
        rango: dict[str, Any] = {}
        if desde:
            rango["$gte"] = _dia(desde)
        if hasta:
            rango["$lt"] = _dia(hasta) + timedelta(days=1)
        if rango:
            filtro["iniciada_en"] = rango
        if actor_id:
            filtro["actor.id"] = int(actor_id)
        if abiertas is True:
            filtro["cerrada_en"] = None
        elif abiertas is False:
            filtro["cerrada_en"] = {"$ne": None}
        return await self._leer("sesiones", filtro, limite=limite, salto=salto, orden=-1)

    async def sesiones_de_actor(self, actor_id: int, limite: int = 20) -> list[dict[str, Any]]:
        """Sesiones del actor, la más reciente primero."""
        return await self._leer("sesiones", {"actor.id": int(actor_id)}, limite=limite, orden=-1)

    async def sesion_completa(self, sesion_id: str) -> dict[str, Any]:
        """La sesión y sus pasos en orden, o `{"sesion": None, "pasos": []}`."""
        if not self.activo or self._base is None:
            return {"sesion": None, "pasos": []}
        try:
            sesion = await self._base["sesiones"].find_one({"_id": sesion_id})
            pasos = (
                await self._base["eventos"]
                .find({"sesion_id": sesion_id})
                .sort("ocurrido_en", 1)
                .to_list(length=None)
            )
        except Exception as error:  # noqa: BLE001 - un fallo de logs no debe tumbar la API
            self._avisar("no se pudo leer la sesión", error)
            return {"sesion": None, "pasos": []}
        return {"sesion": _limpio(sesion), "pasos": [_limpio(p) for p in pasos]}

    async def resumen_del_dia(self, dia: str | date | datetime | None = None) -> Optional[dict[str, Any]]:
        """Preagregado del día; `None` si todavía no se generó."""
        clave = (dia or date.today()).isoformat()[:10] if not isinstance(dia, str) else dia[:10]
        if not self.activo or self._base is None:
            return None
        try:
            documento = await self._base["resumen_diario"].find_one({"_id": clave})
        except Exception as error:  # noqa: BLE001
            self._avisar("no se pudo leer el resumen", error)
            return None
        return _limpio(documento)

    async def resumen_entre(
        self, desde: str | date, hasta: str | date
    ) -> list[dict[str, Any]]:
        """Resúmenes de un rango de días, para los informes."""
        inicio = (desde.isoformat() if not isinstance(desde, str) else desde)[:10]
        fin = (hasta.isoformat() if not isinstance(hasta, str) else hasta)[:10]
        if not self.activo or self._base is None:
            return []
        try:
            documentos = (
                await self._base["resumen_diario"]
                .find({"_id": {"$gte": inicio, "$lte": fin}})
                .sort("_id", 1)
                .to_list(length=None)
            )
        except Exception as error:  # noqa: BLE001
            self._avisar("no se pudieron leer los resúmenes", error)
            return []
        return [_limpio(d) for d in documentos]

    async def _leer(
        self,
        coleccion: str,
        filtro: dict[str, Any],
        limite: int,
        orden: int = -1,
        salto: int = 0,
    ) -> list[dict[str, Any]]:
        if not self.activo or self._base is None:
            return []
        campo = "ocurrido_en" if coleccion == "eventos" else "iniciada_en"
        try:
            documentos = (
                await self._base[coleccion]
                .find(filtro)
                # El `_id` lleva el instante delante: desempata y hace la paginación estable.
                .sort([(campo, orden), ("_id", orden)])
                .skip(max(salto, 0))
                .limit(max(limite, 1))
                .to_list(length=None)
            )
        except Exception as error:  # noqa: BLE001
            self._avisar(f"no se pudo leer {coleccion}", error)
            return []
        return [_limpio(d) for d in documentos]
