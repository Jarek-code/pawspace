from fastapi import FastAPI
from .config import settings
from .database import engine, Base

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PawSpace - Social network for pets"
)

# Create tables (in development; for production use Alembic migrations)
@app.on_event("startup")
async def startup():
    # This will create tables if they don't exist
    Base.metadata.create_all(bind=engine)

@app.get("/")
async def root():
    return {"message": "Welcome to PawSpace API", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
