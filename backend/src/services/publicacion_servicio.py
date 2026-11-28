import base64
from typing import Optional, Tuple
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import text, tuple_
from sqlalchemy.orm import Session
from src.models.MASCOTA import Mascota, UsuarioMascota
from src.models.scheme_publicacion import publicacion_crear, publicacion_compartir
from src.models.PUBLICACION import Publicacion, Publicacion_texto

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

        return publicacion_id

    @staticmethod
    def dame_publicacion(db: Session, publi_id:int, mascota_id: int ) -> Publicacion:
        publicacion = (db.query(Publicacion)
        .filter(
            Publicacion.id == publi_id,
            Publicacion.eliminado_en.is_(None),
        )
        .first()
        )

        if not publicacion:
            raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Publicacion no encontrada o eliminada.")

        if publicacion.mascota_id != mascota_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="No tienes permiso sobre una publicacion que pertenece a otra mascota.")

        return publicacion  

    @staticmethod
    def edita_publicacion(db:Session, publi_id: int, nueo_text: str, contexto: dict) -> Publicacion:
        
        mascota_id = contexto ["mascota_id"]
        usuario_id = contexto ["usuario_id"]
        sesion_id  = contexto ["sesion_id"]

        publicacion =  Publicacion_Servicio.dame_publicacion(db, publi_id, mascota_id)

        fila_texto = (
            db.query(Publicacion_texto)
            .filter(Publicacion_texto.publicacion_id == publi_id)
            .update({Publicacion_texto.texto: nueo_text})
        )

        if fila_texto == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="No se encontro contenido de texto de la publicacion.")

        
        publicacion.actualizado_en = datetime.now()
        
        db.flush()
        
        db.refresh(publicacion)

        return publicacion

    @staticmethod
    def elimina_publicacion(db: Session, publi_id:int, contexto:dict) -> None:
        
        mascota_id = contexto ["mascota_id"]
        usuario_id = contexto ["usuario_id"]
        sesion_id  = contexto ["sesion_id"]

        publicacion =  Publicacion_Servicio.dame_publicacion(db, publi_id, mascota_id)

        publicacion.eliminado_en = datetime.now()

    @staticmethod
    def validar_publi_compartir(db: Session, publicacion_origen_id: int, mascota_activa_id: int) -> Publicacion:

        resultado = (
            db.query(Publicacion, Mascota)
            .join(Mascota, Publicacion.mascota_id == Mascota.id)
            .filter(
                Publicacion.id == publicacion_origen_id,
                Publicacion.eliminado_en.is_(None),
            )
            .first()
        )

        if not resultado:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="La publicacion que intentas compartir no existe o fue eliminada.")

        publicacion_origen, mascota_origen = resultado

        if mascota_origen.eliminada_en is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="La mascota autora de la publicacion original ya no esta disponible.")

        if mascota_origen.es_privada and mascota_origen.id != mascota_activa_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="No puedes compartir una publicacion perteneciente a una mascota con perfil privado.")

        return publicacion_origen


    @staticmethod
    def compartir_publi(
        db:Session, publicacion_origen_id: int, datos: publicacion_compartir, contexto: dict
    ) -> int:

        mascota_id = contexto["mascota_id"]
        usuario_id = contexto["usuario_id"]
        sesion_id = contexto["sesion_id"]

        Publicacion_Servicio.validar_publi_compartir(
            db=db,
            publicacion_origen_id=publicacion_origen_id,
            mascota_activa_id=mascota_id
        )

        consulta_sp = text("""
            CALL sp_publicacion_crear(
                :p_mascota_id, :p_texto, @nueva_publicacion_id
            )
        """)
        db.execute(
            consulta_sp,
            {
                "p_mascota_id": mascota_id,
                "p_texto": datos.texto or "",
            },
        )

        nueva_publicacion_id = db.execute(
            text("SELECT @nueva_publicacion_id")
        ).scalar()

        db.query(Publicacion).filter(
            Publicacion.id == nueva_publicacion_id
        ).update({Publicacion.publicacion_origen_id: publicacion_origen_id})

        return nueva_publicacion_id
    
    @staticmethod
    def codificar_cursor(creado_en: datetime, publi_id: int) -> str:
        
        marca = f"{creado_en.isoformat()}|{publi_id}"
        
        return base64.urlsafe_b64encode(marca.encode("utf-8")).decode("utf-8")

    @staticmethod
    def decodificar_cursor(cursor: str) -> Tuple[datetime, int]:
        try:
            decodificado = base64.urlsafe_b64decode(cursor.encode("utf-8")).decode("utf-8")
            fecha_str, id_str = decodificado.split("|",1)
            return datetime.fromisoformat(fecha_str), int(id_str)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="El cursor de paginacion tiene un formato invalido")

    @staticmethod
    def verificar_acceso_muro(db: Session, mascota_id: int, contexto: Optional[dict]) -> None:
        mascota = (db.query(Mascota.id, Mascota.es_privada, Mascota.eliminada_en)
        .filter(Mascota.id == mascota_id)
        .first()
        )

        if not mascota or mascota.eliminada_en is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="La mascota selecciona fue eliminada o no existe.")

        if not mascota.es_privada:
            return
        
        if not contexto:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Este perfil es privado. Inicia sesion para continuar.")

        if contexto.get("mascota_id") == mascota_id:
            return

        es_tutor = (
            db.query(UsuarioMascota.usuario_id)
            .filter(
                UsuarioMascota.usuario_id == contexto["usuario_id"],
                UsuarioMascota.mascota_id == mascota_id,
            )
            .first()
        )

        if not es_tutor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=" No tiene autorizacion para ver el muro de esta mascota privada.")

    @staticmethod
    def obtener_muro_mascota(
        db: Session,
        mascota_id: int,
        cursor: Optional[str] = None,
        limite: int = 15,
    ) -> dict:

        query = (
            db.query(Publicacion, Publicacion_texto.texto)
            .outerjoin(
                Publicacion_texto,
                Publicacion.id == Publicacion_texto.publicacion_id
            )
            .filter(
                Publicacion.mascota_id == mascota_id,
                Publicacion.eliminado_en.is_(None)
            )
        )


        if cursor:
            cursor_fecha, cursor_id = Publicacion_Servicio.decodificar_cursor(cursor)
            query = query.filter(
                tuple_(Publicacion.creado_en, Publicacion.id) < (cursor_fecha, cursor_id)
            )
        
        filas = (
            query.order_by(Publicacion.creado_en.desc(), Publicacion.id.desc())
            .limit(limite + 1)
            .all()
        )

        has_more = len(filas) > limite
        filas_paginas = filas[:limite]

        publicacion_formateadas = [
            {
                "id":pub.id,
                "mascota_id":pub.mascota_id,
                "publicacion_origen_id": pub.publicacion_origen_id,
                "texto": texto,
                "editada": pub.actualizado_en > pub.creado_en,
                "creado_en": pub.creado_en,
                "actualizado_en": pub.actualizado_en,
            }
            for pub, texto in filas_paginas
        ]

        next_cursor = None
        if has_more and filas_paginas:
            ultima_pub = filas_paginas[-1][0]
            next_cursor = Publicacion_Servicio.codificar_cursor(
                ultima_pub.creado_en, ultima_pub.id
            )

        return {
            "mascota_id": mascota_id,
            "publicaciones": publicacion_formateadas,
            "next_cursor": next_cursor,
            "has_more": has_more,
        }
