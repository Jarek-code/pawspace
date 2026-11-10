from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.config.database import get_db, get_logs
from src.models.scheme_c_mascota import MascotaCrear
from src.controllers.mascota_controlador import Mascota_Controlador
from src.middleware.chequea_medio import dame_usuario_ahorita

router = APIRouter(prefix="/api/mascota", tags=["Mascota"])

@router.post("/Crear-Mascota")
def crear_nueva_mascota(
    mascota_in : MascotaCrear,
    db:Session = Depends(get_db),
    usuario_id: int = Depends(dame_usuario_ahorita)
):
    return Mascota_Controlador.crear_mascota(mascota_in, usuario_id, db)
