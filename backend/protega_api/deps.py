"""FastAPI dependencies."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from protega_api.db import get_db
from protega_api.models import Merchant
from protega_api.security import verify_jwt

# Security scheme for Bearer token
security = HTTPBearer()


def get_current_merchant(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[Session, Depends(get_db)]
) -> Merchant:
    """
    Dependency to get the current authenticated merchant from JWT.
    
    Args:
        credentials: HTTP authorization credentials
        db: Database session
        
    Returns:
        Authenticated merchant
        
    Raises:
        HTTPException: If token is invalid or merchant not found
    """
    token = credentials.credentials
    
    # Verify JWT
    payload = verify_jwt(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract merchant ID
    merchant_id_str = payload.get("sub")
    if merchant_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        merchant_id = int(merchant_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Fetch merchant from database
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Merchant not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return merchant

