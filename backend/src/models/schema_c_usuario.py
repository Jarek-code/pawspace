from pydantic import BaseModel, EmailStr, Field

#Esta clase de aqui valida los datos que manda el forntend para que no pase o exite un error al momento de eviar los datos
class UsuarioCrear(BaseModel):
    
    nombre : str = Field(..., min_length=2, max_length=255, strip_whitespace=True)
    
    email : EmailStr = Field(..., max_length=320)
    
    contrasena : str =Field(...,min_length=8, max_length=255)

#La variable Field(...) indica que el campo es obligatorio y strip_whitespace=True
#elimina espacios accidentales al inicio o al final