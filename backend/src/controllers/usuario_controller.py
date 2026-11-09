from fastapi import HTTPException, status, Request
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.models.schema_c_usuario import UsuarioCrear, UserLogin
from src.services.check_this import Check_This, Auten_Token, Cuenta
from pawspace_logs import Accion, usuario

class UsuarioControl:

    @staticmethod
    
    #En este caso si esciste una conexion directa con la base de datos por que se envian los datos
    #del procedure a la base de datos 
    async def registrar_us(usuario: UsuarioCrear, db:Session):
        
        try:
            #se llama a la clase para traer los datos y enviarlos a la base de datos
            nuevo_id = Check_This.crear_usuario_db(db, usuario)
            
            db.commit()
            
            return{"mensaje":"Usuario creado con exito"}

        #En caso de que exista un error como al momento de poner el correo o la contasena va a soltar un error
        # y no se mandaran los datos y te soltara un mensaje del error
        except Exception as e:
            
            db.rollback()
            
            raise HTTPException(
                
                status_code=status.HTTP_400_BAD_REQUEST,
                
                detail=f"Error al registrar usuario. Detalle : {str(e)}"
                #hello world(print)
            )

    @staticmethod
    #Verifica el el usuario exista para poder generarle su token 
    async def chequea_login(credenciales: UserLogin, db: Session, request : Request, logs):

        ip_cliente = request.client.host if request.client else "IP_desconocida"

        origen = logs.origen(request)


        #Confirma la existencia del usuario solicitando dos columnas la contrasena  y el id
        usuario_db = Auten_Token.dame_contra(db, credenciales.email)

        #----Esta seccion de aqui indica cuando existe algun fallo al momento de iniciar sesion----#
        
        #En caso de no encontrar nada arroja un error diciendo que el correo o contrasena es incorrecta
        
        #Esta seccion es para el caso en el que el correo sea incorrecto
        if not usuario_db:
            await logs.intento_fallido(credenciales.email, "credenciales", origen = origen)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Correo o contrasena incorrecta :( "
            )
        #Toma los valores que necesita para poder verificarlos
        usuario_id, hash_guardado, activo, actualizado_en = usuario_db

        #Esta seccion es para el caso en el que el usuario este desactivado
        if not activo:
            await logs.intento_fallido(credenciales.email, "cuenta_inactiva", actor = usuario(usuario_id),
            origen=origen)

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Esta cuenta ha sido desactivada."
            )
            
        #Esta seccion es para el caso en el que la contrasena sea incorrecta
        if not Auten_Token.verifica_contra(credenciales.contrasena, hash_guardado):
            await logs.intento_fallido(credenciales.email, "credenciales", actor = usuario(usuario_id) ,
            origen = origen )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Correo o contrasena incorrecta"
            )
        
        #Cuando los campos sean correctos esta funcion se volvera verdadera y ahora dara el paso para que
        #se cree en token del usuario

        sesion_id = await logs.iniciar_sesion(usuario(usuario_id), origen = origen)
        request.state.actor = usuario(usuario_id)
        request.state.sesion_id = sesion_id
        
        #Si todo sale bien se crea un nuevo token para el usuario
        nueo_token = Auten_Token.crea_token(usuario_id, sesion_id)

        #Y te devuelve el token y que tipo de token es
        return{
            "token_acceso": nueo_token,
            "token_tipo": "bearer"
            ,"sesion_id": sesion_id
        }

    @staticmethod
    #Consulta global: la cuenta se lee de MariaDB y su actividad de MongoDB.
    #Si el registro de actividad no responde, se devuelve la cuenta sola y se avisa.
    async def actividad_us(usuario_id: int, db: Session, logs):

        cuenta = Cuenta.dame_cuenta(db, usuario_id)

        if not cuenta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No existe la cuenta solicitada."
            )

        datos_cuenta = UsuarioControl.datos_cuenta(cuenta)

        if not await logs.disponible():
            return {
                "usuario": datos_cuenta,
                "actividad": None,
                "fuentes": {"relacional": "ok", "logs": "no disponible"},
                "degradado": True,
                "aviso": "El registro de actividad no responde. Los datos de la cuenta vienen "
                         "solo de MariaDB y no incluyen sesiones ni intentos de acceso.",
            }

        eventos = await logs.auditoria_actor(
            usuario_id,
            acciones=[Accion.CUENTA_ACCEDER, Accion.CUENTA_FALLAR],
            limite=200,
        )
        sesiones = await logs.sesiones_de_actor(usuario_id, limite=200)

        accesos = [e for e in eventos if e.get("accion") == Accion.CUENTA_ACCEDER.value]
        fallos = [e for e in eventos if e.get("accion") == Accion.CUENTA_FALLAR.value]

        return {
            "usuario": datos_cuenta,
            "actividad": {
                "sesiones": len(sesiones),
                "accesos_correctos": len(accesos),
                "intentos_fallidos": len(fallos),
                "ultimo_acceso": accesos[0]["ocurrido_en"] if accesos else None,
                "ultima_sesion": sesiones[0]["_id"] if sesiones else None,
                "ultima_actividad": sesiones[0]["ultima_actividad_en"] if sesiones else None,
            },
            "fuentes": {"relacional": "ok", "logs": "ok"},
            "degradado": False,
            "aviso": None,
        }

    @staticmethod
    #Actualiza el estado de la cuenta en MariaDB y deja el evento en MongoDB.
    #Si la segunda fuente falla, el cambio local se conserva y se informa como parcial.
    async def cambia_estado_us(usuario_id: int, cambio, db: Session, request, logs):

        cuenta = Cuenta.dame_cuenta(db, usuario_id)

        if not cuenta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No existe la cuenta solicitada."
            )

        try:
            Cuenta.cambia_activo(db, usuario_id, cambio.activo)
            db.commit()

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo actualizar la cuenta."
            )

        origen = logs.origen(request)

        evento_id = await logs.evento(
            Accion.CUENTA_ACTUALIZAR,
            usuario(usuario_id),
            entidad=("USUARIO", usuario_id),
            metadatos={"activo": cambio.activo},
            origen=origen,
        )

        registro_ok = await logs.disponible()
        actualizada = Cuenta.dame_cuenta(db, usuario_id)

        return {
            "usuario": UsuarioControl.datos_cuenta(actualizada),
            "fuentes": {"relacional": "ok", "logs": "ok" if registro_ok else "no disponible"},
            "parcial": not registro_ok,
            "evento_id": evento_id if registro_ok else None,
            "aviso": None if registro_ok else
                     "El cambio quedo guardado en MariaDB. El evento de auditoria no se pudo "
                     "registrar en MongoDB.",
        }

    @staticmethod
    #Traduce la fila de USUARIO a un diccionario listo para la respuesta
    def datos_cuenta(cuenta) -> dict:

        return {
            "id": cuenta.id,
            "nombre": cuenta.nombre,
            "email": cuenta.email,
            "activo": bool(cuenta.activo),
            "creado_en": cuenta.creado_en.isoformat() if cuenta.creado_en else None,
            "actualizado_en": cuenta.actualizado_en.isoformat() if cuenta.actualizado_en else None,
        }
