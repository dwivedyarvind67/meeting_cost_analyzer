"""
Subscription service for managing user subscriptions and feature access.
"""

from sqlalchemy.orm import Session
from models import User, Subscription, SubscriptionTier, SubscriptionStatus, Meeting
from datetime import datetime, timedelta
from config import settings


def get_or_create_subscription(db: Session, user_id: int):
    """
    Get existing subscription or create a new Free subscription for user.
    """
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()

    if not subscription:
        subscription = Subscription(
            user_id=user_id,
            tier=SubscriptionTier.FREE,
            status=SubscriptionStatus.ACTIVE
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)

    return subscription


def get_user_plan(db: Session, user_id: int) -> str:
    """
    Get the current plan tier for a user.
    Returns: 'free', 'pro', or 'team'
    """
    subscription = get_or_create_subscription(db, user_id)
    return subscription.tier.value


def get_feature_limits(plan: str) -> dict:
    """
    Get feature limits and capabilities for a given plan.
    """
    return settings.PRICING.get(plan, settings.PRICING["free"])


def get_user_stats(db: Session, user_id: int) -> dict:
    """
    Calculate user statistics including usage.
    """
    subscription = get_or_create_subscription(db, user_id)
    plan = subscription.tier.value
    plan_info = get_feature_limits(plan)

    # Get meetings this month
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    meetings_this_month = db.query(Meeting).filter(
        Meeting.user_id == user_id,
        Meeting.created_at >= month_start
    ).count()

    # Get total cost this month
    total_cost_month = db.query(Meeting).filter(
        Meeting.user_id == user_id,
        Meeting.created_at >= month_start
    ).with_entities(
        db.func.sum(Meeting.total_cost)
    ).scalar() or 0

    # Calculate usage percentage
    monthly_limit = plan_info["meetings_per_month"]
    usage_percentage = (meetings_this_month / monthly_limit * 100) if monthly_limit != float('inf') else 0

    # Get total meetings and cost (all time)
    total_meetings = db.query(Meeting).filter(
        Meeting.user_id == user_id
    ).count()

    total_cost = db.query(Meeting).filter(
        Meeting.user_id == user_id
    ).with_entities(
        db.func.sum(Meeting.total_cost)
    ).scalar() or 0

    return {
        "total_meetings": total_meetings,
        "total_cost": float(total_cost),
        "meetings_this_month": meetings_this_month,
        "current_plan": plan,
        "plan_limit": monthly_limit,
        "usage_percentage": min(usage_percentage, 100)
    }


def can_create_meeting(db: Session, user_id: int) -> tuple[bool, str]:
    """
    Check if user can create a new meeting based on their plan.
    Returns: (is_allowed, reason)
    """
    subscription = get_or_create_subscription(db, user_id)

    # Check subscription status
    if subscription.status != SubscriptionStatus.ACTIVE:
        return False, f"Subscription is {subscription.status.value}"

    # Check plan limits
    plan = subscription.tier.value
    plan_info = get_feature_limits(plan)

    monthly_limit = plan_info["meetings_per_month"]
    if monthly_limit == float('inf'):
        return True, "Unlimited meetings"

    # Get meetings this month
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    meetings_this_month = db.query(Meeting).filter(
        Meeting.user_id == user_id,
        Meeting.created_at >= month_start
    ).count()

    if meetings_this_month >= monthly_limit:
        return False, f"Monthly limit ({int(monthly_limit)} meetings) reached"

    return True, "Meeting creation allowed"


def can_access_feature(db: Session, user_id: int, feature: str) -> bool:
    """
    Check if user can access a specific feature.
    Features: export_pdf, calendar_sync, team_invites
    """
    subscription = get_or_create_subscription(db, user_id)

    # Check subscription status
    if subscription.status != SubscriptionStatus.ACTIVE:
        return False

    plan = subscription.tier.value
    plan_info = get_feature_limits(plan)

    return plan_info["features"].get(feature, False)


def upgrade_subscription(db: Session, user_id: int, new_tier: str) -> Subscription:
    """
    Upgrade user subscription to a new tier.
    """
    subscription = get_or_create_subscription(db, user_id)

    # Update tier and status
    subscription.tier = SubscriptionTier[new_tier.upper()]
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.end_date = None  # Remove end date for active subscriptions
    subscription.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(subscription)

    return subscription


def cancel_subscription(db: Session, user_id: int) -> Subscription:
    """
    Cancel user subscription.
    """
    subscription = get_or_create_subscription(db, user_id)

    subscription.status = SubscriptionStatus.CANCELLED
    subscription.end_date = datetime.utcnow()
    subscription.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(subscription)

    return subscription


def pause_subscription(db: Session, user_id: int) -> Subscription:
    """
    Pause user subscription (keeps data but blocks access).
    """
    subscription = get_or_create_subscription(db, user_id)

    subscription.status = SubscriptionStatus.PAUSED
    subscription.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(subscription)

    return subscription
