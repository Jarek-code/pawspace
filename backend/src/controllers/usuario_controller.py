from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.models.schema_c_usuario import UsuarioCrear, UserLogin
from src.services.check_this import Check_This, Auten_Token

class UsuarioControl:

    @staticmethod
    
    #En este caso si esciste una conexion directa con la base de datos por que se envian los datos
    #del procedure a la base de datos 
    def registrar_us(usuario: UsuarioCrear, db:SessionLocal):
        
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
                
                status_code=400,
                
                detail=f"Error al registrar usuario. Detalle : {str(e)}"
                #hello world(print)
            )

    @staticmethod
    #Verifica el el usuario exista para poder generarle su token 
    def chequea_login(credenciales: UserLogin, db: Session):

        ip_cliente = request.client.host if request.client else "IP_desconocida"


        #Confirma la existencia del usuario solicitando dos columnas la contrasena  y el id
        usuario_db = Auten_Token.dame_contra(db, credenciales.email)

        #En caso de no encontrar nada arroja un error diciendo que el correo o contrasena es incorrecta
        if not usuario_db:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Correo o contrasena incorrecta :( "
            )
        #Toma los valores que necesita para poder verificarlos
        usuario_id = usuario_db[0]
        hash_guardado = usuario_db[1]

        #Confirma si la contrasena existe y en caso de no existir te devuelve un error
        contrasena_valida = Auten_Token.verifica_contra(
            credenciales.contrasena,
            hash_guardado
        )
        if not contrasena_valida:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Correo o contrasena incorrecta"
            )
        
        #Si todo sale bien se crea un nuevo token para el usuario
        nueo_token = Auten_Token.crea_token(usuario_id)

        #Y te devuelve el token y que tipo de token es
        return{
            "token_acceso": nueo_token,
            "token_tipo": "bearer"
        }  