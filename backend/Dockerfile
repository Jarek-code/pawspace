FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for potential native packages (e.g., mysqlclient)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# (el contexto de build es la raiz del repositorio: ver docker-compose.yml)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# El registro de logs es un paquete del propio repositorio (no esta en PyPI):
# sin el, `from pawspace_logs import ...` falla y el backend no arranca.
COPY logs /app/logs
RUN pip install --no-cache-dir /app/logs

# Copy source code
COPY backend/src /app/src
COPY backend/tests /app/tests

# Carpeta para la cola de logs pendientes (volumen en docker-compose.yml).
RUN mkdir -p /app/datos

# Create a non-root user and switch to it
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser && \
    chown -R appuser:appgroup /app/datos
USER appuser

# Run uvicorn
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
