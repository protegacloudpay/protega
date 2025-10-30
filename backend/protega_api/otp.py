"""
OTP (One-Time Password) utility for phone verification.

Sends OTP via Twilio SMS and provides verification endpoint.
"""

import logging
import os
import random
import time
from datetime import datetime
from typing import Annotated, Dict, Optional

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from protega_api.config import settings
from protega_api.db import get_db
from protega_api.models import FlaggedEnroll, User, BiometricTemplate, ProtegaIdentity

logger = logging.getLogger(__name__)

# Twilio client (optional - works without it in dev)
try:
    from twilio.rest import Client
    
    TW_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TW_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    TW_FROM = os.getenv("TWILIO_FROM_NUMBER")
    
    twilio_client = Client(TW_SID, TW_TOKEN) if (TW_SID and TW_TOKEN) else None
    if not twilio_client:
        logger.warning("Twilio credentials not configured - OTP will be printed to console")
except ImportError:
    logger.warning("Twilio not installed - OTP will be printed to console")
    twilio_client = None
    TW_FROM = None

# In-memory OTP store for dev
# In production, store in Redis or database with TTL
OTP_STORE: Dict[str, tuple[str, int]] = {}  # {phone: (code, expires_at_timestamp)}
VERIFIED_PHONES: Dict[str, bool] = {}  # {phone: True} - Track verified phones temporarily

router = APIRouter(prefix="/otp", tags=["otp"])


def send_otp(phone: str) -> str:
    """
    Send OTP to phone number.
    
    Args:
        phone: Phone number in E.164 format (e.g., +1234567890)
        
    Returns:
        OTP code (for dev purposes)
    """
    code = f"{random.randint(100000, 999999)}"
    expires = int(time.time()) + 300  # 5 minutes
    
    OTP_STORE[phone] = (code, expires)
    
    if twilio_client and TW_FROM:
        try:
            twilio_client.messages.create(
                body=f"Your Protega verification code is: {code}. Valid for 5 minutes.",
                from_=TW_FROM,
                to=phone
            )
            logger.info(f"OTP sent to {phone} via Twilio")
        except Exception as e:
            logger.error(f"Failed to send OTP via Twilio: {e}")
            raise HTTPException(status_code=500, detail="Failed to send SMS")
    else:
        # Development mode - print to console
        logger.info(f"[DEV OTP] {phone} -> {code}")
        print(f"\n{'='*60}")
        print(f"OTP CODE: {code}")
        print(f"Phone: {phone}")
        print(f"Valid for 5 minutes")
        print(f"{'='*60}\n")
    
    return code


@router.post("/send")
async def send_otp_endpoint(data: dict):
    """
    Send OTP code to phone number for verification.
    
    Args:
        data: JSON body with 'phone'
        
    Returns:
        Success message
    """
    phone = data.get("phone")
    
    if not phone:
        raise HTTPException(status_code=400, detail="phone is required")
    
    # Send OTP
    code = send_otp(phone)
    
    return {
        "status": "sent",
        "message": f"Verification code sent to {phone}",
        "phone": phone,
        "code_preview": f"***{code[-2:]}" if twilio_client else code  # Only show in dev
    }


@router.post("/verify")
async def verify_otp(data: dict, db: Annotated[Session, Depends(get_db)]):
    """
    Verify OTP code and complete enrollment if flagged enrollments exist.
    
    Args:
        data: JSON body with 'phone' and 'code'
        
    Returns:
        Enrollment status
    """
    phone = data.get("phone")
    code = data.get("code")
    
    if not phone or not code:
        raise HTTPException(status_code=400, detail="phone and code are required")
    
    rec = OTP_STORE.get(phone)
    if not rec:
        raise HTTPException(status_code=400, detail="No OTP requested for this phone number")
    
    real_code, expires = rec
    
    # Check if expired
    if int(time.time()) > expires:
        del OTP_STORE[phone]
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    
    # Verify code
    if code != real_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    # OTP verified - remove from store and mark as verified
    del OTP_STORE[phone]
    VERIFIED_PHONES[phone] = True
    
    # Find flagged enrollment(s) for this phone pending OTP
    flagged = db.query(FlaggedEnroll).filter(
        FlaggedEnroll.phone == phone,
        FlaggedEnroll.resolved == False
    ).order_by(FlaggedEnroll.created_at.desc()).first()
    
    if not flagged:
        return {
            "status": "verified",
            "message": "OTP verified successfully. No pending enrollment found.",
        }
    
    # Proceed to create user using flagged data
    try:
        # Create Protega Identity
        p = ProtegaIdentity()
        db.add(p)
        db.flush()
        
        # Create User
        user = User(
            email=flagged.email,
            full_name="Verified User",  # Could be enhanced later
            stripe_customer_id=None,
            protega_identity_id=p.id,
            phone=phone,
            phone_verified=True,
            card_fingerprint=flagged.card_fingerprint
        )
        db.add(user)
        db.flush()
        
        # Create Biometric Template
        if flagged.fingerprint_hash:
            # Note: We need the salt - for now we'll use a default salt
            # In production, you should store the fingerprint data with flagged enrollment
            template = BiometricTemplate(
                user_id=user.id,
                template_hash=flagged.fingerprint_hash,
                salt="",  # This should be stored with the flagged enrollment
                active=True,
                device_id=flagged.device_id,
                enroll_ip=flagged.enroll_ip
            )
            db.add(template)
        
        # Mark flagged as resolved
        flagged.resolved = True
        flagged.resolved_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"User {user.id} enrolled after OTP verification for phone {phone}")
        
        return {
            "status": "enrolled",
            "user_id": user.id,
            "protega_id": p.id,
            "phone_verified": True,
            "message": "Enrollment completed successfully after OTP verification",
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to complete enrollment after OTP: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete enrollment")

