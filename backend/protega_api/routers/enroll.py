"""User enrollment endpoints."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from protega_api.adapters.hashing import derive_template_hash
from protega_api.adapters.hardware import get_hardware_adapter
from protega_api.adapters.payments import (
    attach_payment_method_and_get_details,
    create_customer,
)
from protega_api.db import get_db
from protega_api.models import BiometricTemplate, Consent, PaymentMethod, User, PaymentProvider
from protega_api.schemas import EnrollRequest, EnrollResponse

router = APIRouter(tags=["enrollment"])
logger = logging.getLogger(__name__)


def mask_email(email: str) -> str:
    """Mask email for privacy (e.g., j***@example.com)."""
    local, domain = email.split("@")
    if len(local) <= 2:
        masked_local = local[0] + "***"
    else:
        masked_local = local[0] + "***" + local[-1]
    return f"{masked_local}@{domain}"


@router.post("/enroll", response_model=EnrollResponse, status_code=status.HTTP_201_CREATED)
def enroll_user(
    request: EnrollRequest,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Enroll a new user with biometric template and payment method.
    
    Process:
    1. Find or create user by email
    2. Record consent for biometric processing
    3. Normalize and hash biometric template
    4. Create/retrieve Stripe customer
    5. Attach payment method to Stripe customer
    6. Store payment method details
    
    Returns:
        Enrollment confirmation with masked email and payment details
    """
    logger.info(f"Enrollment request for email: {request.email}")
    
    # Step 1: Find or create user
    user = db.query(User).filter(User.email == request.email).first()
    
    if user:
        logger.info(f"User already exists: {user.id}")
    else:
        # Create new user
        user = User(
            email=request.email,
            full_name=request.full_name
        )
        db.add(user)
        db.flush()  # Get user ID without committing
        logger.info(f"Created new user: {user.id}")
    
    # Step 2: Record consent
    consent = Consent(
        user_id=user.id,
        consent_text=request.consent_text
    )
    db.add(consent)
    logger.info(f"Recorded consent for user: {user.id}")
    
    # Step 3: Normalize and hash biometric template
    try:
        hardware_adapter = get_hardware_adapter()
        normalized_sample = hardware_adapter.to_template_input(request.fingerprint_sample)
        template_hash, salt = derive_template_hash(normalized_sample)
        
        # Check if template already exists (prevent duplicates)
        existing_template = db.query(BiometricTemplate).filter(
            BiometricTemplate.user_id == user.id,
            BiometricTemplate.template_hash == template_hash,
            BiometricTemplate.active == True
        ).first()
        
        if existing_template:
            logger.warning(f"Template already exists for user: {user.id}")
        else:
            template = BiometricTemplate(
                user_id=user.id,
                template_hash=template_hash,
                salt=salt,
                active=True
            )
            db.add(template)
            logger.info(f"Stored biometric template for user: {user.id}")
    
    except Exception as e:
        logger.error(f"Failed to process biometric template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process biometric template"
        )
    
    # Step 4: Create or retrieve Stripe customer
    if not user.stripe_customer_id:
        try:
            customer_id = create_customer(user.email, user.full_name)
            user.stripe_customer_id = customer_id
            logger.info(f"Created Stripe customer: {customer_id}")
        except Exception as e:
            logger.error(f"Failed to create Stripe customer: {e}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create payment customer"
            )
    
    # Step 5: Attach payment method
    try:
        pm_id, brand, last4, exp_month, exp_year = attach_payment_method_and_get_details(
            user.stripe_customer_id,
            request.stripe_payment_method_token
        )
        
        # Step 6: Store payment method details
        # Check if payment method already exists
        existing_pm = db.query(PaymentMethod).filter(
            PaymentMethod.user_id == user.id,
            PaymentMethod.provider_payment_method_id == pm_id
        ).first()
        
        if not existing_pm:
            # Set all existing payment methods as non-default
            db.query(PaymentMethod).filter(
                PaymentMethod.user_id == user.id
            ).update({"is_default": False})
            
            payment_method = PaymentMethod(
                user_id=user.id,
                provider=PaymentProvider.STRIPE,
                provider_payment_method_id=pm_id,
                brand=brand,
                last4=last4,
                exp_month=exp_month,
                exp_year=exp_year,
                is_default=True
            )
            db.add(payment_method)
        
        logger.info(f"Attached payment method for user: {user.id}")
        
    except Exception as e:
        logger.error(f"Failed to attach payment method: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to attach payment method: {str(e)}"
        )
    
    # Commit all changes
    db.commit()
    
    return EnrollResponse(
        user_id=user.id,
        masked_email=mask_email(user.email),
        brand=brand,
        last4=last4
    )

