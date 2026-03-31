"""
Dependency functions for FastAPI route protection and permission checking.
"""

from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from auth import decode_token
from services.subscription import can_create_meeting, can_access_feature, get_or_create_subscription


def get_db():
    """Database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(authorization: str = Header(None)) -> int:
    """
    Verify JWT token and return user_id.
    Extract user_id from Bearer token in Authorization header.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )

    try:
        # Extract token from "Bearer <token>"
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer":
            raise ValueError("Invalid scheme")

        user_id = decode_token(token)
        return user_id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )


def require_active_subscription(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Dependency to ensure user has an active subscription.
    """
    subscription = get_or_create_subscription(db, user_id)

    if subscription.status.value != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Subscription is {subscription.status.value}"
        )

    return subscription


def require_meeting_limit(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Dependency to check if user can create a new meeting.
    """
    can_create, reason = can_create_meeting(db, user_id)

    if not can_create:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Cannot create meeting: {reason}. Upgrade your plan to continue."
        )

    return True


def require_feature(feature: str):
    """
    Factory function to create a dependency that checks if user can access a feature.
    Usage: @app.get("/export", dependencies=[Depends(require_feature("export_pdf"))])
    """
    async def _require_feature(
        user_id: int = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if not can_access_feature(db, user_id, feature):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{feature}' is not available in your plan. Upgrade to access it."
            )
        return True

    return _require_feature
