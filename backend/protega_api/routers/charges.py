"""
Charge management endpoints for merchant-to-customer payments.
"""

import logging
import secrets
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from protega_api.db import get_db
from protega_api.models import Transaction, User, PaymentMethod
from protega_api.deps import get_current_merchant
from protega_api.routers.websocket import broadcast_charge_update

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/merchant", tags=["charges"])


class CreateChargeRequest(BaseModel):
    amount_cents: int
    description: str = "Payment requested"
    currency: str = "usd"


class CreateChargeResponse(BaseModel):
    charge_id: str
    amount_cents: int
    description: str
    status: str
    customer_code: str
    merchant_id: int
    created_at: str


class UpdateChargeRequest(BaseModel):
    amount: str = None
    description: str = None


@router.post("/create-charge", response_model=CreateChargeResponse)
def create_charge(
    request: CreateChargeRequest,
    db: Annotated[Session, Depends(get_db)],
    merchant = Depends(get_current_merchant)
):
    """
    Create a pending charge that customers can accept.
    
    Returns a charge ID that merchants can share with customers.
    """
    # Generate unique charge ID
    charge_id = secrets.token_urlsafe(16)
    customer_code = secrets.token_urlsafe(8).upper()[:8]
    
    # Create pending transaction record
    transaction = Transaction(
        amount_cents=request.amount_cents,
        currency=request.currency,
        description=request.description,
        status="pending",
        merchant_id=merchant.id,
        customer_ref=f"CHARGE_{charge_id}",  # Temporary customer reference
        metadata={
            "charge_id": charge_id,
            "customer_code": customer_code,
            "type": "pending_charge"
        }
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    logger.info(f"Created pending charge {charge_id} for merchant {merchant.id}")
    
    return CreateChargeResponse(
        charge_id=charge_id,
        amount_cents=request.amount_cents,
        description=request.description,
        status="pending",
        customer_code=customer_code,
        merchant_id=merchant.id,
        created_at=transaction.created_at.isoformat()
    )


@router.post("/charge/{charge_id}/update")
async def update_charge(
    charge_id: str,
    request: UpdateChargeRequest,
    db: Annotated[Session, Depends(get_db)],
    merchant = Depends(get_current_merchant)
):
    """
    Update a pending charge. Broadcasts changes to all connected customers.
    """
    # Find the pending transaction
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.metadata['charge_id'].astext == charge_id,
            Transaction.merchant_id == merchant.id,
            Transaction.status == 'pending'
        )
        .first()
    )
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Charge not found"
        )
    
    # Update the transaction
    if request.amount is not None:
        transaction.amount_cents = int(float(request.amount) * 100)
    if request.description is not None:
        transaction.description = request.description
    
    db.commit()
    
    # Broadcast update to all connected customers
    update_data = {
        "amount": f"{transaction.amount_cents / 100:.2f}",
        "description": transaction.description,
        "amount_cents": transaction.amount_cents
    }
    
    await broadcast_charge_update(charge_id, update_data)
    
    logger.info(f"Updated charge {charge_id} and broadcast to customers")
    
    return {
        "status": "success",
        "charge_id": charge_id,
        "data": update_data
    }

