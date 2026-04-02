from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, Enum as SQLEnum
from database import Base
from datetime import datetime
import enum


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    duration = Column(Float)
    participants = Column(Integer)
    avg_rate = Column(Float)
    total_cost = Column(Float)
    user_id = Column(Integer)
    source = Column(String, default="manual")  # manual or calendar
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ScheduledMeeting(Base):
    __tablename__ = "scheduled_meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    scheduled_time = Column(DateTime)
    duration = Column(Float)
    participants = Column(Integer)
    avg_rate = Column(Float)
    total_projected_cost = Column(Float)
    user_id = Column(Integer, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SubscriptionTier(str, enum.Enum):
    """Subscription tier types."""
    FREE = "free"
    PRO = "pro"
    TEAM = "team"


class SubscriptionStatus(str, enum.Enum):
    """Subscription status types."""
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class Subscription(Base):
    """User subscription record."""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True)
    tier = Column(SQLEnum(SubscriptionTier), default=SubscriptionTier.FREE)
    status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)  # NULL for non-expiring plans
    auto_renew = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PaymentProvider(str, enum.Enum):
    """Payment provider types."""
    RAZORPAY = "razorpay"
    STRIPE = "stripe"


class PaymentStatus(str, enum.Enum):
    """Payment status types."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(Base):
    """Payment transaction record."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    subscription_id = Column(Integer, index=True)
    amount = Column(Float)  # Amount in paise/cents
    currency = Column(String, default="INR")
    provider = Column(SQLEnum(PaymentProvider))
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    provider_transaction_id = Column(String, unique=True, index=True)  # Razorpay/Stripe ID
    provider_order_id = Column(String, nullable=True)  # Razorpay order ID
    description = Column(String, nullable=True)
    extra_data = Column(String, nullable=True)  # JSON string for extra data
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PaymentMethod(Base):
    """Stored payment methods for recurring payments."""
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    provider = Column(SQLEnum(PaymentProvider))
    provider_id = Column(String, unique=True, index=True)  # Razorpay customer ID / Stripe customer ID
    last_4_digits = Column(String, nullable=True)
    card_type = Column(String, nullable=True)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
