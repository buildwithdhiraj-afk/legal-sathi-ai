from datetime import datetime, timedelta
import re
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from database.session import get_db
from database.models import User, VerificationToken, PasswordResetToken, UserSession, AuditLog
from pydantic import BaseModel, EmailStr
from typing import Optional
from utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    generate_random_token,
    decode_token,
    get_current_user,
)
from utils.rate_limit import limiter
from utils.email_service import (
    send_verification_email,
    send_password_reset_email,
    send_welcome_email,
)
from config.settings import settings

router = APIRouter()

class UserRegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    confirm_password: str
    preferred_language: str = "en"
    country: str = "India"
    state: str = "Delhi"
    agree_terms: bool
    agree_privacy: bool

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str

class AdminLoginRequest(BaseModel):
    admin_email: EmailStr
    password: str

def validate_password_strength(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not re.search(r"[A-Za-z]", password) or not re.search(r"[0-9]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one letter and one number",
        )


@router.post("/register")
@limiter.limit("5/minute")
def register_user(request: Request, req: UserRegisterRequest, db: Session = Depends(get_db)):
    if not req.agree_terms or not req.agree_privacy:
        raise HTTPException(status_code=400, detail="You must agree to the Terms & Conditions and Privacy Policy")

    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Password and Confirm Password do not match")

    validate_password_strength(req.password)

    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists")

    hashed_pwd = get_password_hash(req.password)

    requires_verification = settings.REQUIRE_EMAIL_VERIFICATION

    new_user = User(
        email=req.email.lower(),
        hashed_password=hashed_pwd,
        first_name=req.first_name,
        last_name=req.last_name,
        phone=req.phone,
        preferred_language=req.preferred_language,
        country=req.country,
        state=req.state,
        role="user",
        is_verified=not requires_verification,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log Audit
    db.add(AuditLog(user_id=new_user.id, action="USER_REGISTERED"))

    if requires_verification:
        # Generate email verification token (24 hrs) and dispatch the email.
        token_str = generate_random_token()
        db.add(VerificationToken(
            user_id=new_user.id,
            token=token_str,
            token_type="email_verify",
            expires_at=datetime.utcnow() + timedelta(hours=24),
        ))
        db.commit()
        send_verification_email(new_user.email, new_user.first_name, token_str)
        return {
            "status": "success",
            "message": "Please verify your email before accessing your account.",
            "email": new_user.email,
            "verification_required": True,
        }

    # Auto-activation path (SMTP/verification not configured).
    db.commit()
    return {
        "status": "success",
        "message": "Account created successfully. You can now log in.",
        "email": new_user.email,
        "verification_required": False,
    }


@router.get("/verify-email")
def verify_email(token: str = Query(...), db: Session = Depends(get_db)):
    token_record = db.query(VerificationToken).filter(VerificationToken.token == token).first()
    if not token_record or token_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification link is invalid or has expired")

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    db.delete(token_record)
    db.add(AuditLog(user_id=user.id, action="EMAIL_VERIFIED"))
    db.commit()

    send_welcome_email(user.email, user.first_name)

    return {
        "status": "success",
        "message": "Email verified successfully!",
        "user": {
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        },
    }


@router.post("/login")
@limiter.limit("10/minute")
def login_user(request: Request, req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been suspended. Please contact support.")

    # Check account lock
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(status_code=429, detail="Account locked due to multiple failed login attempts. Try again later.")

    if not verify_password(req.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Reset failed attempts
    user.failed_login_attempts = 0
    user.locked_until = None

    if not user.is_verified:
        # Re-send verification if needed
        token_str = generate_random_token()
        db.add(VerificationToken(user_id=user.id, token=token_str, expires_at=datetime.utcnow() + timedelta(hours=24)))
        db.commit()
        send_verification_email(user.email, user.first_name, token_str)
        raise HTTPException(status_code=403, detail="Please verify your email before accessing your account.")

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    refresh_token = create_refresh_token(data={"sub": user.email, "id": user.id})

    # Save session
    db.add(UserSession(user_id=user.id, refresh_token=refresh_token, expires_at=datetime.utcnow() + timedelta(days=30)))
    db.add(AuditLog(user_id=user.id, action="USER_LOGIN"))
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "preferred_language": user.preferred_language,
            "country": user.country,
            "state": user.state,
        },
    }


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        # Return success to prevent user enumeration security risk
        return {"status": "success", "message": "If an account exists, a password reset email has been sent."}

    token_str = generate_random_token()
    db.add(PasswordResetToken(user_id=user.id, token=token_str, expires_at=datetime.utcnow() + timedelta(minutes=30)))
    db.add(AuditLog(user_id=user.id, action="PASSWORD_RESET_REQUESTED"))
    db.commit()

    send_password_reset_email(user.email, token_str)

    return {
        "status": "success",
        "message": "Password reset instructions sent to your email.",
    }


@router.post("/reset-password")
@limiter.limit("10/minute")
def reset_password(request: Request, req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    validate_password_strength(req.new_password)

    token_record = db.query(PasswordResetToken).filter(PasswordResetToken.token == req.token).first()
    if not token_record or token_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset link is invalid or has expired")

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(req.new_password)
    db.delete(token_record)
    db.add(AuditLog(user_id=user.id, action="PASSWORD_RESET_COMPLETED"))
    db.commit()

    return {"status": "success", "message": "Password updated successfully. You can now log in."}


@router.get("/me")
def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = current_user

    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "role": user.role,
        "is_verified": user.is_verified,
        "preferred_language": user.preferred_language,
        "country": user.country,
        "state": user.state,
    }


class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None
    theme: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/refresh")
def refresh_access_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # The token must correspond to a live, non-expired server-side session.
    session = (
        db.query(UserSession)
        .filter(UserSession.refresh_token == req.refresh_token)
        .first()
    )
    if not session or session.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token revoked or expired")

    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User account inactive or non-existent")

    # Rotate: invalidate the presented token, issue a fresh refresh token.
    db.delete(session)
    new_refresh_token = create_refresh_token(data={"sub": user.email, "id": user.id})
    db.add(UserSession(
        user_id=user.id,
        refresh_token=new_refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=30),
    ))
    db.add(AuditLog(user_id=user.id, action="TOKEN_REFRESHED"))

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    db.commit()
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


@router.post("/logout")
def logout(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Revoke the presented refresh token's session."""
    session = (
        db.query(UserSession)
        .filter(UserSession.refresh_token == req.refresh_token)
        .first()
    )
    if session:
        db.delete(session)
        db.commit()
    return {"status": "success", "message": "Logged out successfully"}


@router.post("/profile/update")
def update_profile(req: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = current_user

    if req.first_name: user.first_name = req.first_name
    if req.last_name: user.last_name = req.last_name
    if req.phone is not None: user.phone = req.phone
    if req.preferred_language: user.preferred_language = req.preferred_language
    if req.theme: user.theme = req.theme
    if req.country: user.country = req.country
    if req.state: user.state = req.state

    db.add(AuditLog(user_id=user.id, action="PROFILE_UPDATED"))
    db.commit()

    return {
        "status": "success",
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "role": user.role,
            "preferred_language": user.preferred_language,
            "theme": user.theme,
            "country": user.country,
            "state": user.state,
        }
    }


@router.post("/profile/change-password")
def change_password(req: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = current_user
    if not verify_password(req.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")

    validate_password_strength(req.new_password)

    user.hashed_password = get_password_hash(req.new_password)
    db.add(AuditLog(user_id=user.id, action="PASSWORD_CHANGED"))
    db.commit()

    return {"status": "success", "message": "Password changed successfully"}


@router.delete("/profile/delete")
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = current_user

    db.delete(user)
    db.commit()

    return {"status": "success", "message": "Your account has been deleted"}


@router.post("/admin/login")
@limiter.limit("10/minute")
def admin_login(request: Request, req: AdminLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.admin_email.lower(), User.role == "admin").first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid administrator credentials")

    access_token = create_access_token(data={"sub": user.email, "role": "admin", "id": user.id})
    db.add(AuditLog(user_id=user.id, action="ADMIN_LOGIN"))
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
        },
    }
