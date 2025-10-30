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
    # Normalize phone number for consistency
    normalized_phone = request.phone.strip() if request.phone else None
    logger.info(f"Enrollment request for email: {request.email}, phone: {normalized_phone}")
    logger.info(f"Raw phone: '{request.phone}', Normalized phone: '{normalized_phone}'")
    
    # Step 0: Check for duplicate phone number across ALL users
    existing_user_by_phone = db.query(User).filter(User.phone == normalized_phone).first()
    if existing_user_by_phone:
        logger.error(f"DUPLICATE PHONE DETECTED: Phone {normalized_phone} already exists for user {existing_user_by_phone.id}")
        logger.warning(f"Phone number {normalized_phone} already registered for user: {existing_user_by_phone.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"This phone number is already registered to another account. "
                f"Each phone number can only be associated with one account. "
                f"Please use a different phone number or contact support."
            )
        )
    
    # Step 1: Find or create user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    if user:
        logger.info(f"User already exists: {user.id}")
        # Check if this existing user already has a different phone
        if user.phone and user.phone != normalized_phone:
            logger.warning(f"User {user.id} attempting to change phone from {user.phone} to {normalized_phone}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"This account already has a different phone number registered. "
                    f"Please use your original phone number or contact support."
                )
            )
        # Update phone if not already set
        if not user.phone and normalized_phone:
            user.phone = normalized_phone
    else:
        # Create new user
        user = User(
            email=request.email,
            full_name=request.full_name,
            phone=normalized_phone
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
        
        # Check for duplicate fingerprints across all users BEFORE creating new hash
        # Since each template has its own salt, we need to verify against all existing templates
        all_existing_templates = db.query(BiometricTemplate).filter(
            BiometricTemplate.active == True
        ).all()
        
        from protega_api.adapters.hashing import verify_template_hash
        
        logger.info(f"Checking {len(all_existing_templates)} existing templates for duplicates")
        logger.info(f"Normalized sample (first 50 chars): {normalized_sample[:50]}")
        
        for existing_template in all_existing_templates:
            if existing_template.user_id != user.id:
                # Verify if this fingerprint matches any existing template
                try:
                    match = verify_template_hash(
                        normalized_sample,
                        existing_template.template_hash,
                        existing_template.salt
                    )
                    if match:
                        logger.error(
                            f"DUPLICATE FINGERPRINT DETECTED! Fingerprint already registered for user: {existing_template.user_id}, "
                            f"attempted enrollment for user: {user.id}"
                        )
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=(
                                "This fingerprint is already registered to another account. "
                                "Each fingerprint can only be associated with one account for security reasons. "
                                "If you believe this is an error, please contact support."
                            )
                        )
                except HTTPException:
                    raise  # Re-raise HTTP exceptions
                except Exception as e:
                    logger.error(f"Error verifying template for user {existing_template.user_id}: {e}")
        
        # No duplicates found, proceed with creating new hash
        template_hash, salt = derive_template_hash(normalized_sample)
        logger.info("No duplicate fingerprints found, creating new template")
        
        # Check if template already exists for THIS user (user re-enrolling same finger)
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
    
    # Step 5: Check for duplicate card BEFORE attaching payment method
    # First, attach payment method to get the card fingerprint
    pm_id, brand, last4, exp_month, exp_year, card_fingerprint = None, None, None, None, None, None
    
    try:
        pm_id, brand, last4, exp_month, exp_year, card_fingerprint = attach_payment_method_and_get_details(
            user.stripe_customer_id,
            request.stripe_payment_method_token
        )
        
        # Check for duplicate card fingerprint across ALL users
        if card_fingerprint:
            logger.info(f"Checking for duplicate card fingerprint: {card_fingerprint}")
            existing_user_with_card = db.query(User).filter(User.card_fingerprint == card_fingerprint).first()
            if existing_user_with_card and existing_user_with_card.id != user.id:
                logger.error(f"DUPLICATE CARD DETECTED: Card fingerprint {card_fingerprint} already exists for user {existing_user_with_card.id}")
                db.rollback()  # Rollback before raising exception
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"This credit card is already registered to another account. "
                        f"Each credit card can only be associated with one account for security reasons. "
                        f"Please use a different payment method or contact support."
                    )
                )
            
            # Store card fingerprint on user
            user.card_fingerprint = card_fingerprint
            logger.info(f"Stored card fingerprint {card_fingerprint} for user: {user.id}")
        
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

