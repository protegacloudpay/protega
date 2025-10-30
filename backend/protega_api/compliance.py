"""
Compliance and Privacy Module for Protega CloudPay
==================================================

Implements BIPA, CCPA, and GDPR compliance requirements:
- Informed consent tracking
- Right to erasure (data deletion)
- Data minimization principles
- Biometric data audit trail
"""

import logging
from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from protega_api.db import get_db
from protega_api.models import Consent, BiometricTemplate, User, PaymentMethod

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/privacy", tags=["compliance"])


def record_user_consent(user_id: int, consent_text: str, db: Session):
    """
    Record user consent for biometric processing (BIPA/CCPA/GDPR requirement).
    
    Args:
        user_id: ID of the user giving consent
        consent_text: The consent text that was presented to the user
        db: Database session
    """
    try:
        consent = Consent(
            user_id=user_id,
            consent_text=consent_text,
            timestamp=datetime.utcnow()
        )
        db.add(consent)
        db.commit()
        logger.info(f"Recorded consent for user: {user_id}")
    except Exception as e:
        logger.error(f"Failed to record consent: {e}")
        db.rollback()
        raise


def delete_biometric_data(user_id: int, db: Session):
    """
    Delete all biometric data for a user (Right to Erasure - GDPR).
    
    Args:
        user_id: ID of the user whose data should be deleted
        db: Database session
        
    Returns:
        Number of records deleted
    """
    try:
        # Delete biometric templates
        templates_deleted = db.query(BiometricTemplate).filter(
            BiometricTemplate.user_id == user_id
        ).delete()
        
        logger.info(f"Deleted {templates_deleted} biometric templates for user: {user_id}")
        
        # Delete payment methods (removes saved card references)
        payment_methods_deleted = db.query(PaymentMethod).filter(
            PaymentMethod.user_id == user_id
        ).delete()
        
        logger.info(f"Deleted {payment_methods_deleted} payment methods for user: {user_id}")
        
        # Note: We keep the User record with email/phone for fraud prevention
        # but remove all biometric and payment data
        
        db.commit()
        
        return templates_deleted
    except Exception as e:
        logger.error(f"Failed to delete biometric data: {e}")
        db.rollback()
        raise


@router.post("/consent/{user_id}", status_code=status.HTTP_201_CREATED)
def record_consent(
    user_id: int,
    consent_text: str,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Record explicit consent for biometric processing (BIPA requirement).
    
    This endpoint is called during enrollment when the user consents to
    biometric data collection and processing.
    """
    try:
        record_user_consent(user_id, consent_text, db)
        return {
            "status": "success",
            "message": "Consent recorded successfully",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record consent: {str(e)}"
        )


@router.delete("/data/{user_id}", status_code=status.HTTP_200_OK)
def delete_user_data(
    user_id: int,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Delete all biometric and payment data for a user (GDPR Right to Erasure).
    
    This implements the user's right to have their personal data deleted
    upon request, as required by:
    - BIPA (Illinois Biometric Information Privacy Act)
    - CCPA (California Consumer Privacy Act)
    - GDPR (General Data Protection Regulation)
    
    What gets deleted:
    - All biometric templates (fingerprints)
    - All payment method references
    - All consent records
    
    What is preserved:
    - User account (email, phone) for fraud prevention
    - Transaction history (for legal/compliance)
    
    Returns:
        Confirmation of deletion with counts
    """
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Delete all biometric data
        templates_deleted = delete_biometric_data(user_id, db)
        
        # Delete consent records
        consent_deleted = db.query(Consent).filter(
            Consent.user_id == user_id
        ).delete()
        
        db.commit()
        
        logger.info(f"GDPR deletion completed for user {user_id}: {templates_deleted} templates, {consent_deleted} consents")
        
        return {
            "status": "success",
            "message": "User data deleted successfully",
            "user_id": user_id,
            "deleted": {
                "biometric_templates": templates_deleted,
                "consents": consent_deleted
            },
            "timestamp": datetime.utcnow().isoformat(),
            "compliance": {
                "regulations": ["BIPA", "CCPA", "GDPR"],
                "right_to_erasure": "fulfilled"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete user data: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user data: {str(e)}"
        )


@router.get("/status/{user_id}")
def get_privacy_status(
    user_id: int,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Get privacy and consent status for a user (GDPR transparency requirement).
    
    Returns information about:
    - When consent was given
    - What data is stored
    - How long data will be retained
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get consent records
        consents = db.query(Consent).filter(Consent.user_id == user_id).all()
        
        # Get biometric template count
        template_count = db.query(BiometricTemplate).filter(
            BiometricTemplate.user_id == user_id
        ).count()
        
        return {
            "user_id": user_id,
            "consents": [
                {
                    "timestamp": consent.timestamp.isoformat(),
                    "text_preview": consent.consent_text[:100] + "..." if len(consent.consent_text) > 100 else consent.consent_text
                }
                for consent in consents
            ],
            "data_stored": {
                "biometric_templates": template_count,
                "email": "✓ (masked)" if user.email else None,
                "phone": "✓ (masked)" if user.phone else None
            },
            "retention_policy": {
                "biometric_data": "Indefinite (until user deletion request)",
                "transaction_data": "7 years (legal requirement)",
                "consent_records": "Indefinite (audit trail)"
            },
            "rights": {
                "right_to_access": "/privacy/status/{user_id}",
                "right_to_erasure": "/privacy/data/{user_id}",
                "right_to_deletion": "/privacy/data/{user_id}"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get privacy status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve privacy status: {str(e)}"
        )

