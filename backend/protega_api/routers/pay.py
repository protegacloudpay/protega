"""Payment processing endpoints."""

import logging
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from protega_api.adapters.hashing import verify_template_hash
from protega_api.adapters.hardware import get_hardware_adapter
from protega_api.adapters.payments import charge
from protega_api.db import get_db
from protega_api.models import (
    BiometricTemplate,
    PaymentMethod,
    Terminal,
    Transaction,
    TransactionStatus,
    User,
    PaymentProvider,
)
from protega_api.schemas import PayRequest, PayResponse, IdentifyUserRequest

router = APIRouter(tags=["payments"])
logger = logging.getLogger(__name__)

# Protega CloudPay Revenue Model
PROTEGA_PERCENT_FEE = Decimal("0.0025")  # 0.25% per transaction
PROTEGA_FLAT_FEE_CENTS = 30               # $0.30 flat fee per transaction


@router.post("/identify-user")
def identify_user_by_fingerprint(
    request: IdentifyUserRequest,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Identify a user by their fingerprint sample.
    
    Used by merchants to look up a customer before processing payment.
    Returns the user's ID so their payment methods can be fetched.
    
    Args:
        request: Request containing fingerprint_sample
        
    Returns:
        Dict with user_id and user details
    """
    fingerprint_sample = request.fingerprint_sample
    
    logger.info("Identifying user by fingerprint")
    
    # Normalize fingerprint
    adapter = get_hardware_adapter()
    normalized_sample = adapter.to_template_input(fingerprint_sample)
    
    # Match against all biometric templates
    templates = db.query(BiometricTemplate).all()
    
    matched_user_id = None
    for template in templates:
        if verify_template_hash(normalized_sample, template.template_hash, template.salt):
            matched_user_id = template.user_id
            logger.info(f"Fingerprint matched for user: {matched_user_id}")
            break
    
    if not matched_user_id:
        logger.warning("No biometric match found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found. Please enroll first."
        )
    
    # Get user details
    user = db.query(User).filter(User.id == matched_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User record not found"
        )
    
    return {
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "message": "Customer identified successfully"
    }


@router.post("/pay", response_model=PayResponse)
def process_payment(
    request: PayRequest,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Process a biometric payment.
    
    Process:
    1. Authenticate terminal using API key
    2. Normalize incoming fingerprint sample
    3. Match biometric template against stored hashes
    4. Retrieve user's default payment method
    5. Process payment via Stripe
    6. Record transaction
    
    Returns:
        Payment result with transaction ID and status
    """
    logger.info("Payment request received")
    
    # Step 1: Authenticate terminal
    terminal = db.query(Terminal).filter(
        Terminal.api_key == request.terminal_api_key
    ).first()
    
    if not terminal:
        logger.warning(f"Invalid terminal API key")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid terminal credentials"
        )
    
    merchant_id = terminal.merchant_id
    logger.info(f"Authenticated terminal for merchant: {merchant_id}")
    
    # Step 2: Normalize fingerprint sample
    try:
        hardware_adapter = get_hardware_adapter()
        normalized_sample = hardware_adapter.to_template_input(request.fingerprint_sample)
    except Exception as e:
        logger.error(f"Failed to normalize fingerprint sample: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid fingerprint sample"
        )
    
    # Step 3: Find matching biometric template
    # Retrieve all active templates
    active_templates = db.query(BiometricTemplate).filter(
        BiometricTemplate.active == True
    ).all()
    
    matched_template = None
    for template in active_templates:
        if verify_template_hash(
            normalized_sample,
            template.template_hash,
            template.salt
        ):
            matched_template = template
            break
    
    if not matched_template:
        logger.warning("No matching biometric template found")
        
        # Record failed transaction (without user_id)
        transaction = Transaction(
            merchant_id=merchant_id,
            user_id=None,
            amount_cents=request.amount_cents,
            currency=request.currency,
            status=TransactionStatus.FAILED,
            merchant_ref=request.merchant_ref
        )
        db.add(transaction)
        db.commit()
        
        return PayResponse(
            status="failed",
            transaction_id=transaction.id,
            message="Biometric authentication failed"
        )
    
    user = matched_template.user
    logger.info(f"Matched biometric for user: {user.id}")
    
    # Step 4: Retrieve payment method
    # If a specific payment method is requested, use that; otherwise use default
    if request.payment_method_provider_ref:
        logger.info(f"Using specified payment method: {request.payment_method_provider_ref}")
        payment_method = db.query(PaymentMethod).filter(
            PaymentMethod.user_id == user.id,
            PaymentMethod.provider == PaymentProvider.STRIPE,
            PaymentMethod.provider_payment_method_id == request.payment_method_provider_ref
        ).first()
        
        if not payment_method:
            logger.error(f"Specified payment method not found: {request.payment_method_provider_ref}")
            
            transaction = Transaction(
                merchant_id=merchant_id,
                user_id=user.id,
                amount_cents=request.amount_cents,
                currency=request.currency,
                status=TransactionStatus.FAILED,
                merchant_ref=request.merchant_ref
            )
            db.add(transaction)
            db.commit()
            
            return PayResponse(
                status="failed",
                transaction_id=transaction.id,
                message="Specified payment method not found"
            )
    else:
        # Use default payment method
        payment_method = db.query(PaymentMethod).filter(
            PaymentMethod.user_id == user.id,
            PaymentMethod.provider == PaymentProvider.STRIPE,
            PaymentMethod.is_default == True
        ).first()
        
        if not payment_method:
            logger.error(f"No default payment method for user: {user.id}")
            
            transaction = Transaction(
                merchant_id=merchant_id,
                user_id=user.id,
                amount_cents=request.amount_cents,
                currency=request.currency,
                status=TransactionStatus.FAILED,
                merchant_ref=request.merchant_ref
            )
            db.add(transaction)
            db.commit()
            
            return PayResponse(
                status="failed",
                transaction_id=transaction.id,
                message="No payment method found"
            )
    
    # Step 5: Calculate Protega fee (deducted from merchant's portion)
    # Protega earns 0.25% + $0.30 per transaction
    protega_fee_cents = int(request.amount_cents * PROTEGA_PERCENT_FEE) + PROTEGA_FLAT_FEE_CENTS
    merchant_receives_cents = request.amount_cents - protega_fee_cents
    
    logger.info(
        f"Payment breakdown - Customer Pays: ${request.amount_cents/100:.2f}, "
        f"Protega Fee: ${protega_fee_cents/100:.2f}, "
        f"Merchant Receives: ${merchant_receives_cents/100:.2f}"
    )
    
    # Step 6: Process payment via Stripe (charge customer the set price)
    try:
        payment_status, intent_id = charge(
            amount_cents=request.amount_cents,  # Charge customer only the transaction amount
            currency=request.currency,
            customer_id=user.stripe_customer_id,
            payment_method_id=payment_method.provider_payment_method_id,
            metadata={
                "merchant_id": str(merchant_id),
                "user_id": str(user.id),
                "merchant_ref": request.merchant_ref or "",
                "base_amount_cents": str(request.amount_cents),
                "protega_fee_cents": str(protega_fee_cents),
                "protega_revenue_model": "0.25% + $0.30"
            }
        )
        
        logger.info(f"Payment processed: {payment_status} - {intent_id}")
        
    except Exception as e:
        logger.error(f"Payment processing failed: {e}")
        payment_status = "failed"
        intent_id = None
        protega_fee_cents = 0  # Don't charge fee if payment fails
    
    # Step 7: Record transaction (with Protega fee tracked)
    transaction = Transaction(
        merchant_id=merchant_id,
        user_id=user.id,
        amount_cents=request.amount_cents,  # Base merchant amount
        protega_fee_cents=protega_fee_cents if payment_status == "succeeded" else 0,
        currency=request.currency,
        status=TransactionStatus.SUCCEEDED if payment_status == "succeeded" else TransactionStatus.FAILED,
        processor_txn_id=intent_id,
        merchant_ref=request.merchant_ref
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    if payment_status == "succeeded":
        return PayResponse(
            status="succeeded",
            transaction_id=transaction.id,
            message=(
                f"Transaction Approved - "
                f"Customer Paid: ${request.amount_cents/100:.2f}, "
                f"Protega Fee: ${protega_fee_cents/100:.2f}, "
                f"Merchant Receives: ${merchant_receives_cents/100:.2f}"
            )
        )
    else:
        return PayResponse(
            status="failed",
            transaction_id=transaction.id,
            message="Payment declined"
        )

