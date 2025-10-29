"""Pydantic schemas for request/response validation."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ============================================================================
# Enrollment Schemas
# ============================================================================

class EnrollRequest(BaseModel):
    """Request to enroll a new user with biometric and payment method."""
    
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    fingerprint_sample: str = Field(..., min_length=1, max_length=10000)
    consent_text: str = Field(..., min_length=10)
    stripe_payment_method_token: str = Field(..., min_length=1)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        """Validate full name is not empty after stripping."""
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


class EnrollResponse(BaseModel):
    """Response after successful enrollment."""
    
    user_id: int
    masked_email: str
    brand: Optional[str] = None
    last4: Optional[str] = None
    message: str = "Enrollment successful"


# ============================================================================
# Payment Schemas
# ============================================================================

class IdentifyUserRequest(BaseModel):
    """Request to identify a user by fingerprint."""
    
    fingerprint_sample: str = Field(..., min_length=1, max_length=10000)


class PayRequest(BaseModel):
    """Request to process a biometric payment."""
    
    terminal_api_key: str = Field(..., min_length=1)
    fingerprint_sample: str = Field(..., min_length=1, max_length=10000)
    amount_cents: int = Field(..., gt=0, description="Amount in cents (e.g., 2000 = $20.00)")
    currency: str = Field(default="usd", pattern="^[a-z]{3}$")
    merchant_ref: Optional[str] = Field(None, max_length=255)
    payment_method_provider_ref: Optional[str] = Field(None, description="Optional Stripe payment method ID to use instead of default")


class PayResponse(BaseModel):
    """Response after payment attempt."""
    
    status: str
    transaction_id: Optional[int] = None
    message: str


# ============================================================================
# Merchant Schemas
# ============================================================================

class MerchantSignupRequest(BaseModel):
    """Request to create a new merchant account."""
    
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)


class MerchantSignupResponse(BaseModel):
    """Response after merchant account creation."""
    
    merchant_id: int
    email: str
    name: str
    terminal_api_key: str
    message: str = "Merchant account created successfully"


class MerchantLoginRequest(BaseModel):
    """Request to authenticate a merchant."""
    
    email: EmailStr
    password: str


class MerchantLoginResponse(BaseModel):
    """Response after successful authentication."""
    
    token: str
    merchant_id: int
    email: str
    name: str
    terminal_api_key: str


# ============================================================================
# Transaction Schemas
# ============================================================================

class TransactionItem(BaseModel):
    """Single transaction item."""
    
    id: int
    amount_cents: int
    protega_fee_cents: int = 0
    currency: str
    status: str
    created_at: datetime
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    merchant_ref: Optional[str] = None

    class Config:
        from_attributes = True


class TransactionsListResponse(BaseModel):
    """Response with list of transactions."""
    
    items: list[TransactionItem]
    total: int


# ============================================================================
# Payment Method Schemas
# ============================================================================

class PaymentMethodBase(BaseModel):
    """Base payment method information."""
    
    provider_payment_method_id: str
    brand: str
    last4: str
    exp_month: int
    exp_year: int
    is_default: bool = False


class PaymentMethodCreate(BaseModel):
    """Request to add a new payment method."""
    
    stripe_payment_method_token: str = Field(..., min_length=1)
    set_default: bool = False


class PaymentMethodResponse(PaymentMethodBase):
    """Response with payment method details."""
    
    id: int
    user_id: int
    provider: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PaymentMethodListResponse(BaseModel):
    """Response with list of payment methods."""
    
    items: list[PaymentMethodResponse]
    total: int


class SetDefaultPaymentMethodResponse(BaseModel):
    """Response after setting default payment method."""
    
    message: str
    payment_method_id: int


# ============================================================================
# Health Check Schema
# ============================================================================

class HealthResponse(BaseModel):
    """Health check response."""
    
    ok: bool
    version: str = "0.1.0"
    database: str = "connected"

