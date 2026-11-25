import jwt
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from src.config.database import get_db, get_logs
from src.models.scheme_c_mascota import MascotaCrear
from src.controllers.mascota_controlador import Mascota_Controlador
from src.services.mascota_servicio import MascotaSeleccion
from src.middleware.chequea_medio import dame_usuario_ahorita, Llave_super_secreta, Algoritmo_Cifrador, oauth2_scheme
from pawspace_logs import ClienteLogs

router = APIRouter(prefix="/api/mascota", tags=["Mascota"])

@router.post("/Crear-Mascota")
def crear_nueva_mascota(
    mascota_in : MascotaCrear,
    db:Session = Depends(get_db),
    usuario_id: int = Depends(dame_usuario_ahorita),
    logs: ClienteLogs = Depends(get_logs)
):
    
    return Mascota_Controlador.crear_mascota(mascota_in, usuario_id, db) #, logs


@router.post("/{mascota_id}/seleccionar")
def escoger_mascota(
    mascota_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    usuario_id: int = Depends(dame_usuario_ahorita)
):

    payload = jwt.decode(token, Llave_super_secreta, algorithms=[Algoritmo_Cifrador])
    sesion_id = payload.get("sid")

    return MascotaSeleccion.seleccion_mascota(
        db=db,
        usuario_id=usuario_id,
        mascota_id=mascota_id,
        sesion_id=sesion_id
    )
