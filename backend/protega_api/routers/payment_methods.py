"""Payment methods management routes."""

import logging
from typing import Annotated, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from protega_api import models, schemas
from protega_api.adapters import payments
from protega_api.deps import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/users/{user_id}/transactions",
    response_model=schemas.TransactionsListResponse,
    summary="List all transactions for a user",
)
def list_user_transactions(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    limit: int = 100,
    offset: int = 0
):
    """
    Retrieve all transactions for a specific user.
    
    Returns list of transactions with details like amount, date, and status.
    Only shows non-sensitive information.
    """
    # Verify user exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    
    # Get all transactions for user
    transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == user_id)
        .order_by(models.Transaction.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    
    total = db.query(models.Transaction).filter(
        models.Transaction.user_id == user_id
    ).count()
    
    items = []
    for txn in transactions:
        items.append(schemas.TransactionItem(
            id=txn.id,
            amount_cents=txn.amount_cents,
            protega_fee_cents=txn.protega_fee_cents if txn.protega_fee_cents is not None else 0,
            currency=txn.currency,
            status=txn.status.value,
            created_at=txn.created_at,
            merchant_ref=txn.merchant_ref
        ))
    
    return schemas.TransactionsListResponse(items=items, total=total)


@router.get(
    "/users/{user_id}/payment-methods",
    response_model=schemas.PaymentMethodListResponse,
    summary="List all payment methods for a user",
)
def list_payment_methods(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Retrieve all payment methods for a specific user.
    
    Returns list of payment methods with details like brand, last4, expiration, and default status.
    """
    # Verify user exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    
    # Get all payment methods for user
    payment_methods = (
        db.query(models.PaymentMethod)
        .filter(models.PaymentMethod.user_id == user_id)
        .order_by(models.PaymentMethod.is_default.desc(), models.PaymentMethod.created_at.desc())
        .all()
    )
    
    return schemas.PaymentMethodListResponse(
        items=payment_methods,
        total=len(payment_methods)
    )


@router.post(
    "/users/{user_id}/payment-methods",
    response_model=schemas.PaymentMethodResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new payment method",
)
def add_payment_method(
    user_id: int,
    payload: schemas.PaymentMethodCreate,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Add a new payment method to a user's account.
    
    - Attaches the Stripe PaymentMethod to the customer
    - Optionally sets it as the default payment method
    - Stores card details (brand, last4, expiration)
    """
    # Get user
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    
    if not user.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have a Stripe customer ID"
        )
    
    try:
        # Attach and retrieve the payment method from Stripe
        pm_data = payments.attach_pm_and_get(
            payload.stripe_payment_method_token,
            user.stripe_customer_id
        )
        
        # If setting as default, unset all other defaults
        if payload.set_default:
            db.query(models.PaymentMethod).filter(
                models.PaymentMethod.user_id == user_id
            ).update({"is_default": False})
            
            # Update Stripe customer's default payment method
            import stripe
            stripe.Customer.modify(
                user.stripe_customer_id,
                invoice_settings={"default_payment_method": pm_data["id"]}
            )
        
        # Create new payment method record
        new_pm = models.PaymentMethod(
            user_id=user_id,
            provider=models.PaymentProvider.STRIPE,
            provider_payment_method_id=pm_data["id"],
            brand=pm_data["brand"],
            last4=pm_data["last4"],
            exp_month=pm_data.get("exp_month"),
            exp_year=pm_data.get("exp_year"),
            is_default=payload.set_default
        )
        
        db.add(new_pm)
        db.commit()
        db.refresh(new_pm)
        
        logger.info(
            f"Added payment method {new_pm.id} for user {user_id} "
            f"({pm_data['brand']} ****{pm_data['last4']})"
        )
        
        return new_pm
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to add payment method: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add payment method: {str(e)}"
        )


@router.post(
    "/users/{user_id}/payment-methods/{pm_id}/default",
    response_model=schemas.SetDefaultPaymentMethodResponse,
    summary="Set a payment method as default",
)
def set_default_payment_method(
    user_id: int,
    pm_id: int,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Set a specific payment method as the default for a user.
    
    - Unsets all other payment methods as default
    - Updates Stripe customer's default payment method
    """
    # Get the payment method
    pm = (
        db.query(models.PaymentMethod)
        .filter(
            models.PaymentMethod.id == pm_id,
            models.PaymentMethod.user_id == user_id
        )
        .first()
    )
    
    if not pm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment method {pm_id} not found for user {user_id}"
        )
    
    # Get user for Stripe customer ID
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User or Stripe customer not found"
        )
    
    try:
        # Unset all other defaults
        db.query(models.PaymentMethod).filter(
            models.PaymentMethod.user_id == user_id
        ).update({"is_default": False})
        
        # Set this one as default
        pm.is_default = True
        
        # Update Stripe customer
        import stripe
        stripe.Customer.modify(
            user.stripe_customer_id,
            invoice_settings={"default_payment_method": pm.provider_payment_method_id}
        )
        
        db.commit()
        
        logger.info(
            f"Set payment method {pm_id} as default for user {user_id} "
            f"({pm.brand} ****{pm.last4})"
        )
        
        return schemas.SetDefaultPaymentMethodResponse(
            message=f"{pm.brand.upper()} ending in {pm.last4} set as default",
            payment_method_id=pm.id
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to set default payment method: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set default payment method: {str(e)}"
        )


@router.delete(
    "/users/{user_id}/payment-methods/{pm_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a payment method",
)
def delete_payment_method(
    user_id: int,
    pm_id: int,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Delete a payment method from a user's account.
    
    - Detaches the payment method from Stripe
    - Removes it from the database
    - Cannot delete if it's the only payment method
    """
    # Get the payment method
    pm = (
        db.query(models.PaymentMethod)
        .filter(
            models.PaymentMethod.id == pm_id,
            models.PaymentMethod.user_id == user_id
        )
        .first()
    )
    
    if not pm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment method {pm_id} not found for user {user_id}"
        )
    
    # Check if this is the only payment method
    pm_count = (
        db.query(models.PaymentMethod)
        .filter(models.PaymentMethod.user_id == user_id)
        .count()
    )
    
    if pm_count <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the only payment method. Add another one first."
        )
    
    try:
        # Detach from Stripe
        import stripe
        stripe.PaymentMethod.detach(pm.provider_payment_method_id)
        
        # Delete from database
        db.delete(pm)
        db.commit()
        
        logger.info(
            f"Deleted payment method {pm_id} for user {user_id} "
            f"({pm.brand} ****{pm.last4})"
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete payment method: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete payment method: {str(e)}"
        )

