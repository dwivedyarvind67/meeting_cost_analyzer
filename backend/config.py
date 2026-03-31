"""
Centralized configuration management for Meeting Cost Analyzer Pro backend.
Loads all configuration from environment variables with validation.
"""

import os
from dataclasses import dataclass, field
from typing import Literal, Dict, Any
from dotenv import load_dotenv

# Load .env file
load_dotenv()


@dataclass
class Settings:
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = field(default_factory=lambda: os.getenv(
        "DATABASE_URL",
        "sqlite:///./test.db"
    ))

    # JWT Configuration
    SECRET_KEY: str = field(default_factory=lambda: os.getenv("SECRET_KEY", "dev-secret-key-change-in-production"))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google OAuth
    GOOGLE_CLIENT_ID: str = field(default_factory=lambda: os.getenv("GOOGLE_CLIENT_ID", ""))
    GOOGLE_CLIENT_SECRET: str = field(default_factory=lambda: os.getenv("GOOGLE_CLIENT_SECRET", ""))

    # Razorpay Configuration
    RAZORPAY_KEY_ID: str = field(default_factory=lambda: os.getenv("RAZORPAY_KEY_ID", ""))
    RAZORPAY_KEY_SECRET: str = field(default_factory=lambda: os.getenv("RAZORPAY_KEY_SECRET", ""))

    # Stripe Configuration
    STRIPE_SECRET_KEY: str = field(default_factory=lambda: os.getenv("STRIPE_SECRET_KEY", ""))
    STRIPE_PUBLISHABLE_KEY: str = field(default_factory=lambda: os.getenv("STRIPE_PUBLISHABLE_KEY", ""))

    # SendGrid Configuration
    SENDGRID_API_KEY: str = field(default_factory=lambda: os.getenv("SENDGRID_API_KEY", ""))
    SENDER_EMAIL: str = field(default_factory=lambda: os.getenv("SENDER_EMAIL", "noreply@meetingcost.com"))

    # CORS Configuration
    CORS_ORIGINS: list = field(default_factory=lambda: os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(","))

    # Environment
    ENVIRONMENT: Literal["dev", "prod"] = field(default_factory=lambda: os.getenv("ENVIRONMENT", "dev"))

    # Pricing Configuration (INR)
    PRICING: Dict[str, Any] = field(default_factory=lambda: {
        "free": {
            "name": "Free",
            "price": 0,
            "meetings_per_month": 50,
            "features": {
                "export_pdf": False,
                "calendar_sync": True,
                "team_invites": False,
            }
        },
        "pro": {
            "name": "Pro",
            "price": 499,
            "meetings_per_month": float('inf'),
            "features": {
                "export_pdf": True,
                "calendar_sync": True,
                "team_invites": False,
            }
        },
        "team": {
            "name": "Team",
            "price": 1999,
            "meetings_per_month": float('inf'),
            "features": {
                "export_pdf": True,
                "calendar_sync": True,
                "team_invites": True,
            }
        }
    })

    def validate_production(self):
        """Validate that all required settings are present for production."""
        environment = os.getenv("ENVIRONMENT", "dev")
        if environment == "prod":
            required_vars = [
                self.SECRET_KEY,
                self.GOOGLE_CLIENT_ID,
                self.RAZORPAY_KEY_ID,
                self.STRIPE_SECRET_KEY,
                self.SENDGRID_API_KEY,
            ]

            if None in required_vars or "" in required_vars:
                raise ValueError(
                    "Missing required environment variables for production. "
                    "Please set: SECRET_KEY, GOOGLE_CLIENT_ID, RAZORPAY_KEY_ID, "
                    "STRIPE_SECRET_KEY, SENDGRID_API_KEY"
                )

    def get_cors_origins(self) -> list:
        """Get CORS allowed origins list."""
        return self.CORS_ORIGINS

    def is_production(self) -> bool:
        """Check if running in production."""
        return os.getenv("ENVIRONMENT", "dev") == "prod"


# Global settings instance
settings = Settings()

# Validate on import if production
if settings.is_production():
    settings.validate_production()
