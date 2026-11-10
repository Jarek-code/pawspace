from fastapi import HTTPException, status, Request
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.models.schema_c_usuario import UsuarioCrear, UserLogin
from src.services.check_this import Check_This, Auten_Token
from pawspace_logs import usuario

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
        
        #Esta seccion es para el caso en el que el correo sea incorrecto y se manda el tipo de error que fue
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