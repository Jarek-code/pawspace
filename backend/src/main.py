from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.config.config import settings
from src.config.database import SessionLocal
from src.models.USUARIO import Usuario
from src.routes.usuario_ruta import router as usuario_ruta
from src.routes.mascota_ruta import router as mascota_ruta
from src.routes.adjuntos import router as adjunto
from pawspace_logs import ClienteLogs
from pawspace_logs.middleware import MiddlewareLogs

logs = ClienteLogs(
    url=settings.MONGO_URL,
    bd=settings.MONGO_BD,
    sal_ip=settings.LOGS_SAL,
    muestreo=settings.LOGS_MUESTREO,
    retencion_eventos=settings.LOGS_RETENCION_DIAS,
)
#Este es un gestor de contexto el cual sirve para preparar y limpiar que estan separadas por una pausa 
@asynccontextmanager

#Prepara la aplicacion para que pueda mandar o modificar datos antes de que la aplicacion inicie la aplicacion
async def lifespan(app):
    #En esta parte arranca el servicio y ayuda atravez de una pausa a que todos los datos esten listos 
    #para el momento en que la aplicacion este encendida
    await logs.iniciar()
    #Guarda los log del sistema 
    app.state.logs = logs
    #La funcion yield es un pausa indefinida que nos permite seguir capturando los datos y sirve para que la aplicacion siga
    # funcionando y solo este esperando 
    yield
    #Cuando se detiene el servicion se ejecuta para que se cierre corectamente los archivos
    await logs.cerrar()
    

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PawSpace - Social network for pets",
    lifespan=lifespan
)
#hace que las rutas de usuario_ruta se puedan visualizar en el main
app.include_router(usuario_ruta)

app.include_router(adjunto)

app.include_router(mascota_ruta)

app.add_middleware(MiddlewareLogs,cliente=logs, excluir=("/health", "/docs", "/redoc", "/openapi.json"))

@app.get("/")
async def root():
    return {"message": "Welcome to PawSpace API", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/Usuarios")
async def From_US():
    db =  SessionLocal()

    try:
        Todo_usuarios = db.query(Usuario).all()
        return Todo_usuarios
    finally:
        db.close()

