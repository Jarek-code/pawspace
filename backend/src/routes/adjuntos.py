"""Rutas de adjuntos: el puente entre FastAPI y el servicio de la OODB."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from pydantic import BaseModel, Field

from ..config import settings
from ..services.oodb import ClienteOodb, OodbError

router = APIRouter(prefix="/adjuntos", tags=["adjuntos"])

# Ruta pública con la que el frontend pide los archivos al backend.
RUTA_PUBLICA = "/adjuntos/archivo"


def cliente_oodb() -> ClienteOodb:
    """Cliente del servicio; se sustituye en las pruebas."""
    return ClienteOodb()


class AdjuntoNuevo(BaseModel):
    """Cuerpo para colgar un archivo."""

    tipo: str = Field(pattern="^(IMAGEN|VIDEO|imagen|video)$")
    url: str = Field(min_length=8, max_length=2048)
    posicion: int = Field(default=1, ge=1)
    duracion: Optional[int] = Field(default=None, ge=1, le=3600)


def _traducir(error: OodbError) -> HTTPException:
    codigo = error.codigo or status.HTTP_503_SERVICE_UNAVAILABLE
    if codigo >= 500:
        codigo = status.HTTP_503_SERVICE_UNAVAILABLE
    return HTTPException(status_code=codigo, detail=str(error))


@router.get("/salud")
async def salud(oodb: ClienteOodb = Depends(cliente_oodb)) -> dict:
    """Estado del almacén de objetos."""
    try:
        return await oodb.resumen()
    except OodbError as error:
        raise _traducir(error) from error


@router.get("/archivo/{nombre}")
async def archivo(
    nombre: str,
    oodb: ClienteOodb = Depends(cliente_oodb),
) -> Response:
    """Sirve un archivo guardado en la OODB."""
    try:
        contenido, tipo = await oodb.archivo(nombre)
    except OodbError as error:
        raise _traducir(error) from error
    return Response(content=contenido, media_type=tipo)


@router.post("/{tabla}/{registro_id}/subir", status_code=status.HTTP_201_CREATED)
async def subir(
    tabla: str,
    registro_id: int,
    archivo: UploadFile = File(...),
    posicion: int = Form(1),
    duracion: Optional[int] = Form(None),
    oodb: ClienteOodb = Depends(cliente_oodb),
) -> dict:
    """Recibe un archivo, lo guarda en la OODB y lo cuelga del contenido."""
    contenido = await archivo.read()
    try:
        subido = await oodb.subir(contenido, archivo.content_type or "")
        url = f"{settings.PUBLIC_URL.rstrip('/')}{RUTA_PUBLICA}/{subido['nombre']}"
        if subido.get("tipo") == "VIDEO":
            if duracion is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="un vídeo necesita duración",
                )
            adjunto = await oodb.adjuntar(
                tabla.upper(), registro_id, "VIDEO", url, posicion, duracion
            )
        else:
            adjunto = await oodb.adjuntar(
                tabla.upper(), registro_id, "IMAGEN", url, posicion, None
            )
    except OodbError as error:
        raise _traducir(error) from error
    return {**adjunto, "url": url, "nombre": subido["nombre"]}


@router.post("/{tabla}/{registro_id}", status_code=status.HTTP_201_CREATED)
async def anclar(
    tabla: str,
    registro_id: int,
    texto: Optional[str] = None,
    oodb: ClienteOodb = Depends(cliente_oodb),
) -> dict:
    """Ancla una publicación, historia o comentario recién creado."""
    try:
        return await oodb.anclar(tabla.upper(), registro_id, texto)
    except OodbError as error:
        raise _traducir(error) from error


@router.get("/{tabla}/{registro_id}")
async def listar(
    tabla: str,
    registro_id: int,
    oodb: ClienteOodb = Depends(cliente_oodb),
) -> dict:
    """Contenido anclado con sus adjuntos."""
    try:
        return await oodb.contenido(tabla.upper(), registro_id)
    except OodbError as error:
        raise _traducir(error) from error


@router.post("/{tabla}/{registro_id}/archivos", status_code=status.HTTP_201_CREATED)
async def colgar(
    tabla: str,
    registro_id: int,
    adjunto: AdjuntoNuevo,
    oodb: ClienteOodb = Depends(cliente_oodb),
) -> dict:
    """Cuelga una imagen o un vídeo del contenido."""
    try:
        return await oodb.adjuntar(
            tabla.upper(),
            registro_id,
            adjunto.tipo,
            adjunto.url,
            adjunto.posicion,
            adjunto.duracion,
        )
    except OodbError as error:
        raise _traducir(error) from error


@router.delete("/{tabla}/{registro_id}")
async def borrar(
    tabla: str,
    registro_id: int,
    oodb: ClienteOodb = Depends(cliente_oodb),
) -> dict:
    """Borra el contenido y sus adjuntos; se llama al eliminar la fila."""
    try:
        return await oodb.borrar(tabla.upper(), registro_id)
    except OodbError as error:
        raise _traducir(error) from error
