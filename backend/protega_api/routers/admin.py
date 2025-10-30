"""Admin endpoints for reviewing flagged enrollments."""

import logging
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from protega_api.db import get_db
from protega_api.models import FlaggedEnroll, User, BiometricTemplate, ProtegaIdentity, FraudAlert

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


def is_admin(request=None):
    """Check if request is from admin (implement real auth in production)."""
    # TODO: Implement real admin authentication
    return True


@router.get("/flagged")
def list_flagged(db: Annotated[Session, Depends(get_db)]):
    """
    List all unresolved flagged enrollments.
    
    Returns:
        List of flagged enrollment records
    """
    rows = db.query(FlaggedEnroll).filter(
        FlaggedEnroll.resolved == False
    ).order_by(FlaggedEnroll.created_at.desc()).all()
    
    return [
        {
            "id": r.id,
            "email": r.email,
            "phone": r.phone,
            "risk_score": r.risk_score,
            "reason": r.reason,
            "card_fingerprint": r.card_fingerprint,
            "device_id": r.device_id,
            "enroll_ip": r.enroll_ip,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.post("/flagged/{flag_id}/resolve")
async def resolve_flag(
    flag_id: int,
    action: dict,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Resolve a flagged enrollment.
    
    Actions:
        - approve: Create user from flagged enrollment
        - deny: Mark as denied
        - merge: Attach to existing Protega identity
        
    Args:
        flag_id: Flagged enrollment ID
        action: Dict with 'type' and optional params
        
    Returns:
        Resolution status
    """
    f = db.query(FlaggedEnroll).get(flag_id)
    if not f:
        raise HTTPException(status_code=404, detail="Flag not found")
    
    if f.resolved:
        raise HTTPException(status_code=400, detail="Flag already resolved")
    
    typ = action.get("type")
    
    try:
        if typ == "approve":
            # Create Protega Identity
            p = ProtegaIdentity()
            db.add(p)
            db.flush()
            
            # Create User
            user = User(
                email=f.email,
                full_name="Approved User",  # Could be enhanced
                stripe_customer_id=None,
                protega_identity_id=p.id,
                phone=f.phone,
                phone_verified=False,
                card_fingerprint=f.card_fingerprint
            )
            db.add(user)
            db.flush()
            
            # Create Biometric Template
            if f.fingerprint_hash:
                template = BiometricTemplate(
                    user_id=user.id,
                    template_hash=f.fingerprint_hash,
                    salt="",  # Should be stored with flagged enrollment
                    active=True,
                    device_id=f.device_id,
                    enroll_ip=f.enroll_ip
                )
                db.add(template)
            
            # Mark as resolved
            f.resolved = True
            f.resolved_by = "admin"
            f.resolved_at = datetime.utcnow()
            
            db.commit()
            
            logger.info(f"Flag {flag_id} approved, created user {user.id}")
            
            return {
                "status": "approved",
                "user_id": user.id,
                "protega_id": p.id,
            }
            
        elif typ == "deny":
            f.resolved = True
            f.resolved_by = "admin"
            f.resolved_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Flag {flag_id} denied")
            
            return {"status": "denied"}
            
        elif typ == "merge":
            target = action.get("target_protega_id")
            if not target:
                raise HTTPException(status_code=400, detail="target_protega_id required")
            
            # Verify target identity exists
            target_identity = db.query(ProtegaIdentity).get(target)
            if not target_identity:
                raise HTTPException(status_code=404, detail="Target Protega identity not found")
            
            # Create user under existing identity
            user = User(
                email=f.email,
                full_name="Merged User",
                stripe_customer_id=None,
                protega_identity_id=target,
                phone=f.phone,
                phone_verified=False,
                card_fingerprint=f.card_fingerprint
            )
            db.add(user)
            db.flush()
            
            # Create Biometric Template
            if f.fingerprint_hash:
                template = BiometricTemplate(
                    user_id=user.id,
                    template_hash=f.fingerprint_hash,
                    salt="",
                    active=True,
                    device_id=f.device_id,
                    enroll_ip=f.enroll_ip
                )
                db.add(template)
            
            f.resolved = True
            f.resolved_by = "admin"
            f.resolved_at = datetime.utcnow()
            
            db.commit()
            
            logger.info(f"Flag {flag_id} merged to Protega identity {target}")
            
            return {
                "status": "merged",
                "user_id": user.id,
                "protega_id": target,
            }
            
        else:
            raise HTTPException(status_code=400, detail="Unknown action type")
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to resolve flag {flag_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/fraud-alerts")
def list_fraud_alerts(
    status: str = "pending_review",
    db: Annotated[Session, Depends(get_db)] = None
):
    """
    List all fraud alerts detected by background scanner.
    
    Args:
        status: Filter by alert status (pending_review, verified_false, confirmed_duplicate, dismissed)
        
    Returns:
        List of fraud alert records
    """
    alerts = db.query(FraudAlert).filter(
        FraudAlert.status == status
    ).order_by(FraudAlert.created_at.desc()).all()
    
    return [
        {
            "id": alert.id,
            "user_id": alert.user_id,
            "template_id": alert.template_id,
            "match_user_id": alert.match_user_id,
            "match_template_id": alert.match_template_id,
            "match_score": alert.match_score,
            "status": alert.status,
            "notes": alert.notes,
            "reviewed_by": alert.reviewed_by,
            "reviewed_at": alert.reviewed_at.isoformat() if alert.reviewed_at else None,
            "created_at": alert.created_at.isoformat(),
        }
        for alert in alerts
    ]


@router.post("/fraud-alerts/{alert_id}/review")
def review_fraud_alert(
    alert_id: int,
    action: str,  # confirmed, dismissed, verified_false
    notes: str = None,
    db: Annotated[Session, Depends(get_db)] = None
):
    """
    Review and resolve a fraud alert.
    
    Args:
        alert_id: ID of the fraud alert
        action: Resolution action (confirmed, dismissed, verified_false)
        notes: Optional notes from admin
    """
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Fraud alert not found")
    
    if action == "confirmed":
        alert.status = "confirmed_duplicate"
    elif action == "dismissed":
        alert.status = "dismissed"
    elif action == "verified_false":
        alert.status = "verified_false"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    alert.notes = notes
    alert.reviewed_by = "admin"  # TODO: Get actual admin user
    alert.reviewed_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "status": "success",
        "alert_id": alert.id,
        "new_status": alert.status
    }
