from pydantic import BaseModel
from datetime import datetime
from typing import Literal, Optional

CerradaPor = Literal['USUARIO', 'TODAS', 'CONTRASENA', 'EXPIRADA', 'CUENTA_ELIMINADA']


class SesionRespuesta(BaseModel):
    id: str
    usuario_id: int
    mascota_id: Optional[int] = None
    dispositivo: Optional[str] = None
    plataforma: Optional[str] = None
    ubicacion_ciudad: Optional[str] = None
    ubicacion_pais: Optional[str] = None
    iniciada_en: datetime
    ultima_actividad_en: datetime
    expira_en: datetime
    cerrada_en: Optional[datetime] = None
    cerrada_por: Optional[CerradaPor] = None

    class Config:
        from_attributes = True


class CerrarSesion(BaseModel):
    #: motivo para MariaDB; Mongo usa "revocada" (MOTIVOS_FIN no acepta "TODAS")
    motivo: CerradaPor = 'USUARIO'