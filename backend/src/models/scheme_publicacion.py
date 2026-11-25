from pydantic import BaseModel, Field, field_validator

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