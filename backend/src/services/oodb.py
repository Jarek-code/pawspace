"""Cliente del servicio de la OODB, que es la fuente de verdad de los adjuntos.

La base relacional guarda el contenido de las publicaciones, historias y comentarios; los
archivos viven en la OODB, anclados a la fila por ``(tabla, registro_id)``. Este cliente es la
única puerta del backend hacia ese servicio.
"""

from __future__ import annotations

from typing import Any, Optional

import httpx

from src.config.config import settings

TABLAS = ("PUBLICACION", "HISTORIA", "COMENTARIO")


class OodbError(RuntimeError):
    """Fallo al hablar con el servicio de la OODB."""

    def __init__(self, mensaje: str, codigo: int = 0) -> None:
        super().__init__(mensaje)
        self.codigo = codigo


class ClienteOodb:
    """Cliente asíncrono del servicio de objetos.

    Con ``OODB_URL`` vacío el cliente queda deshabilitado: ``disponible`` es ``False`` y las
    llamadas fallan con :class:`OodbError`, que las rutas traducen a un 503 explícito en vez de
    romper la aplicación.
    """

    def __init__(
        self,
        base: Optional[str] = None,
        token: Optional[str] = None,
        tiempo_max: Optional[float] = None,
        transporte: Optional[httpx.AsyncBaseTransport] = None,
    ) -> None:
        self.base = (base if base is not None else settings.OODB_URL).rstrip("/")
        self.token = token if token is not None else settings.OODB_TOKEN
        self.tiempo_max = tiempo_max if tiempo_max is not None else settings.OODB_TIEMPO_MAX
        self._cliente = httpx.AsyncClient(
            base_url=self.base or "http://oodb.invalido",
            timeout=self.tiempo_max,
            transport=transporte,
        )

    @property
    def disponible(self) -> bool:
        """Si hay un servicio configurado."""
        return bool(self.base)

    async def cerrar(self) -> None:
        await self._cliente.aclose()

    async def _pedir(
        self,
        metodo: str,
        ruta: str,
        cuerpo: Optional[dict[str, Any]] = None,
        administracion: bool = False,
    ) -> dict[str, Any]:
        if not self.disponible:
            raise OodbError("el servicio de adjuntos no está configurado (OODB_URL)")
        cabeceras = {}
        if administracion and self.token:
            cabeceras["Authorization"] = f"Bearer {self.token}"
        try:
            respuesta = await self._cliente.request(
                metodo, ruta, json=cuerpo, headers=cabeceras
            )
        except httpx.HTTPError as error:
            raise OodbError(f"no se pudo contactar al servicio de adjuntos: {error}") from error
        if respuesta.status_code >= 400:
            raise OodbError(_mensaje(respuesta), respuesta.status_code)
        if not respuesta.content:
            return {}
        return respuesta.json()

    async def resumen(self) -> dict[str, Any]:
        """Estado del almacén de objetos."""
        return await self._pedir("GET", "/salud")

    async def anclar(
        self, tabla: str, registro_id: int, texto: Optional[str] = None
    ) -> dict[str, Any]:
        """Ancla la fila; repetirlo no duplica el contenido."""
        _validar(tabla, registro_id)
        return await self._pedir(
            "POST", f"/contenidos/{tabla}/{registro_id}", {"texto": texto}
        )

    async def contenido(self, tabla: str, registro_id: int) -> dict[str, Any]:
        """Contenido anclado con sus adjuntos, en orden de posición."""
        _validar(tabla, registro_id)
        return await self._pedir("GET", f"/contenidos/{tabla}/{registro_id}")

    async def adjuntos(self, tabla: str, registro_id: int) -> list[dict[str, Any]]:
        """Sólo la lista de adjuntos."""
        return (await self.contenido(tabla, registro_id)).get("adjuntos", [])

    async def adjuntar(
        self,
        tabla: str,
        registro_id: int,
        tipo: str,
        url: str,
        posicion: int = 1,
        duracion: Optional[int] = None,
    ) -> dict[str, Any]:
        """Cuelga una imagen o un vídeo del contenido."""
        _validar(tabla, registro_id)
        cuerpo = {
            "tipo": tipo.upper(),
            "url": url,
            "posicion": posicion,
            "duracion": duracion,
        }
        return await self._pedir(
            "POST", f"/contenidos/{tabla}/{registro_id}/adjuntos", cuerpo
        )

    async def borrar(self, tabla: str, registro_id: int) -> dict[str, Any]:
        """Borra el contenido y, en cascada, sus adjuntos."""
        _validar(tabla, registro_id)
        return await self._pedir("DELETE", f"/contenidos/{tabla}/{registro_id}")

    async def quitar_adjunto(self, oid: int) -> dict[str, Any]:
        """Desengancha y borra un adjunto por su OID."""
        return await self._pedir("DELETE", f"/adjuntos/{oid}")

    async def subir(self, contenido: bytes, tipo: str) -> dict[str, Any]:
        """Sube un archivo y devuelve su nombre y su ruta en el servicio."""
        if not self.disponible:
            raise OodbError("el servicio de adjuntos no está configurado (OODB_URL)")
        if not contenido:
            raise OodbError("el archivo está vacío")
        try:
            respuesta = await self._cliente.post(
                "/archivos", content=contenido, headers={"content-type": tipo}
            )
        except httpx.HTTPError as error:
            raise OodbError(f"no se pudo subir el archivo: {error}") from error
        if respuesta.status_code >= 400:
            raise OodbError(_mensaje(respuesta), respuesta.status_code)
        return respuesta.json()

    async def archivo(self, nombre: str) -> tuple[bytes, str]:
        """Descarga un archivo guardado; devuelve el contenido y su tipo."""
        if not self.disponible:
            raise OodbError("el servicio de adjuntos no está configurado (OODB_URL)")
        try:
            respuesta = await self._cliente.get(f"/archivos/{nombre}")
        except httpx.HTTPError as error:
            raise OodbError(f"no se pudo leer el archivo: {error}") from error
        if respuesta.status_code >= 400:
            raise OodbError(_mensaje(respuesta), respuesta.status_code)
        return respuesta.content, respuesta.headers.get(
            "content-type", "application/octet-stream"
        )

    async def revisar(self) -> dict[str, Any]:
        """Pide una reconciliación con MariaDB."""
        return await self._pedir("POST", "/revisar", administracion=True)

    async def compactar(self) -> dict[str, Any]:
        """Pide compactar el almacén."""
        return await self._pedir("POST", "/compactar", administracion=True)


def _validar(tabla: str, registro_id: int) -> None:
    if tabla.upper() not in TABLAS:
        raise OodbError(f"tabla desconocida «{tabla}»")
    if registro_id <= 0:
        raise OodbError("el id de la fila debe ser positivo")


def _mensaje(respuesta: httpx.Response) -> str:
    try:
        return respuesta.json().get("error", respuesta.text)
    except ValueError:
        return respuesta.text or f"error {respuesta.status_code}"
