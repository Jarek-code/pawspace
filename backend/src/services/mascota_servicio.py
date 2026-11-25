import jwt
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone
from src.models.scheme_c_mascota import MascotaCrear
from src.models.MASCOTA import Raza, Mascota, UsuarioMascota
from src.middleware.chequea_medio import Llave_super_secreta, Algoritmo_Cifrador

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
        :p_foto_portada_url, :p_sitio_web, :p_ubicacion_ciudad, :p_ubicacion_pais,
        :p_latitud, :p_longitud, @nueva_mascota
        )
        """)

        resultado = db.execute(consulta_sp,{
            "p_nombre": mascota.nombre,
        "p_nombre_usuario": mascota.nombre_usuario,
        "p_especie_id": mascota.especie_id,
        "p_biografia": mascota.biografia,
        "p_foto_perfil_url": mascota.foto_perfil_url,
        "p_foto_portada_url": mascota.foto_portada_url,
        "p_sitio_web": mascota.sitio_web,
        "p_ubicacion_ciudad": mascota.ubicacion_ciudad,
        "p_ubicacion_pais": mascota.ubicacion_pais,
        "p_latitud": mascota.latitud,
        "p_longitud": mascota.longitud,
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
            #asignado_por_usuario=usuario_id
        )
        db.add(nuevo_vinculo)

        return mascota_id 

class MascotaSeleccion:
    @staticmethod
    def seleccion_mascota(db: Session, usuario_id:int, mascota_id: int, sesion_id: str | None = None) -> dict:
        mascota = (
            db.query(Mascota)
            .filter(Mascota.id == mascota_id, Mascota.eliminada_en.is_(None))
            .first()
        )
        if not mascota:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Mascota no encontrada.")

        vinculo = (
            db.query(UsuarioMascota)
            .filter(
                UsuarioMascota.usuario_id == usuario_id,
                UsuarioMascota.mascota_id == mascota_id
            )
            .first()
        )

        if not vinculo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="No puedes entrar al perfil de una mascota que no te pertenece.")

        #Checar esta parte del codigo de aqui pa abajo. para : yo del futuro cercano :D . Gracias yo del pasado cercano :D


        if not sesion_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Inicia sesion nuevamente.")

        resultado = db.execute(text("""
            UPDATE SESION
               SET mascota_id = :mid,
                   ultima_actividad_en = NOW()
             WHERE id = :sid
               AND usuario_id = :uid
               AND cerrada_en IS NULL
        """), {
            "mid": mascota_id,
            "sid": sesion_id,
            "uid": usuario_id,
        })

        if resultado.rowcount == 0:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Sesion no encontrada o cerrada. Vuelve a iniciar seesion.")

        db.commit()

        return{
            "mascota_activa" : {
                "id" : mascota.id,
                "nombre" : mascota.nombre,
                "nombre_usuario" : mascota.nombre_usuario,
            }
        }
        