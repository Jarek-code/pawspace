from pydantic import BaseModel, EmailStr, Field
from typing import Optional

#Esta clase de aqui valida los datos que manda el forntend para que no pase o exite un error al momento de eviar los datos
class UsuarioCrear(BaseModel):
    
    nombre : str = Field(..., min_length=2, max_length=255, strip_whitespace=True)
    
    email : EmailStr = Field(..., max_length=320)
    
    contrasena : str =Field(...,min_length=8, max_length=255)

    #Estas variables son opcionales
    telefono: Optional[str] = Field(None, max_length=32)

    ciudad: Optional[str] = Field(None, max_length=100)

    pais: Optional[str] = Field(None, max_length=100)

    biografia: Optional[str] = Field(None, max_length=500)

#La variable Field(...) indica que el campo es obligatorio y strip_whitespace=True
#elimina espacios accidentales al inicio o al final

class UsuarioRespuesta(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    plan: str
    activo: bool

    class Config:
        from_attributes = True

#Se crea una calse la cual validara los tokens creados para que el usuario pueda tener una sesion activa
class TokenSesion(BaseModel):
    #Es el token del usuario esto se lo quedara el fronted por que es lo que usara el usuario para tener una sesion 
    #iniciada y no tenga que tener que inciar otra vez (Duarante un tiempo limitado claro)
    access_token : str

    #El tipo del token es bearer esto debido a que es un standar de seguridad e indica como se le bede pasar el token al frontend
    token_type : str = "bearer"
   
    #Este campo indica que es opcional que se escriba el token directamente el campo puede estar vacio o con texto esto hace que la api
    #no falle cuando llegue a faltar
    sesion_id: Optional[str] = None

class UserLogin(BaseModel):
    #valisa el correo del usuario
    email: EmailStr
    #valida la contrasena del usuario
    contrasena: str

#Cuerpo del cambio de estado de una cuenta: solo si queda activa o inactiva
class CambioEstado(BaseModel):

    activo: bool
