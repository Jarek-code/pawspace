from fastapi import Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.middleware.chequea_medio import dame_mascota_ahorita, dame_usuario_ahorita

def dame_rol(*roles: str):
    
    def de_canela(usuario_id: int = Depends(dame_usuario_ahorita), db: Session = Depends(get_db)) -> int:
        
        rol = db.execute(text("SELECT rol FROM USUARIO WHERE id = :id"),
        {"id":usuario_id}).scalar()

        if not rol in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Sin permisos.")
        
        return usuario_id
    
    return de_canela