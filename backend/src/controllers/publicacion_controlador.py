from fastapi import HTTPException, status
from typing import Optional
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from src.models.scheme_publicacion import publicacion_crear, publicacion_editar, publicacion_compartir
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

    @staticmethod
    def editar_publi(db:Session, publi_id: int, datos: publicacion_editar, contexto:dict):
        try:
            publicacion = Publicacion_Servicio.edita_publicacion(
                db=db,
                publi_id=publi_id,
                nueo_text=datos.texto,
                contexto=contexto
            )

            db.commit()

            return {
                "id": publicacion.id,
                "mascota_id": publicacion.mascota_id,
                "texto": datos.texto,
                "actualizado_en": publicacion.actualizado_en,
                "mensaje": "Publicación actualizada correctamente",
            }
        
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"Error al momento de editar la publucacion. Detalle: {e}")

    @staticmethod
    def elimar_publi(db: Session, publi_id:int, contexto: dict):
        try:
            Publicacion_Servicio.elimina_publicacion(
                db=db,
                publi_id=publi_id,
                contexto=contexto
            )

            db.commit()

            return{
                "id": publi_id,
                "mensaje": "Publicacion eliminada correctamente"
            }

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"Error al momento de eliminar la publicacion. Detalle: {e}")

    @staticmethod
    def compartir_publi(
        publicacion_origen_id: int,
        datos: publicacion_compartir,
        contexto: dict,
        db: Session
    ):
        try:
            nueva_id = Publicacion_Servicio.compartir_publi(
                db=db,
                publicacion_origen_id=publicacion_origen_id,
                datos=datos,
                contexto=contexto,
            )

            db.commit()

            return {
                "id": nueva_id,
                "mascota_id": contexto["mascota_id"],
                "publicacion_origen_id": publicacion_origen_id,
                "texto": datos.texto,
                "mensaje": "Publicación compartida exitosamente",
            }
        
        except HTTPException:
            db.rollback()
            raise

        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error de integridad al compartir la publicación.",
            )

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error interno al compartir la publicación: {str(e)}",
            )

    @staticmethod
    def consulta_muro(
        mascota_id: int,
        cursor: Optional[str],
        limite: int,
        contexto: Optional[dict],
        db: Session,
    ) -> dict:

        Publicacion_Servicio.verificar_acceso_muro(
            db=db, mascota_id=mascota_id, contexto=contexto
        )

        return Publicacion_Servicio.obtener_muro_mascota(
            db=db,
            mascota_id=mascota_id,
            cursor=cursor,
            limite=limite
        )
