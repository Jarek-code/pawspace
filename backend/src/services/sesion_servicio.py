from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from src.models.SESION import Sesion
from pawspace_logs import Accion, usuario

class Sesion_Servicio:
    
    @staticmethod
    def listar_actividades(db: Sesion, usuario_id: int) ->list[Sesion]:
        return(
            db.query(Sesion)
            .filter(Sesion.usuario_id == usuario_id, Sesion.cerrada_en.is_(None))
            .order_by(Sesion.ultima_actividad_en.desc())
            .all()
        )

    @staticmethod
    async def cerrar_una(
        db: Session, logs, sesion_id: str, usuario_id: int, motivo: str
    ) -> dict:

        resultado = db.execute(text("""
        UPDATE SESION
        SET cerrada_en = NOW(),
        cerrada_por = :motivo
        WHERE id = :sid
        AND usuario_id = :uid
        AND cerrada_en IS NULL
        """), {"sid": sesion_id, "uid": usuario_id, "motivo": motivo})
        

        if resultado.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Sesion no encontrda o cerrada")

        await logs.cerrar_sesion(sesion_id, "revocada")

        await logs.evento(Accion.SESION_CERRAR, usuario(usuario_id), sesion = sesion_id)

        db.commit()
    
        return {"id": sesion_id, "cerrada_por": motivo}

    @staticmethod
    async def cerrada_todas(
        db:Sesion, logs, sesion_id:str, usuario_id: int, motivo: str = "TODAS"
    ) -> int:
        activas = (
            db.query(Sesion.id)
            .filter(
                Sesion.usuario_id == usuario_id,
                Sesion.cerrada_en.is_(None),
                Sesion.id != sesion_id,
            )
            .all()
        )

        ids = [fila[0] for fila in activas]

        if not ids:
            return 0

        db.execute(text("""
        UPDATE SESION
        SET cerrada_en = NOW(),
            cerrada_por = :motivo
        WHERE usuario_id = :uid
        AND id <> :actual
        AND cerrada_en IS NULL
        """), {"motivo": motivo, "uid": usuario_id, "actual": sesion_id})

        db.commit()

        for sid in ids:

            await logs.cerrar_sesion(sid, "revocada")

            await logs.evento(Accion.SESION_CERRAR, usuario(usuario_id), sesion = sid)
            
        return len(ids)