"""Main FastAPI application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from protega_api.config import settings
from protega_api.db import check_db_connection
from protega_api.routers import enroll, health, merchant, pay, payment_methods, websocket, customers
from protega_api import otp
from protega_api.routers import admin

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("🚀 Starting Protega CloudPay API")
    logger.info(f"Environment: {settings.env}")
    
    # Check database connection
    if not check_db_connection():
        logger.error("Failed to connect to database!")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down Protega CloudPay API")


# Create FastAPI application
app = FastAPI(
    title="Protega CloudPay API",
    description="Biometric payment processing with device-free authentication",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for development and production
allowed_origins = [
    "http://localhost:3000",  # Local development
    "http://localhost:8000",  # Local API
    "http://web:3000",        # Docker frontend
    settings.frontend_url,    # Production frontend (Vercel)
]

# Remove duplicates and filter empty strings
allowed_origins = list(set(filter(None, allowed_origins)))

logger.info(f"CORS allowed origins: {allowed_origins}")

# Custom CORS origin checker to allow all Vercel deployments
def check_origin(origin: str) -> bool:
    """Check if origin is allowed."""
    # Allow exact matches
    if origin in allowed_origins:
        return True
    # Allow all vercel.app domains
    if origin.endswith(".vercel.app") and origin.startswith("https://"):
        return True
    return False

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel deployments
    allow_origins=allowed_origins,  # Also allow specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(enroll.router)
app.include_router(pay.router)
app.include_router(merchant.router)
app.include_router(payment_methods.router, tags=["payment-methods"])
app.include_router(customers.router)
app.include_router(websocket.router)
app.include_router(otp.router)
app.include_router(admin.router)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "service": "Protega CloudPay API",
        "version": "0.1.0",
        "docs": "/docs",
        "status": "running"
    }

