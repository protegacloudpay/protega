FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy application code first
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -e .

# Make uvicorn.sh executable
RUN chmod +x /app/uvicorn.sh

EXPOSE 8000

CMD ["/bin/bash", "/app/uvicorn.sh"]

