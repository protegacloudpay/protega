"""
Anti-fraud utilities for enrollment risk scoring and checks.
"""

import logging
import os
from datetime import datetime, timedelta
from typing import Tuple, List

import stripe
from sqlalchemy.orm import Session

from protega_api.models import User, BiometricTemplate, FlaggedEnroll

logger = logging.getLogger(__name__)

# Configuration
PROTEGA_DEVICE_LIMIT = int(os.getenv("PROTEGA_DEVICE_ENROLL_LIMIT", "3"))
RISK_OTP_THRESHOLD = int(os.getenv("PROTEGA_RISK_OTP_THRESHOLD", "30"))
RISK_KYC_THRESHOLD = int(os.getenv("PROTEGA_RISK_KYC_THRESHOLD", "60"))

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


def get_card_fingerprint_from_token(token: str) -> str | None:
    """
    Extract Stripe card fingerprint from payment method token.
    
    Args:
        token: Stripe payment method ID (e.g., pm_xxxxx)
        
    Returns:
        Card fingerprint string or None if not found
    """
    try:
        pm = stripe.PaymentMethod.retrieve(token)
        if hasattr(pm, "card") and pm.card:
            return pm.card.get("fingerprint")
        return None
    except Exception as e:
        logger.error(f"Failed to get card fingerprint from Stripe: {e}")
        return None


def device_enroll_count(db: Session, device_id: str, window_hours: int = 24) -> int:
    """
    Count enrollments from a device within the specified time window.
    
    Args:
        db: Database session
        device_id: Device identifier
        window_hours: Time window in hours (default: 24)
        
    Returns:
        Count of enrollments
    """
    if not device_id:
        return 0
    
    cutoff = datetime.utcnow() - timedelta(hours=window_hours)
    count = db.query(BiometricTemplate).filter(
        BiometricTemplate.device_id == device_id,
        BiometricTemplate.created_at >= cutoff
    ).count()
    
    return count


def compute_risk_score(
    db: Session,
    card_fp: str | None,
    phone: str | None,
    device_id: str | None,
    ip: str | None,
    fp_hash: str | None,
) -> Tuple[int, List[str]]:
    """
    Compute risk score and reasons for enrollment.
    
    Args:
        db: Database session
        card_fp: Stripe card fingerprint
        phone: User phone number
        device_id: Device identifier
        ip: IP address
        fp_hash: Fingerprint hash
        
    Returns:
        Tuple of (risk_score, reasons_list)
    """
    score = 0
    reasons = []
    
    # Card reuse detection (50 points)
    if card_fp:
        existing_user = db.query(User).filter(
            User.card_fingerprint == card_fp
        ).first()
        if existing_user:
            score += 50
            reasons.append("card_reuse")
    
    # Phone missing (20 points)
    if not phone:
        score += 20
        reasons.append("phone_missing")
    
    # Device velocity tracking (no penalty - just for analytics)
    if device_id:
        enroll_count = device_enroll_count(db, device_id)
        # Only add to reasons for tracking, no score impact
        if enroll_count > 0:
            reasons.append(f"device_enrolls_today_{enroll_count}")
    
    # IP velocity tracking (no penalty - just for analytics)
    if ip:
        cutoff = datetime.utcnow() - timedelta(hours=24)
        ip_count = db.query(BiometricTemplate).filter(
            BiometricTemplate.enroll_ip == ip,
            BiometricTemplate.created_at >= cutoff
        ).count()
        # Only add to reasons for tracking, no score impact
        if ip_count > 0:
            reasons.append(f"ip_enrolls_today_{ip_count}")
    
    # Fingerprint already registered (80 points - highest risk)
    if fp_hash:
        existing_fp = db.query(BiometricTemplate).filter(
            BiometricTemplate.template_hash == fp_hash,
            BiometricTemplate.active == True
        ).first()
        if existing_fp:
            score += 80
            reasons.append("fingerprint_already_registered")
    
    return score, reasons


def create_flagged_enroll(
    db: Session,
    email: str | None,
    phone: str | None,
    card_fp: str | None,
    fp_hash: str | None,
    device_id: str | None,
    enroll_ip: str | None,
    risk_score: int,
    reasons: List[str],
) -> FlaggedEnroll:
    """
    Create a flagged enrollment record.
    
    Args:
        db: Database session
        email: User email
        phone: User phone
        card_fp: Card fingerprint
        fp_hash: Fingerprint hash
        device_id: Device ID
        enroll_ip: IP address
        risk_score: Computed risk score
        reasons: List of risk reasons
        
    Returns:
        FlaggedEnroll instance (not committed)
    """
    flagged = FlaggedEnroll(
        email=email,
        phone=phone,
        card_fingerprint=card_fp,
        fingerprint_hash=fp_hash,
        device_id=device_id,
        enroll_ip=enroll_ip,
        risk_score=risk_score,
        reason="; ".join(reasons),
    )
    db.add(flagged)
    return flagged

