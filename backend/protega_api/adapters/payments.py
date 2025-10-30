"""
Payment processing adapter for Stripe.

This module handles all interactions with the Stripe payment API,
including customer management, payment method attachment, and charges.
"""

import logging
from typing import Dict, Tuple

import stripe

from protega_api.config import settings

# Initialize Stripe with API key
stripe.api_key = settings.stripe_secret_key

logger = logging.getLogger(__name__)


def create_customer(email: str, name: str) -> str:
    """
    Create a new Stripe customer.
    
    Args:
        email: Customer email address
        name: Customer full name
        
    Returns:
        Stripe customer ID
        
    Raises:
        stripe.StripeError: If customer creation fails
    """
    try:
        customer = stripe.Customer.create(
            email=email,
            name=name,
            description=f"Protega CloudPay - {name}"
        )
        logger.info(f"Created Stripe customer: {customer.id}")
        return customer.id
    except stripe.StripeError as e:
        logger.error(f"Failed to create Stripe customer: {e}")
        raise


def attach_pm_and_get(
    payment_method_token: str,
    customer_id: str
) -> Dict[str, any]:
    """
    Attach a payment method to a customer and retrieve full details.
    
    Args:
        payment_method_token: Payment method token (e.g., pm_card_visa)
        customer_id: Stripe customer ID
        
    Returns:
        Dict with payment method details (id, brand, last4, exp_month, exp_year)
        
    Raises:
        stripe.StripeError: If attachment fails
    """
    try:
        # Attach payment method to customer
        payment_method = stripe.PaymentMethod.attach(
            payment_method_token,
            customer=customer_id,
        )
        
        # Extract card details
        card = payment_method.card
        
        result = {
            "id": payment_method.id,
            "brand": card.brand if card else "unknown",
            "last4": card.last4 if card else "****",
            "exp_month": card.exp_month if card else None,
            "exp_year": card.exp_year if card else None,
        }
        
        logger.info(
            f"Attached payment method {payment_method.id} to customer {customer_id}"
        )
        
        return result
        
    except stripe.StripeError as e:
        logger.error(f"Failed to attach payment method: {e}")
        raise


def attach_payment_method_and_get_details(
    customer_id: str,
    payment_method_token: str
) -> Tuple[str, str, str, int, int]:
    """
    Attach a payment method to a customer and retrieve details.
    
    DEPRECATED: Use attach_pm_and_get() instead for more complete details.
    
    Args:
        customer_id: Stripe customer ID
        payment_method_token: Payment method token (e.g., pm_card_visa)
        
    Returns:
        Tuple of (payment_method_id, brand, last4, exp_month, exp_year)
        
    Raises:
        stripe.StripeError: If attachment fails
    """
    try:
        # Attach payment method to customer
        payment_method = stripe.PaymentMethod.attach(
            payment_method_token,
            customer=customer_id,
        )
        
        # Set as default payment method
        stripe.Customer.modify(
            customer_id,
            invoice_settings={
                "default_payment_method": payment_method.id
            }
        )
        
        # Extract card details including fingerprint
        card = payment_method.card
        brand = card.brand if card else "unknown"
        last4 = card.last4 if card else "****"
        exp_month = card.exp_month if card else 0
        exp_year = card.exp_year if card else 0
        fingerprint = card.fingerprint if card else None
        
        logger.info(
            f"Attached payment method {payment_method.id} to customer {customer_id}, fingerprint: {fingerprint}"
        )
        
        return payment_method.id, brand, last4, exp_month, exp_year, fingerprint
        
    except stripe.StripeError as e:
        logger.error(f"Failed to attach payment method: {e}")
        raise


def charge(
    amount_cents: int,
    currency: str,
    customer_id: str,
    payment_method_id: str,
    metadata: dict | None = None
) -> Tuple[str, str]:
    """
    Create and confirm a payment intent (charge).
    
    Args:
        amount_cents: Amount in cents (e.g., 2000 = $20.00)
        currency: Currency code (e.g., "usd")
        customer_id: Stripe customer ID
        payment_method_id: Stripe payment method ID
        metadata: Optional metadata to attach to payment
        
    Returns:
        Tuple of (status, payment_intent_id)
        status is "succeeded" or "failed"
        
    Raises:
        stripe.StripeError: If payment creation fails
    """
    try:
        # Create and immediately confirm payment intent
        payment_intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=currency,
            customer=customer_id,
            payment_method=payment_method_id,
            confirm=True,
            automatic_payment_methods={
                "enabled": True,
                "allow_redirects": "never"
            },
            metadata=metadata or {},
            description="Protega CloudPay - Biometric Payment"
        )
        
        status = payment_intent.status
        
        # Map Stripe status to our status
        if status == "succeeded":
            logger.info(f"Payment succeeded: {payment_intent.id}")
            return "succeeded", payment_intent.id
        else:
            logger.warning(f"Payment not succeeded: {payment_intent.id} - {status}")
            return "failed", payment_intent.id
            
    except stripe.CardError as e:
        # Card was declined
        logger.warning(f"Card declined: {e.user_message}")
        return "failed", ""
        
    except stripe.StripeError as e:
        logger.error(f"Stripe error during charge: {e}")
        return "failed", ""

