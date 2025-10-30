# Dockerfile for Protega CloudPay (FastAPI + Fly.io)
FROM python:3.11-slim

# Working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies first (for better caching)
COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Run app with uvicorn
CMD ["uvicorn", "protega_api.main:app", "--host", "0.0.0.0", "--port", "8000"]

