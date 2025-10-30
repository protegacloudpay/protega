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
    phone: str = Field(..., min_length=10, max_length=20)
    fingerprint_sample: str = Field(..., min_length=1, max_length=10000)
    finger_label: str = Field(
        ..., 
        min_length=5, 
        max_length=50,
        description="Which finger is being registered (e.g., 'right_index', 'left_thumb')"
    )
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


class AutoMerchantRequest(BaseModel):
    """Request to auto-create a merchant (just device ID)."""
    
    device_id: str = Field(..., min_length=1, description="Unique device/terminal identifier")


class AutoMerchantResponse(BaseModel):
    """Response after auto-creating merchant."""
    
    merchant_id: int
    terminal_api_key: str
    device_id: str
    message: str = "Merchant created automatically"


class SMSVerifyRequest(BaseModel):
    """Request to verify SMS code."""
    
    phone: str = Field(..., min_length=10, description="Phone number with country code (e.g., +1234567890)")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")


class FingerprintOnlyEnrollRequest(BaseModel):
    """Simplified enrollment: fingerprint + phone number only."""
    
    fingerprint_sample: str = Field(..., min_length=1, max_length=10000)
    phone: str = Field(..., min_length=10)
    full_name: str = Field(..., min_length=1)


class AutoSettlementRequest(BaseModel):
    """Automatic settlement configuration."""
    
    merchant_id: int
    connect_account_id: str = Field(..., description="Stripe Connect account ID")
    auto_transfer: bool = True


class RealTimeTransactionEvent(BaseModel):
    """Real-time transaction event for WebSocket."""
    
    event_type: str = Field(..., description="Type: 'transaction_created', 'fee_distributed', etc.")
    transaction_id: int
    amount_cents: int
    merchant_id: int
    timestamp: datetime


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
# Customers Schemas
# ============================================================================

class CustomerListItem(BaseModel):
    """Non-sensitive customer information for merchant viewing."""
    
    customer_id: int
    masked_name: str
    masked_email: Optional[str] = None
    transaction_count: int
    total_spent_cents: int
    first_seen: datetime
    last_seen: datetime


class CustomerListResponse(BaseModel):
    """Response for listing customers."""
    
    items: list[CustomerListItem]
    total: int


# ============================================================================
# Health Check Schema
# ============================================================================

class HealthResponse(BaseModel):
    """Health check response."""
    
    status: str = "ok"
    service: str = "Protega CloudPay API"
    ok: bool = True
    version: str = "2.0"
    database: str = "connected"

