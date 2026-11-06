from pydantic import BaseModel, EmailStr, Field

#Esta clase de aqui valida los datos que manda el forntend para que no pase o exite un error al momento de eviar los datos
class UsuarioCrear(BaseModel):
    
    nombre : str = Field(..., min_length=2, max_length=255, strip_whitespace=True)
    
    email : EmailStr = Field(..., max_length=320)
    
    contrasena : str =Field(...,min_length=8, max_length=255)

#La variable Field(...) indica que el campo es obligatorio y strip_whitespace=True
#elimina espacios accidentales al inicio o al final

#Se crea una calse la cual validara los tokens creados para que el usuario pueda tener una sesion activa
class TokenSesion(BaseModel):
    #Es el token del usuario esto se lo quedara el fronted por que es lo que usara el usuario para tener una sesion 
    #iniciada y no tenga que tener que inciar otra vez (Duarante un tiempo limitado claro)
    token_acceso : str

    #Indica el esquema que utilizara el token para ser creado
    token_tipo : str = "bearer"

class UserLogin(BaseModel):
    #valisa el correo del usuario
    email: EmailStr
    #valida la contrasena del usuario
    contrasena: str