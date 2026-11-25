from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from src.models.scheme_publicacion import publicacion_crear
from src.services.publicacion_servicio import Publicacion_Servicio

class Controlador_Publicacion:

    @staticmethod
    def crear_publicacion(datos: publicacion_crear, contexto: dict, db:Session):

        try:
            publi_new = Publicacion_Servicio.crear_publicacion_db(
                db=db, datos=datos, contexto=contexto
            )
            db.commit()

            return {
                "id": publi_new,
                "texto": datos.texto,
                "mensaje": "Creada existosamente",
            }

        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="error de integridad al momento de guardar la publicacion")
        
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"Error interno al momento de crear publicacion. Detalle : {str(e)}")
