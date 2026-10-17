from datetime import datetime, timedelta
import secrets
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from config.settings import settings
from database.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8')[:72], hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def generate_random_token(length: int = 32) -> str:
    return secrets.token_hex(length)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return {}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Mandatory auth dependency - raises 401 if not authenticated."""
    from database.models import User
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    email: str = payload.get("sub")
    if not email:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise credentials_exception
    return user

def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Admin-only dependency - raises 403 if not admin."""
    user = get_current_user(token, db)
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user

def get_optional_user(token: str = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)):
    """Optional auth dependency - returns None for guests, User for logged-in users."""
    if not token:
        return None
    from database.models import User
    payload = decode_token(token)
    email: str = payload.get("sub")
    if not email:
        return None
    return db.query(User).filter(User.email == email).first()

