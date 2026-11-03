from sqlalchemy.orm import Session
from sqlalchemy import text
from passlib.context import CryptContext
from src.models.schema_c_usuario import UsuarioCrear
#Se  importan las librerias necesarias para el archivo y se asigna una variable para encriptar a contrasena
contra_encrip = CryptContext(schemes=["argon2"], deprecated="auto")
#Se utilizo el schemes argon2 por que permite contrasenas mas largar y deprecated verifica la contrasena

class Check_This:

    @staticmethod
    # Se utiliza from sqlalchemy.orm import Session para idicarle a sqlalchemy que se le va a enviar una peticion
    # sin necesidad de abrir una conexion directa con la base de datos de eso se encarga route
    def crear_usuario_db(db: Session, usuario: UsuarioCrear) -> int:
        # El "-> int" que esta al final sirve para indicar que el valor que se devolvera es un entero en este caso el id 
        hash_generado = contra_encrip.hash(usuario.contrasena)
        
        #Llama al procedure que envia los datos a la base de datos 
        resultado = db.execute(
            text("CALL sp_usuario_crear(:nombre, :email, :hash, @nuevo_id)"),
            {"nombre": usuario.nombre, "email": usuario.email, "hash": hash_generado},
        )
        #Cierra el proceso
        resultado.close()
        #Obtiene el ID que genero el procedure y utilizamos .scalar() por que sabemos que va a devolver un 
        # unico valor en este caso el ID 
        nuevo_id = db.execute(text("SELECT @nuevo_id")).scalar()
        
        return nuevo_id