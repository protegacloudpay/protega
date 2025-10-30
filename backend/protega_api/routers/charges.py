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

