"""
Payment routes for handling Razorpay and Stripe payments.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dependencies import get_db, get_current_user
from services.razorpay_service import RazorpayService
from services.stripe_service import StripeService
import json

router = APIRouter(prefix="/payments", tags=["payments"])

# Initialize services (will gracefully handle missing credentials)
try:
    razorpay_service = RazorpayService()
    stripe_service = StripeService()
except Exception as e:
    print(f"Warning: Failed to initialize payment services: {e}")
    razorpay_service = None
    stripe_service = None


# ===========================
# RAZORPAY ENDPOINTS
# ===========================

@router.post("/razorpay/order")
def create_razorpay_order(
    payment_data: dict,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    """
    Create a Razorpay order for subscription payment.
    """
    tier = payment_data.get("tier")
    if not tier or tier not in ["free", "pro", "team"]:
        raise HTTPException(status_code=400, detail="Invalid tier")

    # Check if free tier (no payment needed)
    if tier == "free":
        from services.subscription import upgrade_subscription
        upgrade_subscription(db, user_id, "free")
        return {
            "message": "Free plan activated",
            "order_id": None,
            "type": "free"
        }

    try:
        # Get user email
        from models import User
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        order = razorpay_service.create_order(tier, user.email)
        return order

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


@router.post("/razorpay/verify")
def verify_razorpay_payment(
    payment_data: dict,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    """
    Verify Razorpay payment signature and update subscription.
    """
    order_id = payment_data.get("order_id")
    payment_id = payment_data.get("payment_id")
    signature = payment_data.get("signature")
    tier = payment_data.get("tier")

    if not all([order_id, payment_id, signature, tier]):
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Verify signature
    is_valid = razorpay_service.verify_payment_signature(order_id, payment_id, signature)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    try:
        # Handle successful payment
        payment = razorpay_service.handle_payment_success(
            db, user_id, order_id, payment_id, tier
        )

        return {
            "message": "Payment verified and subscription updated",
            "payment_id": payment.id,
            "tier": tier,
            "amount": payment.amount
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")


@router.post("/razorpay/webhook")
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle Razorpay webhooks.
    """
    try:
        payload = await request.body()
        signature = request.headers.get("X-Razorpay-Signature")

        if not signature:
            raise HTTPException(status_code=400, detail="Missing signature")

        # Verify webhook signature
        is_valid = razorpay_service.verify_webhook_signature(payload.decode(), signature)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

        # Parse event
        event = json.loads(payload)
        event_type = event.get("event")

        if event_type == "payment.authorized":
            data = event.get("payload", {}).get("payment", {}).get("entity", {})
            if data:
                print(f"Razorpay payment authorized: {data.get('id')}")

        elif event_type == "payment.failed":
            data = event.get("payload", {}).get("payment", {}).get("entity", {})
            if data:
                print(f"Razorpay payment failed: {data.get('id')}")

        return {"status": "received"}

    except Exception as e:
        print(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


# ===========================
# STRIPE ENDPOINTS
# ===========================

@router.post("/stripe/create-session")
def create_stripe_session(
    payment_data: dict,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    """
    Create a Stripe checkout session for subscription.
    """
    tier = payment_data.get("tier")
    if not tier or tier not in ["free", "pro", "team"]:
        raise HTTPException(status_code=400, detail="Invalid tier")

    # Check if free tier
    if tier == "free":
        from services.subscription import upgrade_subscription
        upgrade_subscription(db, user_id, "free")
        return {
            "message": "Free plan activated",
            "session_id": None,
            "type": "free"
        }

    try:
        from models import User
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # In production, get these URLs from environment
        success_url = "https://yourdomain.com/billing?success=true"
        cancel_url = "https://yourdomain.com/checkout?cancel=true"

        session = stripe_service.create_checkout_session(
            user_id, user.email, tier, success_url, cancel_url
        )

        return session

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")


@router.post("/stripe/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle Stripe webhooks.
    """
    try:
        payload = await request.body()
        signature = request.headers.get("stripe-signature")

        if not signature:
            raise HTTPException(status_code=400, detail="Missing signature")

        # Verify webhook
        is_valid = stripe_service.verify_webhook_signature(payload, signature)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

        # Parse event
        import stripe
        event = json.loads(payload)
        event_type = event.get("type")

        if event_type == "checkout.session.completed":
            session = event["data"]["object"]
            print(f"Stripe checkout session completed: {session['id']}")

        elif event_type == "customer.subscription.created":
            stripe_service.handle_subscription_created(db, event["data"])

        elif event_type == "invoice.payment_succeeded":
            stripe_service.handle_invoice_payment_succeeded(db, event["data"])

        return {"status": "received"}

    except Exception as e:
        print(f"Webhook error: {str(e)}")
        # Still return 200 to Stripe to avoid retries
        return {"status": "received"}
