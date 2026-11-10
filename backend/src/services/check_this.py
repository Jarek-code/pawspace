import jwt
from sqlalchemy.orm import Session
from sqlalchemy import text
#Se  importan las librerias necesarias para el archivo y se asigna una variable para encriptar a contrasena
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from src.models.schema_c_usuario import UsuarioCrear

#Se utilizo el schemes argon2 por que permite contrasenas mas largar y deprecated verifica la contrasena
contra_encrip = CryptContext(schemes=["argon2"], deprecated="auto")
Llave_super_secreta ="odio israel"
Algoritmo_Cifrador = "HS256"


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
<<<<<<< HEAD
        
=======
class Cuenta:

      #Lee de la base relacional los datos publicos de la cuenta
    @staticmethod
    def dame_cuenta(db: Session, usuario_id: int):

        consulta = text(
            """SELECT id, nombre, email, activo, creado_en, actualizado_en
            FROM USUARIO
            WHERE id = :id""")

        return db.execute(consulta, {"id": usuario_id}).fetchone()

    #Cambia el estado de la cuenta y devuelve cuantas filas se modificaron
    @staticmethod
    def cambia_activo(db: Session, usuario_id: int, activo: bool) -> int:

        resultado = db.execute(
            text("UPDATE USUARIO SET activo = :activo WHERE id = :id"),
            {"activo": 1 if activo else 0, "id": usuario_id})

        return resultado.rowcount


>>>>>>> cc0021076a6435aef96d1f02525e2c1be4dbd6ba
#se crea la calse que nos creara los tokens de acceso
class Auten_Token :

    @staticmethod

    #este metodo le pide a la vase de datos que le de la contrasena (ya con hash)
    def dame_contra(db: Session, email: str):

        consulta = text(
            """SELECT u.id, uc.contrasena_hash, u.activo, u.actualizado_en
            FROM USUARIO u
            INNER JOIN USUARIO_CREDENCIALES uc ON u.id = uc.usuario_id
            WHERE u.email = :email""")

        return db.execute(consulta,{"email": email}).fetchone()


    @staticmethod

    #verifica que la contrasena que trajo de la base de datos sea la misma del usuario
    def verifica_contra(contra_plana: str, hash_guardao: str) -> bool:
        return contra_encrip.verify(contra_plana, hash_guardao)

    @staticmethod

    #Despues de confirmar que es la misma contrasena genera el token para el usuario
    def crea_token(usuario_id : int, sesion_id: str | None = None) -> str:

        #para que el token no funcione de forma indefinida tiene un tiempo de expiracion de una semana
        fecha_actual = datetime.now(timezone.utc)

        #inica el tiempo de vida del token
        expira = datetime.now(timezone.utc) + timedelta(days=7)

        #Encapsula los datos que posterior mente seran enviados
        dato_guardao = {

            #Abrebiacion de sujeto por que es al que le pertenece el token
            "sub": str(usuario_id),

            #Abrebiacion de expiracion indica el tiempo de vida del token
            "exp": expira,

            #Abrebiacion de emitido en indica cuando se creo el token
            "iat": fecha_actual
        }
        #Verifica que la sesion exista y de ser vedad guarda un sid que es la sesion id
        if sesion_id:
            dato_guardao["sid"] = sesion_id

        #Despues de confirmar los datos ahora crea el token con su algoritmo y los datos del usuario
        return jwt.encode(dato_guardao, Llave_super_secreta, algorithm=Algoritmo_Cifrador)