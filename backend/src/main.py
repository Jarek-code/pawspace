from fastapi import FastAPI
from src.config.config import settings
from src.config.database import SessionLocal
from src.models.USUARIO import Usuario
from src.routes.usuario_ruta import router as usuario_ruta

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PawSpace - Social network for pets"
)
#hace que las rutas de usuario_ruta se puedan visualizar en el main
app.include_router(usuario_ruta)

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