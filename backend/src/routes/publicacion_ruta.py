from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from src.controllers.publicacion_controlador import Controlador_Publicacion
from src.config.database import get_db
from src.middleware.chequea_medio import dame_usuario_ahorita,dame_mascota_ahorita
from src.models.scheme_publicacion import publicacion_crear, publicacion_respuesta

router = APIRouter(prefix="/api/publicaciones", tags=["PUBLICACIONES"])

@router.post("/", response_model=publicacion_respuesta, status_code=status.HTTP_201_CREATED,)

def crear_publicacion(
    datos:publicacion_crear,
    db:Session = Depends(get_db),
    contexto: dict = Depends(dame_mascota_ahorita),
):
    return Controlador_Publicacion.crear_publicacion(
        datos=datos, contexto=contexto, db=db
    )
