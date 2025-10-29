"""Merchant account and transaction endpoints."""

import logging
import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from protega_api.db import get_db
from protega_api.deps import get_current_merchant
from protega_api.models import Merchant, Terminal, Transaction
from protega_api.schemas import (
    MerchantLoginRequest,
    MerchantLoginResponse,
    MerchantSignupRequest,
    MerchantSignupResponse,
    TransactionItem,
    TransactionsListResponse,
)
from protega_api.security import create_jwt, hash_password, verify_password

router = APIRouter(prefix="/merchant", tags=["merchant"])
logger = logging.getLogger(__name__)


def generate_api_key() -> str:
    """Generate a secure random API key for terminals."""
    return secrets.token_urlsafe(32)


@router.post("/signup", response_model=MerchantSignupResponse, status_code=status.HTTP_201_CREATED)
def signup_merchant(
    request: MerchantSignupRequest,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Create a new merchant account.
    
    Process:
    1. Check if merchant already exists
    2. Hash password
    3. Create merchant record
    4. Create initial terminal with API key
    
    Returns:
        Merchant details with terminal API key
    """
    logger.info(f"Merchant signup request for: {request.email}")
    
    # Check if merchant already exists
    existing = db.query(Merchant).filter(Merchant.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Merchant with this email already exists"
        )
    
    # Hash password
    password_hash = hash_password(request.password)
    
    # Create merchant
    merchant = Merchant(
        email=request.email,
        name=request.name,
        password_hash=password_hash
    )
    db.add(merchant)
    db.flush()  # Get merchant ID
    
    # Create initial terminal
    api_key = generate_api_key()
    terminal = Terminal(
        merchant_id=merchant.id,
        label="Default Terminal",
        api_key=api_key
    )
    db.add(terminal)
    
    db.commit()
    
    logger.info(f"Created merchant: {merchant.id}")
    
    return MerchantSignupResponse(
        merchant_id=merchant.id,
        email=merchant.email,
        name=merchant.name,
        terminal_api_key=api_key
    )


@router.post("/login", response_model=MerchantLoginResponse)
def login_merchant(
    request: MerchantLoginRequest,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Authenticate a merchant and issue JWT token.
    
    Args:
        request: Login credentials
        
    Returns:
        JWT token and merchant details
    """
    logger.info(f"Login attempt for: {request.email}")
    
    # Find merchant
    merchant = db.query(Merchant).filter(Merchant.email == request.email).first()
    
    if not merchant:
        logger.warning(f"Merchant not found: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(request.password, merchant.password_hash):
        logger.warning(f"Invalid password for: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create JWT token
    token = create_jwt({"sub": str(merchant.id), "email": merchant.email})
    
    logger.info(f"Merchant logged in: {merchant.id}")
    
    return MerchantLoginResponse(
        token=token,
        merchant_id=merchant.id,
        email=merchant.email,
        name=merchant.name
    )


@router.get("/transactions", response_model=TransactionsListResponse)
def list_transactions(
    merchant: Annotated[Merchant, Depends(get_current_merchant)],
    db: Annotated[Session, Depends(get_db)],
    limit: int = 100,
    offset: int = 0
):
    """
    List transactions for the authenticated merchant.
    
    Args:
        merchant: Current authenticated merchant
        limit: Maximum number of transactions to return
        offset: Number of transactions to skip
        
    Returns:
        List of transactions with user details
    """
    logger.info(f"Fetching transactions for merchant: {merchant.id}")
    
    # Query transactions with user join
    transactions_query = (
        db.query(Transaction)
        .filter(Transaction.merchant_id == merchant.id)
        .order_by(Transaction.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    
    transactions = transactions_query.all()
    
    # Get total count
    total = db.query(Transaction).filter(Transaction.merchant_id == merchant.id).count()
    
    # Build response items
    items = []
    for txn in transactions:
        user_email = None
        if txn.user_id:
            user_email = txn.user.email if txn.user else None
        
        items.append(TransactionItem(
            id=txn.id,
            amount_cents=txn.amount_cents,
            currency=txn.currency,
            status=txn.status.value,
            created_at=txn.created_at,
            user_email=user_email,
            merchant_ref=txn.merchant_ref
        ))
    
    return TransactionsListResponse(items=items, total=total)

