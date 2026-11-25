import jwt
import os
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from src.config.database import get_db
from src.models.USUARIO import Usuario
from src.models.MASCOTA import Mascota, UsuarioMascota

Llave_super_secreta = "odio israel"
Algoritmo_Cifrador = "HS256"
#oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/usuarios/login")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/usuarios/token")

def credenciales_invalidas() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Token invalido o expirado")

def dame_usuario_ahorita(token:str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> int:
    

    #Decodificar el token
    try:
        payload = jwt.decode(token, Llave_super_secreta, algorithms=[Algoritmo_Cifrador])
        usuario_id = int(payload.get("sub"))
        token_iat = payload.get("iat")
    
    except Exception:
        raise credenciales_invalidas()
    
    if token_iat is None:
        raise credenciales_invalidas()

    if isinstance(token_iat, str):
        try:
            token_iat = float(token_iat)
        except ValueError:
            credenciales_invalidas()

    token_dado_en = datetime.fromtimestamp(token_iat, tz=timezone.utc)

    #Comprueba que la cuenta exista o este activa
    try:
        resultado = db.execute(text(
        "SELECT u.actualizado_en, u.activo FROM USUARIO u WHERE u.id = :id"
        ), {"id": usuario_id}).fetchone()
    #{str:(e)}
    except Exception as e:
        print(f"Error consultado usuario {usuario_id} : {e}")
        raise credenciales_invalidas() 

    if resultado is None:
        raise credenciales_invalidas()
          
    ultima_update_db, activo = resultado

    if not activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta desactivada")


    token_dado_en = (datetime.fromtimestamp(token_iat, tz = timezone.utc)
    if isinstance(token_iat, (int, float))
    else token_iat)
    
    if ultima_update_db is not None:
        if ultima_update_db.tzinfo is None:
            ultima_update_db = ultima_update_db.replace(tzinfo=timezone.utc)
        if token_dado_en < ultima_update_db:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Sesion expirada. Porfavor iniciar sesion nuevamente"
                )

    return usuario_id

#La seccion dame mascota ahorita tiene la funcionalidad de que debas seleccionar una mascota al inicio para poder realizar las acciones
#de publicar, comentar, dar like, etc.

def dame_mascota_ahorita(token: str = Depends(oauth2_scheme), db:Session = Depends(get_db))->dict:

    usuario_id = dame_usuario_ahorita (token=token, db=db)

    payload = jwt.decode(token, Llave_super_secreta, algorithms=[Algoritmo_Cifrador])
    mascota_id_xd = payload.get("mid")
    sesion_id = payload.get("sid")

    if mascota_id_xd is None:
        if sesion_id:
            mascota_id_xd = db.execute(text("""
                SELECT mascota_id
                  FROM SESION
                 WHERE id = :sid
                   AND usuario_id = :uid
                   AND cerrada_en IS NULL
                   AND expira_en > NOW()
            """), {
                "sid": sesion_id,
                "uid": usuario_id,
            }).scalar()

    if mascota_id_xd is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Primero debes seleccionar una mascota, antes de realizar cualquier accion.")

    mascota_id = int(mascota_id_xd)

    mascota = (
        db.query(Mascota.id, Mascota.eliminada_en)
        .filter(Mascota.id == mascota_id)
        .first()
    )

    if not mascota or mascota.eliminada_en is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mascota no encontrada o fue eliminada.")

    vinculo = (
        db.query(UsuarioMascota)
        .filter(
            UsuarioMascota.usuario_id == usuario_id,
            UsuarioMascota.mascota_id == mascota_id)
            .first()
    )

    if not vinculo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos sobre esta mascota.")

    return{
        "usuario_id": usuario_id,
        "mascota_id": mascota_id,
        "sesion_id" : sesion_id
    }

