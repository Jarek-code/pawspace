from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.config.database import get_logs
from src.models.schema_c_usuario import UsuarioCrear, TokenSesion, UserLogin, CambioEstado
from src.controllers.usuario_controller import UsuarioControl
from pawspace_logs import ClienteLogs

#Con esta linea de codigo indico que todas las rutas de este archivo iniciaran con api/usuarios"
# el tag sirve para agrupar todas las rutas al momento de ver el docs de fastapi
router = APIRouter(prefix="/api/usuarios",tags=["Usuarios"])

@router.post("/registro")

#define los datos que se van a registrar y manda a llamar al controlador para que registre al usuario
async def ruta_reg_usuario(usuario_in: UsuarioCrear, db: Session = Depends(get_db)):
    
    return await UsuarioControl.registrar_us(usuario_in, db)

#Se reciben los datos que usuario mando y comprueba que sean correctos 
@router.post("/login",response_model=TokenSesion)

async def sesion_sesiada(credenciales: UserLogin, request: Request ,db: Session = Depends(get_db),
logs: ClienteLogs = Depends(get_logs)):
 
    return await UsuarioControl.chequea_login(credenciales, db, request, logs)

#Consulta global: cuenta en MariaDB + actividad en MongoDB
@router.get("/{usuario_id}/actividad")

async def ruta_actividad(usuario_id: int, request: Request, db: Session = Depends(get_db),
logs: ClienteLogs = Depends(get_logs)):

    return await UsuarioControl.actividad_us(usuario_id, db, logs)

#Actualiza el estado de la cuenta en las dos fuentes
@router.patch("/{usuario_id}/estado")

async def ruta_cambia_estado(usuario_id: int, cambio: CambioEstado, request: Request,
db: Session = Depends(get_db), logs: ClienteLogs = Depends(get_logs)):

    return await UsuarioControl.cambia_estado_us(usuario_id, cambio, db, request, logs)
