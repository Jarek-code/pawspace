from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List

class publicacion_crear(BaseModel):
    texto: str = Field(..., min_length=1, max_length=5000)

    @field_validator("texto")

    @classmethod

    def validar_texto_no_vacio(cls, valor: str) -> str:
        
        texto_limpio = valor.strip()

        if not texto_limpio:
            raise ValueError("Prueba a escribir algo")
        return texto_limpio

class publicacion_respuesta(BaseModel):
    id: int
    texto: str
    mensaje: str


class publicacion_editar(BaseModel):
    texto: str = Field(..., min_length=1, max_length=5000)

    @field_validator("texto")

    @classmethod

    def validar_texto_no_vacio(cls, valor: str) -> str:

        texto_limpio = valor.strip()

        if not texto_limpio:
            raise ValueError("El texto de la publicación no puede estar vacío.")
        return texto_limpio


class publicacion_editar_respuesta(BaseModel):
    id: int
    texto: str
    actualizado_en: datetime
    mensaje: str


class publicacion_compartir(BaseModel):
    texto: Optional[str] = Field(None, max_length=5000)

    @field_validator("texto")
    
    @classmethod
    
    def normalizar_texto_opcional(cls, valor: Optional[str]) -> Optional[str]:
        
        if valor is None:
            return None
        texto_limpio = valor.strip()
        return texto_limpio if texto_limpio else None

class publicacion_compartir_respuesta(BaseModel):
    id: int
    mascota_id: int
    publicacion_origen_id: int
    texto: Optional[str]
    mensaje: str

class publicacion_muro(BaseModel):
    id: int
    mascota_id: int
    publicacion_origen_id: Optional[int]
    texto: Optional[str]
    editada: bool
    creado_en: datetime
    actualizado_en: datetime

class publicacion_muro_respuesta(BaseModel):
    mascota_id: int
    publicaciones: List[publicacion_muro]
    next_cursor: Optional[str]
    has_more: bool