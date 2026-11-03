from fastapi import HTTPException
from src.config.database import SessionLocal
from src.models.schema_c_usuario import UsuarioCrear
from src.services.check_this import Check_This

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
            )