import os
import sys

# Ensure backend directory is in Python path for all environments
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from api.routers import auth, chat, documents, navigator, admin, announcements
from database.models import Base, User
from database.session import engine, SessionLocal
from config.settings import settings
from utils.rate_limit import limiter

# Ensure database tables exist
Base.metadata.create_all(bind=engine)


def bootstrap_admin():
    """Create a single admin account from env vars if none exists.

    Replaces the old admin@legalsathi.ai first-login backdoor: an attacker
    could previously register the admin account with their own password.
    This only runs when ADMIN_EMAIL and ADMIN_PASSWORD are configured.
    """
    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        return
    from utils.security import get_password_hash

    db = SessionLocal()
    try:
        existing = (
            db.query(User)
            .filter(User.email == settings.ADMIN_EMAIL.lower(), User.role == "admin")
            .first()
        )
        if existing:
            return
        admin_user = User(
            email=settings.ADMIN_EMAIL.lower(),
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            first_name="Admin",
            last_name="System",
            role="admin",
            is_verified=True,
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
    finally:
        db.close()


bootstrap_admin()

app = FastAPI(
    title="LegalSathi AI",
    description="AI-powered multilingual Legal Information and Guidance Platform",
    version="1.0.0",
    # Interactive API docs are a dev convenience; never expose them in prod.
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=settings.ALLOWED_ORIGIN_REGEX or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(navigator.router, prefix="/api/navigator", tags=["navigator"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(announcements.router, prefix="/api/announcements", tags=["announcements"])

@app.get("/")
def read_root():
    return {"message": "Welcome to LegalSathi AI API"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "LegalSathi AI Backend", "version": settings.VERSION}

@app.get("/status")
def status():
    db_state = "disconnected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_state = "connected"
    except Exception:
        db_state = "disconnected"
    return {"status": "healthy" if db_state == "connected" else "degraded", "database": db_state}
