import jwt
import os
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from src.config.database import get_db

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
        if token_dado_en <ultima_update_db:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Sesion expirada. Porfavor iniciar sesion nuevamente"
                )

    return usuario_id