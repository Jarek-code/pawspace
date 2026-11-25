from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from src.models.MASCOTA import Mascota, UsuarioMascota
from src.models.scheme_publicacion import publicacion_crear

class Publicacion_Servicio:    
    @staticmethod
    def crear_publicacion_db(db: Session, datos: publicacion_crear, contexto: dict) -> int:
        
        mascota_id = contexto["mascota_id"]
        usuario_id = contexto["usuario_id"]
        sesion_id  = contexto["sesion_id"]
        
        consulta_sp = text("""
        CALL sp_publicacion_crear(
        :p_mascota_id, :p_texto, @nueva_publicacion_id)
        """ )

        resultado = db.execute(consulta_sp,{

        "p_mascota_id": contexto["mascota_id"],
        "p_texto": datos.texto,
        
        })

        resultado.close()

        publicacion_id = db.execute(text("SELECT @nueva_publicacion_id")).scalar()

        if publicacion_id is None:
            raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al momento de crear publicacion."
        )

        #Aqui se vaa poder lo de mondongo db

        return publicacion_id

    