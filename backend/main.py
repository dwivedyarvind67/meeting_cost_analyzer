from fastapi import FastAPI, Depends, Header, HTTPException 
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from config import settings

# AUTH
from auth import hash_password, verify_password, decode_token
from auth import create_access_token, create_refresh_token

# GOOGLE
try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
except ImportError:
    id_token = None
    google_requests = None

import requests as pyrequests
from datetime import datetime
import os

# ROUTES
from routes.payments import router as payments_router

app = FastAPI(title="Meeting Cost Analyzer Pro API")

# Initialize database tables
models.Base.metadata.create_all(bind=engine)

# ✅ CORS - Allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include payment routes
app.include_router(payments_router)



# =======================
# 🔥 SCHEMAS
# =======================
class UserCreate(BaseModel):
    email: EmailStr
    password: str


class TokenRequest(BaseModel):
    email: EmailStr
    password: str


class MeetingCreate(BaseModel):
    duration: float
    participants: int
    avg_rate: float
    source: str = "manual"


# =======================
# DB
# =======================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =======================
# 🔐 AUTH (Bearer)
# =======================
def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization")

    try:
        token = authorization.split(" ")[1]
        user_id = decode_token(token)
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# =======================
# ROUTES
# =======================

@app.get("/")
def home():
    return {"message": "Backend running 🚀"}


# 🔐 SIGNUP
@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed = hash_password(user.password)

    new_user = models.User(email=user.email, password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create default FREE subscription
    from services.subscription import get_or_create_subscription
    get_or_create_subscription(db, new_user.id)

    return {"message": "User created", "user_id": new_user.id}


# 🔐 LOGIN
@app.post("/login")
def login(user: TokenRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "access_token": create_access_token({"user_id": db_user.id}),
        "refresh_token": create_refresh_token({"user_id": db_user.id}),
    }


# 🔁 REFRESH
@app.post("/refresh")
def refresh_token_api(data: dict):
    try:
        user_id = decode_token(data["refresh_token"])
        return {"access_token": create_access_token({"user_id": user_id})}
    except:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# 🔥 GOOGLE LOGIN
def verify_google_token(token):
    if not id_token or not google_requests:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    try:
        return id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=315360000
        )
    except Exception as e:
        print(f"GOOGLE LOGIN ERROR: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


@app.post("/google-login")
def google_login(data: dict, db: Session = Depends(get_db)):
    user = verify_google_token(data["token"])
    email = user["email"]

    db_user = db.query(models.User).filter(models.User.email == email).first()

    if not db_user:
        db_user = models.User(email=email, password="google")
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Create default FREE subscription for new Google users
        from services.subscription import get_or_create_subscription
        get_or_create_subscription(db, db_user.id)

    return {
        "access_token": create_access_token({"user_id": db_user.id}),
        "refresh_token": create_refresh_token({"user_id": db_user.id}),
    }


# 💸 CALCULATE + SAVE
@app.post("/calculate")
def calculate_cost(
    meeting: MeetingCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    # Check meeting limit
    from services.subscription import can_create_meeting

    can_create, reason = can_create_meeting(db, user_id)
    if not can_create:
        raise HTTPException(
            status_code=402,  # Payment Required
            detail=f"Cannot create meeting: {reason}. Upgrade your plan to continue."
        )

    total_cost = meeting.duration * meeting.participants * meeting.avg_rate

    new_meeting = models.Meeting(
        duration=meeting.duration,
        participants=meeting.participants,
        avg_rate=meeting.avg_rate,
        total_cost=total_cost,
        user_id=user_id,
        source=meeting.source or "manual"
    )

    db.add(new_meeting)
    db.commit()

    return {"total_cost": total_cost, "meeting_id": new_meeting.id}


# 📊 GET MEETINGS
@app.get("/meetings")
def get_meetings(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    return db.query(models.Meeting).filter(models.Meeting.user_id == user_id).all()


# 📅 GOOGLE CALENDAR
@app.post("/google-calendar")
def get_google_calendar(
    data: dict,
    user_id: int = Depends(get_current_user)
):
    try:
        access_token = data.get("access_token")

        if not access_token:
            raise HTTPException(status_code=400, detail="Missing Google access token")

        response = pyrequests.get(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers={
                "Authorization": f"Bearer {access_token}"
            }
        )

        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch calendar")

        events = response.json().get("items", [])

        formatted_events = []

        for e in events[:10]:
            start = e.get("start", {}).get("dateTime", "")
            end = e.get("end", {}).get("dateTime", "")

            try:
                if start and end:
                    start_dt = datetime.fromisoformat(start.replace("Z", ""))
                    end_dt = datetime.fromisoformat(end.replace("Z", ""))
                    duration = round((end_dt - start_dt).total_seconds() / 3600, 2)
                else:
                    duration = 1
            except:
                duration = 1

            cost = duration * 500

            formatted_events.append({
                "title": e.get("summary", "No Title"),
                "duration": duration,
                "cost": cost
            })

        return formatted_events

    except Exception as e:
        print("GOOGLE CALENDAR ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Calendar fetch failed")


# =======================
# 📊 SUBSCRIPTIONS
# =======================

@app.get("/subscriptions/current")
def get_current_subscription(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    """Get current user subscription details."""
    from services.subscription import get_or_create_subscription
    subscription = get_or_create_subscription(db, user_id)
    return {
        "id": subscription.id,
        "tier": subscription.tier.value,
        "status": subscription.status.value,
        "start_date": subscription.start_date,
        "end_date": subscription.end_date,
        "auto_renew": subscription.auto_renew
    }


@app.get("/pricing")
def get_pricing():
    """Get all available pricing plans."""
    return settings.PRICING


@app.get("/stats")
def get_user_stats(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    """Get user statistics including meeting count and usage."""
    from services.subscription import get_user_stats
    return get_user_stats(db, user_id)


@app.post("/subscriptions/upgrade")
def upgrade_subscription(
    tier_data: dict,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    """
    Upgrade user subscription tier.
    Note: This creates subscription record. Payment should be verified first.
    """
    from services.subscription import upgrade_subscription

    new_tier = tier_data.get("tier")
    if not new_tier:
        raise HTTPException(status_code=400, detail="Tier parameter required")

    if new_tier not in ["free", "pro", "team"]:
        raise HTTPException(status_code=400, detail="Invalid tier")

    subscription = upgrade_subscription(db, user_id, new_tier)

    return {
        "message": f"Upgraded to {new_tier}",
        "subscription": {
            "tier": subscription.tier.value,
            "status": subscription.status.value,
        }
    }


@app.post("/subscriptions/cancel")
def cancel_subscription_endpoint(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    """Cancel user subscription."""
    from services.subscription import cancel_subscription

    subscription = cancel_subscription(db, user_id)

    return {
        "message": "Subscription cancelled",
        "subscription": {
            "tier": subscription.tier.value,
            "status": subscription.status.value,
            "end_date": subscription.end_date
        }
    }