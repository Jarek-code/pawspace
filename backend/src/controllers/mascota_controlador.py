from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from src.models.scheme_c_mascota import MascotaCrear
from src.services.mascota_servicio import Mascota_Servicio

class Mascota_Controlador:
    @staticmethod
    def crear_mascota(mascota: MascotaCrear, usuario_id:int, db: Session):
        Mascota_Servicio.validar_raza_especie(db, mascota.especie_id, mascota.raza_id)

        try:
            nueva_mascota_id = Mascota_Servicio.crear_mascota(db, mascota, usuario_id)

            db.commit()

            return{
                "mensaje": "Mascota creada y vinculada exitosamente",
                "mascota_id": nueva_mascota_id,
                "nombre_usuario":mascota.nombre_usuario
            }
        except IntegrityError as e:
            db.rollback()
            if "nombre_usuario" in str(e.orig):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre de usuario de la mascota ya esta en uso")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verifica los datos ingresados")

        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error interno del sistema: {str(e)}")  
