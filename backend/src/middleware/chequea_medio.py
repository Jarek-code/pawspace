import jwt
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from src.config.database import get_db

Llave_super_secreta ="odio israel"
Algoritmo_Cifrador = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/usuarios/login")

def dame_usuario_ahorita(token:str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> int:
    excepcion_nao_nao = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido o expirado")

    try:
        payload = jwt.decode(token, Llave_super_secreta, algorithms=[Algoritmo_Cifrador])
        usuario_id = int (payload.get("sub"))
        token_iat = payload.get("iat")
    
    except Exception:
        raise excepcion_nao_nao

    consulta = text("SELECT actualizado_en, activo FROM USUARIO WHERE id = :id")
    resultado = db.execute(consulta,{"id": usuario_id}).fetchone()

    if not resultado:
        raise excepcion_nao_nao

    ultima_update_db, activo = resultado

    if not activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta desactivada")

    token_dado_en = (datetime.fromtimestamp(token_iat, tz=timezone.utc)
    if isinstance(token_iat, (int, float)) else token_iat)

    if ultima_update_db.tzinfo is None:
        ultima_update_db = ultima_update_db.replace(tzinfo=timezone.utc)

    if token_iat < ultima_update_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesion expirada. Porfavor iniciar sesion nuevamente"
        )
    return usuario_id