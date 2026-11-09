"""Cliente del registro de acciones y sesiones.

Escribe por lotes desde una cola en memoria y **nunca lanza hacia la petición**: si MongoDB
falla, avisa por el registro y cuenta lo descartado. Sin `url`, queda deshabilitado y las
llamadas no hacen nada, para que la API pueda arrancar sin MongoDB.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import secrets
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from .consultas import Consultas
from .modelo import CATALOGO, Accion, Actor, hash_identificador, origen_de

# Operaciones que se pueden encolar antes de empezar a descartar.
CAPACIDAD_COLA = 10_000

# Marca que se encola al cerrar para que el bucle vacíe y termine.
PARAR = "parar"

# Campos que espera el validador para una entidad.
TIPOS_ENTIDAD = ("PUBLICACION", "HISTORIA", "COMENTARIO", "MENSAJE", "USUARIO", "MASCOTA", "ADJUNTO")


def _ruta_cola() -> Path:
    """Archivo donde se guardan las operaciones cuando MongoDB no responde."""
    fijada = os.environ.get("LOGS_COLA", "").strip()
    if fijada:
        return Path(fijada)
    return Path.home() / ".pawspace" / "logs-pendientes.jsonl"


def _a_json(valor: Any) -> Any:
    """Serializa fechas para poder guardarlas en disco."""
    if isinstance(valor, datetime):
        return {"$fecha": valor.isoformat()}
    if isinstance(valor, dict):
        return {clave: _a_json(dato) for clave, dato in valor.items()}
    if isinstance(valor, (list, tuple)):
        return [_a_json(dato) for dato in valor]
    return valor


def _de_json(valor: Any) -> Any:
    """Devuelve las fechas a su tipo al recuperar la cola."""
    if isinstance(valor, dict):
        if set(valor) == {"$fecha"}:
            return datetime.fromisoformat(valor["$fecha"])
        return {clave: _de_json(dato) for clave, dato in valor.items()}
    if isinstance(valor, list):
        return [_de_json(dato) for dato in valor]
    return valor


def _instante() -> datetime:
    return datetime.now(timezone.utc)


def _nuevo_id(prefijo: str) -> str:
    """Identificador ordenable por tiempo y único: `evt_<ms><aleatorio>`."""
    return f"{prefijo}_{int(time.time() * 1000):013x}{secrets.token_hex(6)}"


def _documento_actor(actor: Actor | dict[str, Any]) -> dict[str, Any]:
    return actor.como_documento() if isinstance(actor, Actor) else dict(actor)


def _documento_entidad(valor: Optional[tuple[str, int] | dict[str, Any]]) -> Optional[dict[str, Any]]:
    if valor is None:
        return None
    if isinstance(valor, dict):
        return valor
    tipo, identificador = valor
    return {"tipo": str(tipo).upper(), "id": int(identificador)}


class ClienteLogs(Consultas):
    """Registro de acciones y sesiones sobre MongoDB.

    ```python
    logs = ClienteLogs(url=MONGO_URL, bd="pawspace_logs", sal_ip=LOGS_SAL)
    await logs.iniciar()
    await logs.evento(Accion.PUBLICACION_CREAR, mascota(12, 3), entidad=("PUBLICACION", 1207))
    await logs.cerrar()
    ```
    """

    def __init__(
        self,
        url: str = "",
        bd: str = "pawspace_logs",
        *,
        sal_ip: str = "",
        lote: int = 100,
        espera_ms: int = 500,
        muestreo: float = 1.0,
        retencion_eventos: int = 180,
        retencion_sesiones: int = 400,
        cola: str = "",
        registrador: Optional[logging.Logger] = None,
    ) -> None:
        self.url = (url or "").strip()
        self.bd = bd
        self.sal_ip = sal_ip
        self.lote = max(int(lote), 1)
        self.espera = max(int(espera_ms), 10) / 1000
        self.muestreo = min(max(float(muestreo), 0.0), 1.0)
        self.retencion_eventos = max(int(retencion_eventos), 1)
        self.retencion_sesiones = max(int(retencion_sesiones), 1)
        self.escritos = 0
        self.descartados = 0
        self.encolados = 0
        self.cola = Path(cola) if cola else _ruta_cola()
        self._registro = registrador or logging.getLogger("pawspace_logs")
        self._cliente: Any = None
        self._base: Any = None
        self._cola: Optional[asyncio.Queue] = None
        self._tarea: Optional[asyncio.Task] = None

    @classmethod
    def desde_entorno(cls, **ajustes: Any) -> "ClienteLogs":
        """Crea el cliente con las variables de entorno, sin configurar nada a mano.

        Lee `MONGO_URL`, `MONGO_BD`, `LOGS_SAL`, `LOGS_RETENCION_DIAS` y `LOGS_MUESTREO`.
        """
        import os

        valores: dict[str, Any] = {
            "url": os.environ.get("MONGO_URL", ""),
            "bd": os.environ.get("MONGO_BD", "pawspace_logs"),
            "sal_ip": os.environ.get("LOGS_SAL", ""),
            "retencion_eventos": int(os.environ.get("LOGS_RETENCION_DIAS", "180")),
            "muestreo": float(os.environ.get("LOGS_MUESTREO", "0.1")),
        }
        valores.update(ajustes)
        return cls(**valores)

    @property
    def activo(self) -> bool:
        """Si hay un MongoDB configurado."""
        return bool(self.url)

    async def iniciar(self) -> None:
        """Prepara índices y catálogo, y arranca la escritura por lotes."""
        if not self.activo:
            self._registro.info("registro de logs deshabilitado: no hay MONGO_URL")
            return
        from pymongo import AsyncMongoClient

        self._cliente = AsyncMongoClient(self.url, tz_aware=True, serverSelectionTimeoutMS=2000)
        self._base = self._cliente[self.bd]
        await self._preparar()
        self._cola = asyncio.Queue(maxsize=CAPACIDAD_COLA)
        await self._volcar_cola()
        self._tarea = asyncio.create_task(self._bucle())

    async def cerrar(self) -> None:
        """Vacía la cola y cierra la conexión, sin cortar escrituras a medias."""
        if self._tarea is not None:
            # Aviso al bucle para que vacíe lo pendiente y termine por su cuenta.
            try:
                if self._cola is not None:
                    await asyncio.wait_for(self._cola.put((PARAR,)), timeout=1)
                await asyncio.wait_for(self._tarea, timeout=10)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                self._tarea.cancel()
                try:
                    await self._tarea
                except asyncio.CancelledError:
                    pass
            except Exception as error:  # noqa: BLE001
                self._avisar("no se pudo cerrar la escritura por lotes", error)
            self._tarea = None
        await self._vaciar()
        if self._cliente is not None:
            try:
                await self._cliente.close()
            except Exception as error:  # noqa: BLE001
                self._avisar("no se pudo cerrar la conexión de logs", error)
            self._cliente = None
        self._base = None
        self._cola = None

    async def disponible(self) -> bool:
        """Si el registro esta configurado y responde en este momento.

        Sirve para que quien integre datos de las dos fuentes pueda decir si la
        parte de auditoria esta al dia o si el resultado viene incompleto.
        """
        if not self.activo or self._base is None:
            return False
        try:
            await self._base.command("ping")
            return True
        except Exception as error:  # noqa: BLE001 - un fallo de logs no debe tumbar la API
            self._avisar("el registro no responde", error)
            return False

    async def __aenter__(self) -> "ClienteLogs":
        await self.iniciar()
        return self

    async def __aexit__(self, *_excepcion: Any) -> None:
        await self.cerrar()

    # ---------------------------------------------------------------- escritura

    async def evento(
        self,
        accion: Accion | str,
        actor: Actor | dict[str, Any],
        *,
        sesion: Optional[str] = None,
        entidad: Optional[tuple[str, int] | dict[str, Any]] = None,
        resultado: str = "ok",
        duracion_ms: int = 0,
        metadatos: Optional[dict[str, Any]] = None,
        origen: Optional[dict[str, Any]] = None,
        id_evento: Optional[str] = None,
    ) -> str:
        """Registra una acción y devuelve su identificador.

        El vocabulario se valida aquí: una acción desconocida falla antes de llegar a MongoDB.
        `id_evento` permite que el llamador imponga un identificador determinista y reintentar
        sin duplicar.
        """
        elegida = Accion(accion)
        identificador = id_evento or _nuevo_id("evt")
        documento = {
            "_id": identificador,
            "ocurrido_en": _instante(),
            "sesion_id": sesion,
            "actor": _documento_actor(actor),
            "accion": elegida.value,
            "categoria": elegida.categoria,
            "entidad": _documento_entidad(entidad),
            "resultado": "error" if str(resultado).lower() == "error" else "ok",
            "duracion_ms": int(duracion_ms or 0),
            "origen": origen,
            "metadatos": metadatos or None,
        }
        self._encolar(("insertar", "eventos", documento))
        return identificador

    async def abrir_sesion(
        self,
        actor: Actor | dict[str, Any],
        origen: Optional[dict[str, Any]] = None,
    ) -> str:
        """Abre una sesión y devuelve su identificador, haya o no conexión."""
        identificador = _nuevo_id("ses")
        if self._base is None:
            return identificador
        ahora = _instante()
        documento = {
            "_id": identificador,
            "actor": _documento_actor(actor),
            "iniciada_en": ahora,
            "ultima_actividad_en": ahora,
            "cerrada_en": None,
            "motivo_fin": None,
            "pasos": 0,
            "eventos": 0,
            "duracion_seg": None,
            "origen": origen,
        }
        try:
            await self._base["sesiones"].insert_one(documento)
        except Exception as error:  # noqa: BLE001
            self._avisar("no se pudo abrir la sesión", error)
        return identificador

    async def iniciar_sesion(
        self,
        actor: Actor | dict[str, Any],
        origen: Optional[dict[str, Any]] = None,
    ) -> str:
        """Abre la sesión y registra el acceso en una sola llamada.

        Es lo que necesita el endpoint de login:

        ```python
        sesion = await logs.iniciar_sesion(mascota(12, 3), origen=logs.origen(request))
        ```

        Devuelve el identificador de sesión aunque MongoDB no esté disponible.
        """
        sesion = await self.abrir_sesion(actor, origen)
        await self.evento(Accion.CUENTA_ACCEDER, actor, sesion=sesion, origen=origen)
        await self.tocar_sesion(sesion)
        return sesion

    async def intento_fallido(
        self,
        identificador: str,
        motivo: str = "credenciales",
        *,
        actor: Optional[Actor | dict[str, Any]] = None,
        origen: Optional[dict[str, Any]] = None,
        metadatos: Optional[dict[str, Any]] = None,
    ) -> str:
        """Registra un intento de acceso fallido.

        No abre sesión: un intento rechazado no es una sesión. Del identificador se guarda
        sólo su hash, nunca el correo ni el usuario en claro. Si la cuenta es conocida se pasa
        `actor`; si no, queda como `SISTEMA` y el hash permite agrupar los intentos.

        ```python
        await logs.intento_fallido(correo, "credenciales", origen=logs.origen(request))
        ```
        """
        datos = {"motivo": motivo, "identificador_hash": hash_identificador(identificador, self.sal_ip)}
        if metadatos:
            datos.update(metadatos)
        return await self.evento(
            Accion.CUENTA_FALLAR,
            actor or Actor("SISTEMA", 0),
            resultado="error",
            origen=origen,
            metadatos=datos,
        )

    async def cuenta_bloqueada(
        self,
        identificador: str,
        actor: Optional[Actor | dict[str, Any]] = None,
        *,
        motivo: str = "bloqueada",
        origen: Optional[dict[str, Any]] = None,
    ) -> str:
        """Registra que la cuenta quedó bloqueada por intentos repetidos."""
        return await self.intento_fallido(
            identificador, motivo, actor=actor, origen=origen, metadatos={"bloqueo": True}
        )

    async def terminar_sesion(self, sesion_id: str, motivo: str = "logout") -> None:
        """Registra la salida y cierra la sesión en una sola llamada."""
        if not sesion_id or self._base is None:
            return
        try:
            documento = await self._base["sesiones"].find_one({"_id": sesion_id}, {"actor": 1})
        except Exception as error:  # noqa: BLE001
            self._avisar("no se pudo leer la sesión para cerrarla", error)
            documento = None
        actor = (documento or {}).get("actor") or Actor("USUARIO", 0).como_documento()
        await self.evento(Accion.CUENTA_SALIR, actor, sesion=sesion_id)
        await self.cerrar_sesion(sesion_id, motivo)

    async def tocar_sesion(self, sesion_id: Optional[str]) -> None:
        """Marca actividad en la sesión: último acceso y un paso más."""
        if not sesion_id:
            return
        self._encolar(
            (
                "actualizar",
                "sesiones",
                {"_id": sesion_id},
                {"$set": {"ultima_actividad_en": _instante()}, "$inc": {"pasos": 1, "eventos": 1}},
            )
        )

    async def cerrar_sesion(self, sesion_id: str, motivo: str = "logout") -> None:
        """Cierra la sesión y calcula su duración."""
        if self._base is None or not sesion_id:
            return
        ahora = _instante()
        try:
            await self._base["sesiones"].update_one(
                {"_id": sesion_id},
                [
                    {
                        "$set": {
                            "cerrada_en": ahora,
                            "motivo_fin": motivo,
                            "duracion_seg": {
                                "$divide": [{"$subtract": [ahora, "$iniciada_en"]}, 1000]
                            },
                        }
                    }
                ],
            )
        except Exception as error:  # noqa: BLE001
            self._avisar("no se pudo cerrar la sesión", error)

    def origen(self, peticion: Any) -> dict[str, Any]:
        """Origen de una petición, con la IP hasheada con la sal del cliente."""
        return origen_de(peticion, self.sal_ip)

    # ----------------------------------------------------------------- interno

    def _encolar(self, operacion: tuple[Any, ...]) -> None:
        if self._cola is None:
            return
        try:
            self._cola.put_nowait(operacion)
        except asyncio.QueueFull:
            self.descartados += 1
            self._registro.warning("cola de logs llena: se descarta una operación")

    async def _vaciar(self) -> None:
        """Aplica lo que quede en la cola, para no perder eventos al cerrar."""
        if self._cola is None:
            return
        pendientes: list[tuple[Any, ...]] = []
        while True:
            try:
                pendientes.append(self._cola.get_nowait())
            except asyncio.QueueEmpty:
                break
        if pendientes:
            await self._aplicar(pendientes)

    async def _bucle(self) -> None:
        pendientes: list[tuple[Any, ...]] = []
        while True:
            try:
                pendientes.append(await asyncio.wait_for(self._cola.get(), timeout=self.espera))
                while len(pendientes) < self.lote:
                    try:
                        pendientes.append(self._cola.get_nowait())
                    except asyncio.QueueEmpty:
                        break
            except asyncio.TimeoutError:
                pass
            except asyncio.CancelledError:
                await self._aplicar(pendientes)
                raise
            if pendientes and pendientes[-1][0] == PARAR:
                await self._aplicar([p for p in pendientes if p[0] != PARAR])
                return
            if pendientes:
                await self._aplicar(pendientes)
                pendientes = []

    async def _aplicar(self, operaciones: list[tuple[Any, ...]], *, respaldo: bool = True) -> bool:
        """Escribe el lote; si falla, lo deja en disco para reenviarlo después.

        Devuelve si el lote se pudo aplicar. Con `respaldo` en falso (reenvío de la
        cola) no se vuelve a escribir el archivo, para no duplicar operaciones.
        """
        if not operaciones or self._base is None:
            return False
        from pymongo import UpdateOne

        inserciones: dict[str, list[dict[str, Any]]] = defaultdict(list)
        actualizaciones: dict[str, list[Any]] = defaultdict(list)
        for operacion in operaciones:
            if operacion[0] == "insertar":
                inserciones[operacion[1]].append(operacion[2])
            else:
                actualizaciones[operacion[1]].append(UpdateOne(operacion[2], operacion[3]))
        try:
            for coleccion, documentos in inserciones.items():
                await self._base[coleccion].insert_many(documentos, ordered=False)
                self.escritos += len(documentos)
            for coleccion, lista in actualizaciones.items():
                await self._base[coleccion].bulk_write(lista, ordered=False)
            return True
        except Exception as error:  # noqa: BLE001 - jamás hacia la petición
            if respaldo:
                self._guardar_en_cola(operaciones)
            else:
                self.encolados += len(operaciones)
            self._avisar(
                f"se guardaron {len(operaciones)} operaciones de log para después "
                f"(¿MongoDB caído?)",
                error,
            )
            return False

    def _guardar_en_cola(self, operaciones: list[tuple[Any, ...]]) -> None:
        """Añade el lote al archivo de pendientes, una operación por línea."""
        try:
            self.cola.parent.mkdir(parents=True, exist_ok=True)
            with self.cola.open("a", encoding="utf-8") as archivo:
                for operacion in operaciones:
                    if operacion[0] == "insertar":
                        linea = {"o": "i", "c": operacion[1], "d": _a_json(operacion[2])}
                    else:
                        linea = {
                            "o": "u",
                            "c": operacion[1],
                            "f": _a_json(operacion[2]),
                            "u": _a_json(operacion[3]),
                        }
                    archivo.write(json.dumps(linea, ensure_ascii=False) + "\n")
            self.encolados += len(operaciones)
        except Exception as error:  # noqa: BLE001
            self.descartados += len(operaciones)
            self._avisar("no se pudo guardar la cola de pendientes", error)

    async def _volcar_cola(self) -> None:
        """Reenvía lo pendiente cuando MongoDB vuelve a responder."""
        if self._base is None or not self.cola.exists():
            return
        try:
            lineas = self.cola.read_text(encoding="utf-8").splitlines()
        except OSError as error:
            self._avisar("no se pudo leer la cola de pendientes", error)
            return

        operaciones: list[tuple[Any, ...]] = []
        for linea in lineas:
            try:
                dato = json.loads(linea)
            except ValueError:
                continue
            if dato.get("o") == "i":
                operaciones.append(("insertar", dato["c"], _de_json(dato["d"])))
            elif dato.get("o") == "u":
                operaciones.append(
                    ("actualizar", dato["c"], _de_json(dato["f"]), _de_json(dato["u"]))
                )

        if not operaciones:
            self._borrar_cola()
            return

        for inicio in range(0, len(operaciones), self.lote):
            trozo = operaciones[inicio : inicio + self.lote]
            if not await self._aplicar(trozo, respaldo=False):
                return
        self._registro.info("cola de logs reenviada: %s operaciones", len(operaciones))
        self._borrar_cola()

    def _borrar_cola(self) -> None:
        try:
            self.cola.unlink()
        except OSError:
            pass

    async def _preparar(self) -> None:
        """Crea índices y catálogo si faltan; es idempotente."""
        from pymongo import ASCENDING, DESCENDING, UpdateOne

        try:
            eventos = self._base["eventos"]
            await eventos.create_index(
                [("actor.id", ASCENDING), ("ocurrido_en", DESCENDING)], name="por_actor"
            )
            await eventos.create_index(
                [
                    ("entidad.tipo", ASCENDING),
                    ("entidad.id", ASCENDING),
                    ("ocurrido_en", DESCENDING),
                ],
                name="por_entidad",
            )
            await eventos.create_index(
                [("sesion_id", ASCENDING), ("ocurrido_en", ASCENDING)], name="por_sesion"
            )
            await eventos.create_index(
                [("accion", ASCENDING), ("ocurrido_en", DESCENDING)], name="por_accion"
            )
            await eventos.create_index(
                "ocurrido_en",
                name="purga_eventos",
                expireAfterSeconds=self.retencion_eventos * 86400,
            )

            sesiones = self._base["sesiones"]
            await sesiones.create_index(
                [("actor.id", ASCENDING), ("iniciada_en", DESCENDING)], name="por_actor"
            )
            await sesiones.create_index(
                [("ultima_actividad_en", DESCENDING)], name="actividad"
            )
            await sesiones.create_index([("iniciada_en", DESCENDING)], name="por_fecha")
            await sesiones.create_index(
                "ultima_actividad_en",
                name="purga_sesiones",
                expireAfterSeconds=self.retencion_sesiones * 86400,
            )

            catalogo = [
                UpdateOne(
                    {"_id": clave},
                    {
                        "$set": {
                            "categoria": categoria,
                            "descripcion": descripcion,
                            "sensible": sensible,
                        }
                    },
                    upsert=True,
                )
                for clave, (categoria, descripcion, sensible) in CATALOGO.items()
            ]
            await self._base["acciones"].bulk_write(catalogo, ordered=False)
        except Exception as error:  # noqa: BLE001
            self._avisar("no se pudo preparar el registro (índices o catálogo)", error)

    def _avisar(self, mensaje: str, error: BaseException) -> None:
        # El error de un servidor caído ocupa líneas y líneas: basta con la primera frase.
        detalle = str(error).split("\n")[0][:200]
        self._registro.warning("%s: %s", mensaje, detalle)
