"""User enrollment endpoints."""

import json
import logging
from typing import Annotated

import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from protega_api.adapters.hashing import derive_template_hash
from protega_api.adapters.payments import (
    attach_payment_method_and_get_details,
    create_customer,
)
from protega_api.sdk import get_fingerprint_reader
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
    
    # Step 3: Secure Enclave - Encrypt and hash biometric template
    try:
        from protega_api.security_enclave import encrypt_sensitive
        import hashlib
        
        # Get fingerprint reader (SDK or simulated)
        reader = get_fingerprint_reader()
        
        # Capture fingerprint from hardware SDK (or use provided sample for testing)
        if request.fingerprint_sample:
            # If sample provided, use it (for development/testing)
            fingerprint_sample = request.fingerprint_sample
            logger.info("Using provided fingerprint sample (development mode)")
        else:
            # Capture from hardware
            logger.info("Capturing fingerprint from hardware SDK")
            fingerprint_sample = reader.capture_sample()
            if not fingerprint_sample:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Fingerprint capture failed. Please try again."
                )
        
        # Normalize and hash the template
        normalized_sample = reader.normalize_template(fingerprint_sample)
        template_hash = reader.hash_template(fingerprint_sample)
        
        logger.info(f"Checking for duplicate fingerprint hash: {template_hash[:16]}...")
        
        # Check for duplicate hash (globally unique - fast check)
        existing_template = db.query(BiometricTemplate).filter(
            BiometricTemplate.template_hash == template_hash
        ).first()
        
        if existing_template:
            logger.error(
                f"DUPLICATE FINGERPRINT DETECTED! Hash already exists for user: {existing_template.user_id}, "
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
        
        # Biometric similarity scoring - detect near-duplicates
        from protega_api.sdk import get_fingerprint_matcher
        
        matcher = get_fingerprint_matcher()
        
        # Extract feature vector from the new fingerprint
        new_feature_vector = matcher.extract_features(fingerprint_sample)
        
        # Load existing feature vectors from database
        logger.info("Checking for near-duplicate fingerprints using similarity scoring")
        existing_templates = db.query(BiometricTemplate).filter(
            BiometricTemplate.active == True,
            BiometricTemplate.feature_vector != None  # Only check those with feature vectors
        ).all()
        
        existing_vectors = []
        for template in existing_templates:
            try:
                vector_json = json.loads(template.feature_vector)
                vector = np.array(vector_json, dtype=np.float32)
                existing_vectors.append((template.id, vector))
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(f"Failed to parse feature vector for template {template.id}: {e}")
                continue
        
        # Check for similar fingerprints
        is_duplicate, match_info = matcher.is_duplicate(new_feature_vector, existing_vectors)
        
        if is_duplicate and match_info:
            match_id, similarity_score = match_info
            logger.error(
                f"SIMILAR FINGERPRINT DETECTED! Similarity score: {similarity_score:.3f}, "
                f"existing template ID: {match_id}, attempted enrollment for user: {user.id}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "This fingerprint is too similar to an existing registered fingerprint. "
                    f"Similarity: {similarity_score:.1%}. "
                    "Each person can only register once per account. "
                    "If you believe this is an error, please contact support."
                )
            )
        
        # Encrypt the biometric template using Secure Enclave
        logger.info("Encrypting biometric template with Secure Enclave")
        salt_b64, encrypted_template = encrypt_sensitive(normalized_sample)
        
        # Also create legacy PBKDF2 hash for backwards compatibility
        from protega_api.adapters.hashing import derive_template_hash
        pbkdf2_hash, pbkdf2_salt = derive_template_hash(normalized_sample)
        
        # Multi-finger support: Check existing fingerprint count
        existing_fp_count = db.query(BiometricTemplate).filter(
            BiometricTemplate.user_id == user.id,
            BiometricTemplate.active == True
        ).count()
        
        if existing_fp_count >= 3:
            logger.error(
                f"User {user.id} attempting to register more than 3 fingerprints "
                f"(current count: {existing_fp_count})"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Maximum number of fingerprints reached. "
                    "You can register up to 3 fingers per account for security. "
                    f"Currently registered: {existing_fp_count}/3"
                )
            )
        
        # Check if this specific finger is already registered for this user
        existing_finger = db.query(BiometricTemplate).filter(
            BiometricTemplate.user_id == user.id,
            BiometricTemplate.finger_label == request.finger_label,
            BiometricTemplate.active == True
        ).first()
        
        if existing_finger:
            logger.warning(
                f"User {user.id} attempting to re-register {request.finger_label} "
                f"(existing template ID: {existing_finger.id})"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"This finger ({request.finger_label}) is already registered. "
                    "You can only register each finger once."
                )
            )
        
        # Store feature vector as JSON for similarity matching
        feature_vector_json = json.dumps(new_feature_vector.tolist())
        
        # Store encrypted template with Secure Enclave
        template = BiometricTemplate(
            user_id=user.id,
            template_hash=template_hash,  # SHA-256 for duplicate detection
            salt=pbkdf2_salt,  # Legacy PBKDF2 salt
            salt_b64=salt_b64,  # NEW: Encryption salt
            encrypted_template=encrypted_template,  # NEW: AES-256-GCM encrypted
            feature_vector=feature_vector_json,  # Biometric similarity scoring
            finger_label=request.finger_label,  # Multi-finger support
            active=True
        )
        db.add(template)
        logger.info(
            f"Stored encrypted biometric template for user: {user.id}, "
            f"finger: {request.finger_label} (Secure Enclave + Similarity Scoring)"
        )
    
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

