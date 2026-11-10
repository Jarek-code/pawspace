from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class MascotaCrear(BaseModel):
    nombre : str = Field(..., min_length = 2, max_length = 100)
    nombre_usuario: str = Field(..., min_length = 2, max_length = 50, pattern="^[a-zA-Z0-9_]+$")
    especie_id : int = Field(..., gt = 0)
    biografia : Optional[str] = Field(None, max_length = 1000)
    foto_perfil_url: Optional[str] = Field(None, max_length=2048)

    raza_id: Optional[int] = None
    sexo: Optional[str] = Field(None, max_length=1)
    fecha_nacimiento: Optional[date] = None
    es_privado: bool = False