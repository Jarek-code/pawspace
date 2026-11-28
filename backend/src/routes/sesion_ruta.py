import jwt
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from src.config.database import get_db, get_logs
from src.middleware.chequea_medio import dame_usuario_ahorita
from src.controllers.sesion_controlador import Sesion_Controlador
from src.models.scheme_sesion import SesionRespuesta, CerrarSesion
from src.middleware.chequea_medio import (Llave_super_secreta, Algoritmo_Cifrador, oauth2_scheme)

router = APIRouter (prefix="/api/sesiones", tags=["SESIONES"])

@router.get("", response_model=list[SesionRespuesta])
def listar_sesiones(
    db: Session = Depends(get_db),
    usuario_id: int = Depends(dame_usuario_ahorita),
):
    return Sesion_Controlador.listar(db, usuario_id)


@router.delete("/{sesion_id}/una")
async def cerrar_sesion(
    sesion_id: str,
    datos: CerrarSesion,
    request: Request,
    db: Session = Depends(get_db),
    logs = Depends(get_logs),
    usuario_id: int = Depends(dame_usuario_ahorita)
):
    return await Sesion_Controlador.cerrar(db, logs, request, sesion_id, usuario_id, datos.motivo)


@router.delete("")   
async def cerrar_todas(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    logs = Depends(get_logs),
    usuario_id: int = Depends(dame_usuario_ahorita),
):
    payload = jwt.decode(token, Llave_super_secreta, algorithms=[Algoritmo_Cifrador])
    sesion_actual = payload.get("sid")
    if not sesion_actual:
        raise HTTPException(status_code=401, detail="Token sin sesion")
    return await Sesion_Controlador.cerrar_todas(db, logs, sesion_actual, usuario_id)


@router.post("/Cerrar_Sesion")
async def cerrar_la_mia(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    logs = Depends(get_logs),
    usuario_id: int = Depends(dame_usuario_ahorita)
 ):
    payload = jwt.decode(token, Llave_super_secreta, algorithms=[Algoritmo_Cifrador])
    sid = payload.get("sid")

    if not sid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token sin sesion.")
    
    return await Sesion_Controlador.cerrar(db, logs, None, sid, usuario_id, "USUARIO")