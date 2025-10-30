"""Biometric authentication routes."""

import logging
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from protega_api.config import settings
from protega_api.db import get_db
from protega_api.models import User, BiometricTemplate
from protega_api.security import hash_fingerprint, verify_template_hash

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


class BiometricLoginRequest(BaseModel):
    """Request for biometric login."""
    fingerprint_sample: str


class BiometricLoginResponse(BaseModel):
    """Response after successful biometric login."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    message: str
    user_id: int


@router.post("/biometric-login", response_model=BiometricLoginResponse)
async def biometric_login(
    request: BiometricLoginRequest,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Authenticate user using biometric fingerprint.
    
    This is the ONLY way to log in - no email/password allowed.
    """
    logger.info("Biometric login attempt")
    
    # Normalize fingerprint sample (same as enrollment)
    from protega_api.adapters.hardware import get_hardware_adapter
    hardware_adapter = get_hardware_adapter()
    normalized_sample = hardware_adapter.to_template_input(request.fingerprint_sample)
    
    # Find matching fingerprint in database
    templates = db.query(BiometricTemplate).filter(
        BiometricTemplate.active == True
    ).all()
    
    matched_user_id = None
    for template in templates:
        # Verify using the stored salt
        if verify_template_hash(normalized_sample, template.template_hash, template.salt):
            matched_user_id = template.user_id
            logger.info(f"Fingerprint matched for user: {matched_user_id}")
            break
    
    if not matched_user_id:
        logger.warning("Biometric login failed - fingerprint not recognized")
        raise HTTPException(
            status_code=401,
            detail="Fingerprint not recognized. Please enroll first."
        )
    
    # Get user details
    user = db.query(User).filter(User.id == matched_user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Create JWT token
    expire = datetime.utcnow() + timedelta(minutes=15)  # 15 minute expiration
    payload = {
        "sub": str(user.id),
        "email": user.email or "",
        "exp": expire
    }
    token = jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm
    )
    
    logger.info(f"Biometric login successful for user: {user.id}")
    
    return BiometricLoginResponse(
        access_token=token,
        token_type="bearer",
        expires_in=15 * 60,  # 15 minutes in seconds
        message=f"Welcome back, {user.full_name or user.email or 'User'}!",
        user_id=user.id
    )

