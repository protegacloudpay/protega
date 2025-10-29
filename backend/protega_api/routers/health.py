"""Health check endpoint."""

from fastapi import APIRouter

from protega_api.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/healthz", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint.
    
    Returns service health status.
    """
    return HealthResponse(ok=True)

