from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PawSpace"
    VERSION: str = "0.1.0"
    
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "pawspace"
    DB_USER: str = "pawuser"
    DB_PASSWORD: str = "pawpass"
    DB_ROOT_PASSWORD: str = "rootpass"

    # Servicio de la OODB. Si OODB_URL queda vacío, el backend trabaja sin adjuntos.
    OODB_URL: str = ""
    OODB_TOKEN: str = ""
    OODB_TIEMPO_MAX: float = 2.0
    # Base con la que se anuncian los archivos al frontend.
    PUBLIC_URL: str = "http://localhost:8000"

    @property
    def OODB_DISPONIBLE(self) -> bool:
        return bool(self.OODB_URL.strip())
    
    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
