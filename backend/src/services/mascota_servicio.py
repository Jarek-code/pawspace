from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException, status
from datetime import datetime, timezone
from src.models.scheme_c_mascota import MascotaCrear
from src.models.MASCOTA import Raza, Mascota, UsuarioMascota

class Mascota_Servicio:

    @staticmethod
    def validar_raza_especie(db:Session, especie_id, raza_id):
        if raza_id is None:
            return True
        
        raza_valida = db.query(Raza).filter(
            Raza.id == raza_id,
            Raza.especie_id == especie_id
        ).first()

        if not raza_valida:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La raza seleccionada no pertenece a la especie indicada"
            )

    @staticmethod
    def crear_mascota(db: Session, mascota: MascotaCrear, usuario_id: int) -> int:
        consulta_sp = text("""
        CALL sp_mascota_crear(
        :p_nombre, :p_nombre_usuario, :p_especie_id, :p_biografia, :p_foto_perfil_url,
        @nueva_mascota
        )
        """)

        db.execute(consulta_sp,{
            "p_nombre":mascota.nombre,
            "p_nombre_usuario":mascota.nombre_usuario,
            "p_especie_id": mascota.especie_id,
            "p_biografia": mascota.biografia or "",
            "p_foto_perfil_url":mascota.foto_perfil_url or ""
        })

        resultado.close()

        mascota_id = db.execute(text("SELECT @nueva_mascota")).scalar()

        if not mascota_id:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo crear la mascota")

        if mascota.raza_id or mascota.sexo or mascota.fecha_nacimiento or mascota.es_privado:
            db.query(Mascota).filter(Mascota.id == mascota_id).update({
                Mascota.raza_id:mascota.raza_id,
                Mascota.sexo:mascota.sexo,
                Mascota.fecha_nacimiento:mascota.fecha_nacimiento,
                Mascota.es_privada:mascota.es_privado
            })
        
        nuevo_vinculo = UsuarioMascota(
            usuario_id=usuario_id,
            mascota_id=mascota_id,
            asignado_por_usuario=usuario_id
        )
        db.add(nuevo_vinculo)

        return mascota_id 