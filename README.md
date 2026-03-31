# Meeting Cost Analyzer Pro 💸

A production-ready SaaS application that calculates real-time meeting costs based on participants, duration, and hourly rates.

## 🎯 Features

✅ Real-time Cost Calculator
✅ Google Calendar Integration  
✅ Meeting History & Analytics
✅ Subscription Management (Free/Pro/Team)
✅ Razorpay + Stripe Payments
✅ Dark Modern SaaS UI
✅ JWT Authentication + Google OAuth
✅ Feature-based Access Control

## 🏗️ Tech Stack

**Frontend:** Next.js 16 | React 19 | TypeScript | Tailwind CSS | Framer Motion
**Backend:** FastAPI | SQLAlchemy | JWT Auth
**Payments:** Razorpay (India) + Stripe (International)
**Database:** PostgreSQL / SQLite

## 🚀 Quick Start

### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

Visit:
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

## 📞 API Endpoints

**Auth:**
- POST /signup - Register
- POST /login - Login
- POST /google-login - Google OAuth
- POST /refresh - Refresh token

**Meetings:**
- POST /calculate - Calculate & save meeting cost
- GET /meetings - Get meeting history
- POST /google-calendar - Sync Google Calendar

**Subscriptions:**
- GET /subscriptions/current - Get subscription
- GET /pricing - Get plans
- GET /stats - Get user statistics
- POST /subscriptions/upgrade - Upgrade plan

**Payments:**
- POST /payments/razorpay/order - Create order
- POST /payments/razorpay/verify - Verify payment
- POST /payments/stripe/create-session - Stripe checkout

## 📊 Subscription Plans

| Plan | Price | Meetings/month | Features |
|------|-------|----------------|----------|
| Free | Free | 50 | Calendar sync |
| Pro | ₹499 | Unlimited | + PDF export |
| Team | ₹1999 | Unlimited | + Team collab |

## 🔐 Security

- JWT tokens (15 min access, 7 day refresh)
- Bcrypt password hashing
- Environment-based secrets
- CORS configuration
- Webhook signature verification
- SQL injection prevention (ORM)

## 📁 Project Structure

```
meeting-cost-saas/
├── frontend/          # Next.js application
│   ├── app/          # Pages (home, login, signup, billing, etc)
│   ├── components/   # Reusable components (Navbar, etc)
│   └── lib/          # Utilities (API client, auth)
├── backend/          # FastAPI application
│   ├── main.py      # Route definitions
│   ├── models.py    # Database models
│   ├── auth.py      # Authentication
│   ├── config.py    # Configuration
│   ├── schemas.py   # Pydantic schemas
│   ├── services/    # Business logic (subscriptions, payments)
│   └── routes/      # API routes (payments)
├── .env.example      # Example environment variables
└── README.md         # This file
```

## 📚 Full Documentation

See implementation plan: `.claude/plans/encapsulated-drifting-mountain.md`

**What's Implemented:**
- ✅ Phase 1: Security & Configuration (env vars, secrets)
- ✅ Phase 2: Database Models (subscriptions, payments)
- ✅ Phase 3: Subscription System (tiers, feature gates)
- ✅ Phase 4: Payment Integration (Razorpay + Stripe)
- ✅ Phase 5 & 6: Frontend Pages (signup, billing, checkout)
- 🔲 Phase 7: Advanced Features (PDF export, emails)
- 🔲 Phase 8: Deployment (Docker, CI/CD)
- 🔲 Phase 10: Testing & Documentation

## 🛠️ Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./test.db
SECRET_KEY=your-secret-key
GOOGLE_CLIENT_ID=...
RAZORPAY_KEY_ID=...
STRIPE_SECRET_KEY=...
ENVIRONMENT=dev
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

## 📝 License

MIT

## 🙏 Built with ❤️

Making SaaS development simple and scalable.
