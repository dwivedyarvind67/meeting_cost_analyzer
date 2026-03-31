"""
Razorpay payment service for handling payments in India.
Integrates with Razorpay API for payment processing and verification.
"""

import hmac
import hashlib
try:
    import razorpay
except ImportError:
    razorpay = None

from config import settings
from sqlalchemy.orm import Session
from models import Payment, PaymentStatus, PaymentProvider, PaymentMethod
from datetime import datetime


class RazorpayService:
    """Service for handling Razorpay payments."""

    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.client = None

        # Only initialize client if credentials are available
        if self.key_id and self.key_secret:
            try:
                self.client = razorpay.Client(
                    auth=(self.key_id, self.key_secret)
                )
            except Exception as e:
                print(f"Warning: Failed to initialize Razorpay client: {e}")
                self.client = None

    def get_pricing(self, tier: str) -> dict:
        """Get amount and description for a subscription tier."""
        pricing = settings.PRICING.get(tier)
        if not pricing:
            raise ValueError(f"Invalid tier: {tier}")

        amount = pricing["price"]
        # Convert INR to paise (multiply by 100)
        if amount > 0:
            amount_paise = int(amount * 100)
        else:
            amount_paise = 0  # Free tier

        return {
            "amount": amount_paise,
            "currency": "INR",
            "description": f"{pricing['name']} plan - ₹{amount}/month"
        }

    def create_order(self, tier: str, user_email: str) -> dict:
        """
        Create a Razorpay order for subscription.

        Args:
            tier: Subscription tier (free, pro, team)
            user_email: User email address

        Returns:
            Order details for frontend
        """
        pricing = self.get_pricing(tier)

        if pricing["amount"] == 0:
            # Free tier doesn't need payment
            return {
                "order_id": None,
                "amount": 0,
                "currency": "INR",
                "key_id": self.key_id,
                "tier": tier
            }

        try:
            order = self.client.order.create({
                "amount": pricing["amount"],
                "currency": pricing["currency"],
                "receipt": f"tier_{tier}_{user_email}",
                "notes": {
                    "tier": tier,
                    "email": user_email
                }
            })

            return {
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "key_id": self.key_id,
                "tier": tier
            }

        except Exception as e:
            raise ValueError(f"Failed to create Razorpay order: {str(e)}")

    def verify_payment_signature(
        self,
        order_id: str,
        payment_id: str,
        signature: str
    ) -> bool:
        """
        Verify Razorpay payment signature for webhook security.

        Args:
            order_id: Razorpay order ID
            payment_id: Razorpay payment ID
            signature: Razorpay signature from client

        Returns:
            True if signature is valid, False otherwise
        """
        try:
            self.client.utility.verify_payment_signature({
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": signature
            })
            return True
        except razorpay.errors.SignatureVerificationError:
            return False
        except Exception as e:
            print(f"Signature verification error: {str(e)}")
            return False

    def verify_webhook_signature(self, payload: str, signature: str) -> bool:
        """
        Verify Razorpay webhook signature.

        Args:
            payload: Raw request body from webhook
            signature: Signature in X-Razorpay-Signature header

        Returns:
            True if valid, False otherwise
        """
        try:
            generated_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode(),
                payload.encode(),
                hashlib.sha256
            ).hexdigest()

            return hmac.compare_digest(generated_signature, signature)
        except Exception as e:
            print(f"Webhook verification error: {str(e)}")
            return False

    def get_payment_status(self, payment_id: str) -> dict:
        """
        Get payment status from Razorpay API.

        Args:
            payment_id: Razorpay payment ID

        Returns:
            Payment details
        """
        try:
            payment = self.client.payment.fetch(payment_id)
            return {
                "status": payment["status"],
                "amount": payment["amount"],
                "order_id": payment.get("order_id"),
                "description": payment.get("description")
            }
        except Exception as e:
            raise ValueError(f"Failed to fetch payment: {str(e)}")

    def handle_payment_success(
        self,
        db: Session,
        user_id: int,
        order_id: str,
        payment_id: str,
        tier: str
    ) -> Payment:
        """
        Handle successful payment - create payment record and upgrade subscription.

        Args:
            db: Database session
            user_id: User ID
            order_id: Razorpay order ID
            payment_id: Razorpay payment ID
            tier: Subscription tier

        Returns:
            Payment record
        """
        pricing = self.get_pricing(tier)

        # Create payment record
        payment = Payment(
            user_id=user_id,
            subscription_id=None,  # Will be updated after subscription upgrade
            amount=pricing["amount"] / 100,  # Convert back to rupees
            currency="INR",
            provider=PaymentProvider.RAZORPAY,
            status=PaymentStatus.COMPLETED,
            provider_transaction_id=payment_id,
            provider_order_id=order_id,
            description=pricing["description"]
        )

        db.add(payment)
        db.commit()
        db.refresh(payment)

        # Upgrade subscription
        from services.subscription import upgrade_subscription
        subscription = upgrade_subscription(db, user_id, tier)

        # Update payment with subscription ID
        payment.subscription_id = subscription.id
        db.commit()

        return payment
