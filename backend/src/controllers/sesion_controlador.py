from fastapi import HTTPException, status, Request
from sqlalchemy.orm import Session
from src.services.sesion_servicio import Sesion_Servicio

class Sesion_Controlador:
    @staticmethod
    def listar(db:Session, usuario_id: int):
        return Sesion_Servicio.listar_actividades(db, usuario_id)

    @staticmethod
    async def cerrar(
        db: Session, logs, request: Request, sesion_id: str, usuario_id: int, motivo: str
    ):
        return await Sesion_Servicio.cerrar_una(db, logs, sesion_id, usuario_id, motivo)

    @staticmethod
    async def cerrar_todas(
        db: Session, logs, sesion_actual: str , usuario_id: int
    ):
        return{"cerradas" : await Sesion_Servicio.cerrada_todas(
            db, logs, sesion_actual, usuario_id
        )}
