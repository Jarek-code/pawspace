from fastapi import FastAPI
from src.config.config import settings
from src.config.database import SessionLocal
from src.models.USUARIO import Usuario, Usuario_Credenciales
from pydantic import BaseModel

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PawSpace - Social network for pets"
)

#se creea una clase llamada D_Usuario para no tener que escribir todos los valores en cada peticion
class D_Usuario(BaseModel):
    nombre: str
    email: str
    contrasena_hash: str

@app.get("/")
async def root():
    return {"message": "Welcome to PawSpace API", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/Create-Account")
#Se crea la clase agregar para insertar nuevos usuarios y se le manda la clase D_Usuario 
async def agregar(datos : D_Usuario):
    #Se crea una session local a la base de datos para anadir (ingao la voy a copear y pegar ñ ahita pero voy a dejar asi el anadir)
    db = SessionLocal()

    #Se pone el try para en caso de que exista  un error la base de datos vuelva a su estado original
    try:
        #Se asignan los datos del nuevo usuario
        N_usuario = Usuario(
            nombre = datos.nombre, 
            email = datos.email, 
            )
        #Aqui se envian los datos pero no se suben aun a la base de datos
        db.add(N_usuario)

        #trolea a la base de datos para que creea que se inserto un usuario para que genere una llave primaria
        db.flush()

        #Le da al usuario una contrasena (ijoe perra la ñ litear la agarre de wikipenia escribi espanol para poder copear esto ñ)
        N_Credencial = Usuario_Credenciales(
            #Sincroniza el id de la nueva credencial con el id del usuario que acabas de agregar
            usuario_id = N_usuario.id,
            #Se asigna la contrasena (ññññññññññññññññññññññññññññññññññ)
            contrasena_hash= datos.contrasena_hash
        )
        #Agrega los datos para mandar todo al mismo tiempo
        db.add(N_Credencial)

        #Se mandan todos los datos para que se inserten en la base de datos
        db.commit()

        return{"usuario agregado": N_usuario.nombre}

    except Exception as e:

        db.rollback()

        raise e

    finally:
        db.close()


@app.get("/Usuarios")
async def From_US():
    db =  SessionLocal()

    try:
        Todo_usuarios = db.query(Usuario).all()
        return Todo_usuarios
    finally:
        db.close()









# Create tables (aun no sirve fladskfjlskjgfhkeriuh)
#@app.on_event("startup")
#async def startup():
#    # This will create tables if they don't exist
#    Base.metadata.create_all(bind=engine)
