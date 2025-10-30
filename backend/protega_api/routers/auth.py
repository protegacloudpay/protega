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
from protega_api.sdk import get_fingerprint_reader
import hashlib

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
    Uses SDK fingerprint capture for cross-device compatibility.
    """
    logger.info("Biometric login attempt")
    
    # Get fingerprint reader
    reader = get_fingerprint_reader()
    
    # Capture fingerprint from SDK (or use provided sample)
    if request.fingerprint_sample:
        # Use provided sample (development mode)
        fingerprint_sample = request.fingerprint_sample
        logger.info("Using provided fingerprint sample (development mode)")
    else:
        # Capture from hardware
        logger.info("Capturing fingerprint from hardware SDK")
        fingerprint_sample = reader.capture_sample()
        if not fingerprint_sample:
            raise HTTPException(
                status_code=400,
                detail="Fingerprint capture failed. Please try again."
            )
    
    # Hash the fingerprint for lookup
    template_hash = reader.hash_template(fingerprint_sample)
    logger.info(f"Looking up fingerprint with hash: {template_hash[:16]}...")
    
    # Find matching fingerprint in database (fast hash lookup)
    template = db.query(BiometricTemplate).filter(
        BiometricTemplate.template_hash == template_hash,
        BiometricTemplate.active == True
    ).first()
    
    if not template:
        logger.warning("Biometric login failed - fingerprint not recognized")
        raise HTTPException(
            status_code=401,
            detail="Fingerprint not recognized. Please enroll first."
        )
    
    # Update last used timestamp for this fingerprint
    from datetime import datetime
    template.last_used_at = datetime.utcnow()
    db.commit()
    
    matched_user_id = template.user_id
    logger.info(
        f"Fingerprint matched for user: {matched_user_id}, "
        f"finger: {template.finger_label}, "
        f"last_used_at: {template.last_used_at}"
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

