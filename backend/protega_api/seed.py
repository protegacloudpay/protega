"""Database seeding script for testing."""

import logging

from protega_api.db import SessionLocal
from protega_api.models import Merchant, Terminal
from protega_api.routers.merchant import generate_api_key
from protega_api.security import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_test_merchant():
    """Create a test merchant account with terminal."""
    db = SessionLocal()
    
    try:
        # Check if test merchant already exists
        existing = db.query(Merchant).filter(Merchant.email == "test@merchant.com").first()
        if existing:
            logger.info("Test merchant already exists")
            terminal = db.query(Terminal).filter(Terminal.merchant_id == existing.id).first()
            if terminal:
                logger.info(f"Terminal API Key: {terminal.api_key}")
            return
        
        # Create test merchant
        merchant = Merchant(
            email="test@merchant.com",
            name="Test Merchant",
            password_hash=hash_password("test1234")
        )
        db.add(merchant)
        db.flush()
        
        # Create terminal
        api_key = generate_api_key()
        terminal = Terminal(
            merchant_id=merchant.id,
            label="Test Terminal",
            api_key=api_key
        )
        db.add(terminal)
        
        db.commit()
        
        logger.info("✅ Test merchant created successfully!")
        logger.info(f"Email: test@merchant.com")
        logger.info(f"Password: test1234")
        logger.info(f"Terminal API Key: {api_key}")
        logger.info("\n🔑 Save this API key for testing payments!")
        
    except Exception as e:
        logger.error(f"Failed to seed database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_test_merchant()

