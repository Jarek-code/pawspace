from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from src.config.database import engine # Importa el engine de tu archivo de conexión

try:
    # Intenta abrir una conexión física a la base de datos
    with engine.connect() as connection:
        # Ejecuta una consulta básica que solo devuelve un '1'
        connection.execute(text("SELECT 1"))
        print("¡Conexión exitosa! SQLAlchemy está conectado a tu base de datos en Docker.")
        
except OperationalError as e:
    print("Falló la conexión a la base de datos.")
    print("Revisa que el contenedor Docker esté corriendo y las credenciales/puerto sean correctos.")
    print(f"Detalle técnico: {e}")
except Exception as e:
    print(f"Ocurrió un error inesperado: {e}")