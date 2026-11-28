from fastapi import APIRouter, Depends, status, Body, Query
from typing import Optional
from sqlalchemy.orm import Session
from src.controllers.publicacion_controlador import Controlador_Publicacion
from src.config.database import get_db
from src.middleware.chequea_medio import dame_usuario_ahorita, dame_mascota_ahorita, pasen_contexto_opcional
from src.models.scheme_publicacion import (publicacion_crear, publicacion_respuesta, publicacion_editar, publicacion_editar_respuesta, 
publicacion_compartir, publicacion_compartir_respuesta, publicacion_muro_respuesta)

router = APIRouter(prefix="/api/publicaciones", tags=["PUBLICACIONES"])

@router.post("/Crear", response_model=publicacion_respuesta, status_code=status.HTTP_201_CREATED,)

def crear_publicacion(
    datos:publicacion_crear,
    db:Session = Depends(get_db),
    contexto: dict = Depends(dame_mascota_ahorita),
):
    return Controlador_Publicacion.crear_publicacion(
        datos=datos, contexto=contexto, db=db
    )


@router.patch("/{publi_id}/editar", response_model=publicacion_editar_respuesta, status_code=status.HTTP_200_OK)

def editar_publicacion(
    publi_id: int, 
    datos: publicacion_editar,
    db: Session = Depends(get_db),
    contexto: dict = Depends(dame_mascota_ahorita)):
    
    
    return Controlador_Publicacion.editar_publi(
        publi_id=publi_id,
        datos=datos,
        contexto=contexto,
        db=db
    ) 


@router.delete("/{publi_id}/borrar",status_code=status.HTTP_200_OK)
def borrar_publicacion(
    publi_id: int, 
    db: Session = Depends(get_db),
    contexto: dict = Depends(dame_mascota_ahorita)):

    return Controlador_Publicacion.elimar_publi(
        publi_id=publi_id,
        contexto=contexto,
        db=db
    )


@router.post("/{publi_id}/compartir", response_model=publicacion_compartir_respuesta, 
status_code=status.HTTP_201_CREATED)

def compartir_publicacion(
    publi_id: int,
    datos: publicacion_compartir = Body(default_factory=publicacion_compartir),
    db: Session = Depends(get_db),
    contexto: dict = Depends(dame_mascota_ahorita)
):
    return Controlador_Publicacion.compartir_publi(
        publicacion_origen_id=publi_id,
        datos=datos,
        contexto=contexto,
        db=db
    )


@router.get("/mascota/{mascota_id}/muro", response_model=publicacion_muro_respuesta, status_code=status.HTTP_200_OK)

def ver_muro_mascota(
    mascota_id: int,
    cursor: Optional[str] = Query(
        None, description="Token opaco devuelto en next_cursor para cargar la siguiente página."
    ),
    limite: int = Query(
        15, ge=1, le=50, description="Cantidad de publicaciones por pagina (maximo 50)"
    ),
    db: Session = Depends(get_db),
    contexto: Optional[dict] = Depends(pasen_contexto_opcional),
):

    return Controlador_Publicacion.consulta_muro(
        mascota_id=mascota_id,
        cursor=cursor,
        limite=limite,
        contexto=contexto,
        db=db
    )
