"""
Stripe payment service for handling international payments.
Integrates with Stripe API for payment processing and webhooks.
"""

try:
    import stripe
except ImportError:
    stripe = None

from config import settings
from sqlalchemy.orm import Session
from models import Payment, PaymentStatus, PaymentProvider
from datetime import datetime
import os


# Configure Stripe only if key is available
if stripe and settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """Service for handling Stripe payments."""

    def __init__(self):
        self.publishable_key = settings.STRIPE_PUBLISHABLE_KEY
        self.secret_key = settings.STRIPE_SECRET_KEY
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    def get_pricing(self, tier: str, interval: str = "month") -> dict:
        """
        Get Stripe pricing product for a subscription tier.

        Args:
            tier: Subscription tier (free, pro, team)
            interval: Billing interval (month, year)

        Returns:
            Pricing details
        """
        pricing = settings.PRICING.get(tier)
        if not pricing:
            raise ValueError(f"Invalid tier: {tier}")

        # Convert INR to USD for Stripe (approximately)
        # In production, maintain Stripe product IDs in config
        amount = pricing["price"]

        return {
            "amount": amount,
            "currency": "USD",
            "description": f"{pricing['name']} plan - ${amount}/month",
            "tier": tier
        }

    def create_checkout_session(
        self,
        user_id: int,
        user_email: str,
        tier: str,
        success_url: str,
        cancel_url: str
    ) -> dict:
        """
        Create a Stripe Checkout Session for subscription.

        Args:
            user_id: User ID
            user_email: User email
            tier: Subscription tier
            success_url: URL to redirect on success
            cancel_url: URL to redirect on cancel

        Returns:
            Session details
        """
        pricing = self.get_pricing(tier)

        if pricing["amount"] == 0:
            # Free tier - no Stripe session needed
            return {
                "session_id": None,
                "client_secret": None,
                "tier": tier,
                "type": "free"
            }

        try:
            # Create or get Stripe customer
            customers = stripe.Customer.list(email=user_email, limit=1)
            if customers.data:
                customer_id = customers.data[0].id
            else:
                customer = stripe.Customer.create(
                    email=user_email,
                    metadata={"user_id": str(user_id)}
                )
                customer_id = customer.id

            # Create checkout session for subscription
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": pricing["description"],
                            "metadata": {"tier": tier}
                        },
                        "unit_amount": int(pricing["amount"] * 100),  # Convert to cents
                        "recurring": {
                            "interval": "month",
                            "interval_count": 1
                        }
                    },
                    "quantity": 1
                }],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "user_id": str(user_id),
                    "tier": tier
                }
            )

            return {
                "session_id": session.id,
                "client_secret": session.client_secret,
                "tier": tier,
                "type": "subscription"
            }

        except stripe.error.StripeError as e:
            raise ValueError(f"Failed to create Stripe session: {str(e)}")

    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify Stripe webhook signature.

        Args:
            payload: Raw request body from webhook
            signature: Stripe signature from headers

        Returns:
            True if valid
        """
        try:
            if not self.webhook_secret:
                print("Warning: STRIPE_WEBHOOK_SECRET not set")
                return False

            stripe.Webhook.construct_event(
                payload,
                signature,
                self.webhook_secret
            )
            return True
        except ValueError:
            return False
        except stripe.error.SignatureVerificationError:
            return False

    def handle_subscription_created(
        self,
        db: Session,
        event_data: dict
    ) -> Payment:
        """
        Handle Stripe subscription.created event.

        Args:
            db: Database session
            event_data: Event data from webhook

        Returns:
            Payment record
        """
        subscription = event_data["object"]
        user_id = int(subscription["metadata"]["user_id"])
        tier = subscription["metadata"]["tier"]

        # Get invoice for payment details
        invoice_id = subscription["latest_invoice"]
        if invoice_id:
            invoice = stripe.Invoice.retrieve(invoice_id)
            payment_intent_id = invoice["payment_intent"]
            if payment_intent_id:
                payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                status = payment_intent["status"]
            else:
                status = "pending"
        else:
            status = "pending"
            payment_intent_id = None

        # Create payment record
        pricing = self.get_pricing(tier)
        payment = Payment(
            user_id=user_id,
            subscription_id=None,
            amount=pricing["amount"],
            currency="USD",
            provider=PaymentProvider.STRIPE,
            status=PaymentStatus.COMPLETED if status == "succeeded" else PaymentStatus.PENDING,
            provider_transaction_id=subscription["id"],
            description=f"Stripe {tier} subscription"
        )

        db.add(payment)
        db.commit()
        db.refresh(payment)

        if status == "succeeded":
            # Upgrade subscription
            from services.subscription import upgrade_subscription
            subscription_record = upgrade_subscription(db, user_id, tier)
            payment.subscription_id = subscription_record.id
            db.commit()

        return payment

    def handle_invoice_payment_succeeded(
        self,
        db: Session,
        event_data: dict
    ) -> Payment:
        """
        Handle Stripe invoice.payment_succeeded event.

        Args:
            db: Database session
            event_data: Event data from webhook

        Returns:
            Payment record
        """
        invoice = event_data["object"]
        user_id = int(invoice["metadata"].get("user_id", 0))

        if not user_id:
            return None

        # Create payment record for renewal
        payment = Payment(
            user_id=user_id,
            subscription_id=None,
            amount=invoice["total"] / 100,  # Convert from cents
            currency=invoice["currency"].upper(),
            provider=PaymentProvider.STRIPE,
            status=PaymentStatus.COMPLETED,
            provider_transaction_id=invoice["id"],
            description=f"Stripe invoice payment"
        )

        db.add(payment)
        db.commit()
        db.refresh(payment)

        return payment

    def cancel_subscription(self, subscription_id: str):
        """
        Cancel a Stripe subscription.

        Args:
            subscription_id: Stripe subscription ID
        """
        try:
            stripe.Subscription.delete(subscription_id)
        except stripe.error.StripeError as e:
            raise ValueError(f"Failed to cancel subscription: {str(e)}")
