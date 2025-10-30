"""
Customers router for merchant operations.
"""

import logging
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from protega_api.deps import get_db, get_current_merchant
from protega_api.models import User, Transaction
from protega_api.schemas import CustomerListResponse, CustomerListItem

logger = logging.getLogger(__name__)
router = APIRouter(tags=["customers"])


@router.get("/customers", response_model=CustomerListResponse)
def list_customers(
    merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db),
    limit: int = 100,
    offset: int = 0
):
    """
    List all customers who have made transactions with this merchant.
    Only shows non-sensitive information.
    """
    logger.info(f"Listing customers for merchant: {merchant.id}")
    
    # Get all unique customers who have transactions with this merchant
    transactions = db.query(Transaction).filter(
        Transaction.merchant_id == merchant.id,
        Transaction.user_id.isnot(None)
    ).distinct(Transaction.user_id).all()
    
    customer_ids = list(set([txn.user_id for txn in transactions if txn.user_id]))
    
    # Get user details for these customers
    customers = db.query(User).filter(User.id.in_(customer_ids)).all() if customer_ids else []
    
    # Format response (non-sensitive info only)
    items = []
    for customer in customers:
        # Count transactions
        txn_count = db.query(Transaction).filter(
            Transaction.merchant_id == merchant.id,
            Transaction.user_id == customer.id
        ).count()
        
        # Get total spent
        total_cents = db.query(Transaction).filter(
            Transaction.merchant_id == merchant.id,
            Transaction.user_id == customer.id,
            Transaction.status == "succeeded"
        ).with_entities(db.func.sum(Transaction.amount_cents)).scalar() or 0
        
        items.append(CustomerListItem(
            customer_id=customer.id,
            masked_name=customer.full_name[:1] + "*" * (len(customer.full_name) - 2) + customer.full_name[-1] if len(customer.full_name) > 2 else "**",
            masked_email=f"{customer.email[:2]}***@{customer.email.split('@')[1]}" if customer.email and '@' in customer.email else None,
            transaction_count=txn_count,
            total_spent_cents=total_cents,
            first_seen=customer.created_at,
            last_seen=customer.updated_at if customer.updated_at else customer.created_at
        ))
    
    # Sort by last seen (most recent first)
    items.sort(key=lambda x: x.last_seen, reverse=True)
    
    logger.info(f"Found {len(items)} customers for merchant: {merchant.id}")
    
    return CustomerListResponse(
        items=items,
        total=len(items)
    )

