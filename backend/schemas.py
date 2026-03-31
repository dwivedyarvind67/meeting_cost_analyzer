"""
Pydantic schemas for request and response validation.
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum


# =====================
# USER SCHEMAS
# =====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# TOKEN SCHEMAS
# =====================

class TokenRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# =====================
# MEETING SCHEMAS
# =====================

class MeetingCreate(BaseModel):
    duration: float
    participants: int
    avg_rate: float
    source: Optional[str] = "manual"


class MeetingResponse(BaseModel):
    id: int
    duration: float
    participants: int
    avg_rate: float
    total_cost: float
    user_id: int
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# SUBSCRIPTION SCHEMAS
# =====================

class SubscriptionTierEnum(str, Enum):
    FREE = "free"
    PRO = "pro"
    TEAM = "team"


class SubscriptionCreate(BaseModel):
    tier: SubscriptionTierEnum
    auto_renew: bool = True


class SubscriptionUpdate(BaseModel):
    tier: Optional[SubscriptionTierEnum] = None
    auto_renew: Optional[bool] = None


class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    tier: str
    status: str
    start_date: datetime
    end_date: Optional[datetime]
    auto_renew: bool
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# PAYMENT SCHEMAS
# =====================

class PaymentProviderEnum(str, Enum):
    RAZORPAY = "razorpay"
    STRIPE = "stripe"


class PaymentCreate(BaseModel):
    tier: SubscriptionTierEnum
    provider: PaymentProviderEnum


class RazorpayOrderRequest(BaseModel):
    tier: SubscriptionTierEnum


class RazorpayOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str = "INR"
    key_id: str


class RazorpayPaymentVerify(BaseModel):
    order_id: str
    payment_id: str
    signature: str


class StripeSessionRequest(BaseModel):
    tier: SubscriptionTierEnum


class StripeSessionResponse(BaseModel):
    session_id: str
    client_secret: str


class PaymentResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    currency: str
    provider: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# PLAN & PRICING SCHEMAS
# =====================

class PlanFeatures(BaseModel):
    export_pdf: bool
    calendar_sync: bool
    team_invites: bool


class PlanTier(BaseModel):
    name: str
    price: float  # In INR
    meetings_per_month: float
    features: PlanFeatures


class PricingResponse(BaseModel):
    free: PlanTier
    pro: PlanTier
    team: PlanTier


class UserStatsResponse(BaseModel):
    total_meetings: int
    total_cost: float
    meetings_this_month: int
    current_plan: str
    plan_limit: float
    usage_percentage: float


# =====================
# GOOGLE SCHEMAS
# =====================

class GoogleLoginRequest(BaseModel):
    token: str


class GoogleCalendarRequest(BaseModel):
    access_token: str


class GoogleCalendarEventResponse(BaseModel):
    title: str
    duration: float
    cost: float


# =====================
# ERROR SCHEMAS
# =====================

class ErrorResponse(BaseModel):
    detail: str
    status_code: int


class ValidationErrorResponse(BaseModel):
    detail: List[dict]
    status_code: int = 422
