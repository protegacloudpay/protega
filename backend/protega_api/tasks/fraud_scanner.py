"""
Background Fraud Detection Scanner for Protega CloudPay
======================================================

Continuously scans fingerprint enrollments for near-duplicate patterns,
even after successful registration. Provides bank-grade fraud prevention.
"""

import asyncio
import json
import logging
import numpy as np
from datetime import datetime
from typing import List

from sqlalchemy.orm import Session

from protega_api.db import SessionLocal
from protega_api.models import BiometricTemplate, FraudAlert, User
from protega_api.sdk.fingerprint_matcher import get_fingerprint_matcher

logger = logging.getLogger(__name__)

# Configuration
SCAN_INTERVAL_SECONDS = 3600  # Scan every hour
SIMILARITY_THRESHOLD = 0.90   # High confidence threshold
AUTO_SUSPEND_THRESHOLD = 0.95  # Auto-suspend threshold (very high confidence)


async def scan_new_enrollments():
    """
    Scan all fingerprint enrollments for near-duplicate patterns.
    
    This runs asynchronously to avoid blocking API requests.
    """
    db: Session = None
    try:
        db = SessionLocal()
        matcher = get_fingerprint_matcher()
        
        logger.info("Starting background fraud scan")
        
        # Get all active fingerprints
        fingerprints = db.query(BiometricTemplate).filter(
            BiometricTemplate.active == True,
            BiometricTemplate.feature_vector != None
        ).all()
        
        if len(fingerprints) < 2:
            logger.info("Not enough fingerprints to perform similarity scan")
            return
        
        logger.info(f"Scanning {len(fingerprints)} fingerprints for duplicate patterns")
        
        # Convert feature vectors to numpy arrays
        vectors_data = []
        for f in fingerprints:
            try:
                if f.feature_vector:
                    vector = np.array(json.loads(f.feature_vector), dtype=np.float32)
                    vectors_data.append((f.id, f.user_id, vector))
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(f"Failed to parse feature vector for template {f.id}: {e}")
                continue
        
        logger.info(f"Successfully loaded {len(vectors_data)} feature vectors")
        
        # Check each fingerprint against all others
        duplicate_count = 0
        for i, (template_id1, user_id1, vector1) in enumerate(vectors_data):
            for j, (template_id2, user_id2, vector2) in enumerate(vectors_data):
                if i >= j:  # Skip duplicate comparisons and self-comparison
                    continue
                
                # Only check different users (same user can have multiple fingers)
                if user_id1 == user_id2:
                    continue
                
                # Compare vectors
                try:
                    similarity = matcher.compare_cosine(vector1, vector2)
                    
                    if similarity >= SIMILARITY_THRESHOLD:
                        duplicate_count += 1
                        logger.warning(
                            f"Duplicate pattern detected: "
                            f"Template {template_id1} (User {user_id1}) vs "
                            f"Template {template_id2} (User {user_id2}), "
                            f"Similarity: {similarity:.3f}"
                        )
                        
                        # Check if alert already exists
                        existing_alert = db.query(FraudAlert).filter(
                            FraudAlert.user_id == user_id2,
                            FraudAlert.match_score >= similarity - 0.01,
                            FraudAlert.match_score <= similarity + 0.01,
                            FraudAlert.status == "pending_review"
                        ).first()
                        
                        if not existing_alert:
                            # Create fraud alert for the second user (potential duplicate)
                            alert = FraudAlert(
                                user_id=user_id2,
                                template_id=template_id2,
                                match_user_id=user_id1,
                                match_template_id=template_id1,
                                match_score=similarity,
                                status="pending_review",
                                created_at=datetime.utcnow()
                            )
                            db.add(alert)
                            
                            # Auto-suspend if similarity is very high
                            if similarity >= AUTO_SUSPEND_THRESHOLD:
                                logger.error(
                                    f"Auto-suspending user {user_id2} due to high similarity "
                                    f"({similarity:.3f}) with user {user_id1}"
                                )
                                user = db.query(User).filter(User.id == user_id2).first()
                                if user:
                                    # Note: We need to add a status field to User model
                                    # For now, we'll just log it
                                    logger.warning(f"Would suspend user {user_id2} (status field not yet implemented)")
                        
                        # Also create alert for the first user if needed
                        existing_alert2 = db.query(FraudAlert).filter(
                            FraudAlert.user_id == user_id1,
                            FraudAlert.match_score >= similarity - 0.01,
                            FraudAlert.match_score <= similarity + 0.01,
                            FraudAlert.status == "pending_review"
                        ).first()
                        
                        if not existing_alert2:
                            alert2 = FraudAlert(
                                user_id=user_id1,
                                template_id=template_id1,
                                match_user_id=user_id2,
                                match_template_id=template_id2,
                                match_score=similarity,
                                status="pending_review",
                                created_at=datetime.utcnow()
                            )
                            db.add(alert2)
                        
                        db.commit()
                        
                except Exception as e:
                    logger.error(f"Error comparing vectors: {e}")
                    continue
        
        if duplicate_count > 0:
            logger.warning(f"Fraud scan completed: {duplicate_count} duplicate patterns detected")
        else:
            logger.info("Fraud scan completed: No duplicates found")
            
    except Exception as e:
        logger.error(f"Fraud scan failed: {e}", exc_info=True)
        if db:
            db.rollback()
    finally:
        if db:
            db.close()


async def start_background_scanner():
    """
    Main background worker loop.
    
    Runs continuous fraud detection scans at regular intervals.
    """
    logger.info("Starting background fraud scanner worker")
    
    while True:
        try:
            await scan_new_enrollments()
            logger.info(f"Waiting {SCAN_INTERVAL_SECONDS} seconds until next scan")
            await asyncio.sleep(SCAN_INTERVAL_SECONDS)
        except Exception as e:
            logger.error(f"Background scanner error: {e}", exc_info=True)
            # Wait a bit before retrying on error
            await asyncio.sleep(60)


if __name__ == "__main__":
    # Run the scanner
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    asyncio.run(start_background_scanner())

