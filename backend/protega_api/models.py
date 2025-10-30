"""SQLAlchemy database models."""

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from protega_api.db import Base


class PaymentProvider(str, PyEnum):
    """Payment provider types."""
    STRIPE = "stripe"


class TransactionStatus(str, PyEnum):
    """Transaction status types."""
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class ProtegaIdentity(Base):
    """Protega identity - top-level identity container."""
    __tablename__ = "protega_identities"
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    users = relationship("User", back_populates="protega_identity")


class User(Base):
    """Customer/user who enrolls biometrics and payment methods."""
    
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)  # Made optional for SMS-only enrollment
    phone = Column(String(20), unique=True, nullable=True, index=True)  # Added for SMS verification
    full_name = Column(String(255), nullable=False)
    stripe_customer_id = Column(String(255), unique=True, index=True)
    
    # Anti-fraud fields
    protega_identity_id = Column(Integer, ForeignKey("protega_identities.id"), nullable=True, index=True)
    phone_verified = Column(Boolean, default=False, nullable=False)
    card_fingerprint = Column(String(64), nullable=True, index=True)  # Stripe card fingerprint for deduplication
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    protega_identity = relationship("ProtegaIdentity", back_populates="users")
    biometric_templates = relationship("BiometricTemplate", back_populates="user", cascade="all, delete-orphan")
    payment_methods = relationship("PaymentMethod", back_populates="user", cascade="all, delete-orphan")
    consents = relationship("Consent", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user")


class BiometricTemplate(Base):
    """
    Encrypted biometric template with Secure Enclave protection.
    
    Security Architecture:
    - template_hash: SHA-256 hash for duplicate detection (fast lookup)
    - salt: Random salt for PBKDF2 key derivation
    - salt_b64: Base64-encoded salt for AES-GCM encryption (NEW)
    - encrypted_template: AES-256-GCM encrypted template (NEW)
    
    Compliance:
    - BIPA: Informed consent required before storage
    - GDPR: Encrypted at rest, right to deletion
    - PCI-DSS: Isolated from payment data
    """
    
    __tablename__ = "biometric_templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Hash for duplicate detection (fast, no decryption needed)
    template_hash = Column(String(128), nullable=False, unique=True, index=True)  # Hex-encoded hash
    
    # Salt for PBKDF2 hashing (legacy, for verification)
    salt = Column(String(64), nullable=False)  # Hex-encoded salt
    
    # Secure Enclave: Encrypted storage (NEW)
    salt_b64 = Column(String, nullable=True)  # Base64-encoded salt for encryption
    encrypted_template = Column(String, nullable=True)  # AES-256-GCM encrypted template
    
    # Biometric similarity scoring (for fraud prevention)
    feature_vector = Column(String, nullable=True)  # JSON-encoded feature vector for similarity matching
    
    # Active status
    active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Anti-fraud fields
    device_id = Column(String(255), nullable=True, index=True)
    enroll_ip = Column(String(45), nullable=True)  # IPv6 max length
    finger_label = Column(String(50), nullable=True)  # e.g., "right_index", "left_thumb"
    liveness_score = Column(Integer, nullable=True)
    
    # Multi-finger support
    last_used_at = Column(DateTime, nullable=True, index=True)  # Last successful authentication
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="biometric_templates")

    __table_args__ = (
        Index("idx_active_templates", "user_id", "active"),
        Index("idx_device_enrolls", "device_id", "created_at"),
    )


class Consent(Base):
    """User consent records for biometric data processing."""
    
    __tablename__ = "consents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    consent_text = Column(Text, nullable=False)
    accepted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="consents")


class Merchant(Base):
    """Merchant/business account."""
    
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    terminals = relationship("Terminal", back_populates="merchant")
    transactions = relationship("Transaction", back_populates="merchant")


class Terminal(Base):
    """Payment terminal (POS device or kiosk)."""
    
    __tablename__ = "terminals"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    label = Column(String(255), nullable=False)
    api_key = Column(String(64), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    merchant = relationship("Merchant", back_populates="terminals")


class PaymentMethod(Base):
    """Stored payment method (e.g., credit card via Stripe)."""
    
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(Enum(PaymentProvider), nullable=False, default=PaymentProvider.STRIPE)
    provider_payment_method_id = Column(String(255), nullable=False, unique=True, index=True)
    brand = Column(String(50))  # e.g., "visa", "mastercard"
    last4 = Column(String(4))
    exp_month = Column(Integer)
    exp_year = Column(Integer)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="payment_methods")

    __table_args__ = (
        Index("idx_default_payment_method", "user_id", "is_default"),
    )


class Transaction(Base):
    """Payment transaction record."""
    
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount_cents = Column(Integer, nullable=False)  # Base transaction amount (merchant's amount)
    protega_fee_cents = Column(Integer, default=0, nullable=False)  # Protega's revenue: 0.25% + $0.30
    currency = Column(String(3), nullable=False, default="usd")
    status = Column(Enum(TransactionStatus), nullable=False, index=True)
    processor_txn_id = Column(String(255), index=True)  # Stripe payment intent ID
    merchant_ref = Column(String(255))  # Optional merchant reference
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    merchant = relationship("Merchant", back_populates="transactions")
    user = relationship("User", back_populates="transactions")

    __table_args__ = (
        Index("idx_merchant_transactions", "merchant_id", "created_at"),
    )


class FlaggedEnroll(Base):
    """Flagged enrollment attempts for manual review."""
    __tablename__ = "flagged_enrolls"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(20), nullable=True, index=True)
    card_fingerprint = Column(String(64), nullable=True, index=True)
    fingerprint_hash = Column(String(128), nullable=True)
    device_id = Column(String(255), nullable=True)
    enroll_ip = Column(String(45), nullable=True)
    risk_score = Column(Integer, default=0, nullable=False, index=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved = Column(Boolean, default=False, nullable=False, index=True)
    resolved_by = Column(String(255), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    __table_args__ = (
        Index("idx_unresolved_flags", "resolved", "created_at"),
        Index("idx_risk_score", "risk_score", "created_at"),
    )


class FraudAlert(Base):
    """
    Fraud alerts for duplicate fingerprint patterns detected in background scans.
    
    Generated by the background fraud scanner when fingerprint similarity
    is detected between different user accounts.
    """
    __tablename__ = "fraud_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    template_id = Column(Integer, ForeignKey("biometric_templates.id"), nullable=True)
    
    # Match information
    match_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    match_template_id = Column(Integer, ForeignKey("biometric_templates.id"), nullable=True)
    match_score = Column(Float, nullable=False)  # Similarity score (0-1)
    
    # Status tracking
    status = Column(
        String(50), 
        default="pending_review", 
        nullable=False, 
        index=True
    )  # pending_review / verified_false / confirmed_duplicate / dismissed
    
    # Metadata
    notes = Column(Text, nullable=True)  # Admin notes
    reviewed_by = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    __table_args__ = (
        Index("idx_pending_alerts", "status", "created_at"),
        Index("idx_user_alerts", "user_id", "created_at"),
    )
