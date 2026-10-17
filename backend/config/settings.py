from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "LegalSathi AI"
    VERSION: str = "1.0.0"

    # Debug mode: enables the interactive API docs (/docs, /redoc). Off in prod.
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./legalsathi.db"

    # JWT Auth - SECRET_KEY has NO default so a misconfigured deploy fails fast
    # instead of silently issuing forgeable tokens.
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Supabase (Optional fallback)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Admin bootstrap (optional). When both are set and no admin exists,
    # a single admin account is created at startup. Leave blank to skip.
    ADMIN_EMAIL: str = ""
    ADMIN_PASSWORD: str = ""
    ADMIN_BOOTSTRAP_TOKEN: str = ""

    # CORS - exact origins only (Starlette does exact string matching).
    ALLOWED_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:8000,http://127.0.0.1:8000"
    )
    # Optional regex for preview deploys (Vercel / GitHub Pages). Empty = disabled.
    ALLOWED_ORIGIN_REGEX: str = r"https://([a-z0-9-]+\.)?(vercel\.app|github\.io)"

    # AI APIs
    GEMINI_API_KEY: str = ""
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"

    # Email / verification. When SMTP is unconfigured, verification is skipped
    # and accounts are activated immediately (matching the mock email logger).
    REQUIRE_EMAIL_VERIFICATION: bool = False
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@legalsathi.ai"

    # Frontend base URL, used to build verification / reset links in emails.
    FRONTEND_URL: str = "http://localhost:3000"

    # Rate limiting
    RATE_LIMIT_ENABLED: bool = True

    # Number of trusted reverse proxies in front of the app (0 = none).
    # Governs how X-Forwarded-For is parsed for client IP resolution.
    TRUSTED_PROXY_COUNT: int = 0

    model_config = SettingsConfigDict(env_file=str(ENV_FILE), extra="ignore")


settings = Settings()
