import sys
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from database.session import get_db
from database.models import Base, User
from utils.security import create_access_token

# In-memory SQLite for testing. StaticPool keeps a single shared connection so
# the schema/tables persist for the lifetime of the test process (a plain
# in-memory URL would otherwise create a fresh, empty DB per connection).
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to LegalSathi AI API"}

def test_chat_guest():
    """Test that guests can chat without authentication."""
    payload = {"query": "What are my rights against domestic violence?", "language": "en"}
    response = client.post("/api/chat/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "source_references" in data

def test_protected_documents_fail_no_auth():
    """Test that document generation fails without token."""
    payload = {"doc_type": "Rental Agreement", "details": {"tenant": "John Doe"}}
    response = client.post("/api/documents/generate", json=payload)
    assert response.status_code == 401

def test_admin_logs_fail_regular_user():
    """Test that regular users cannot see audit logs."""
    # Create a dummy user
    db = TestingSessionLocal()
    user = User(
        email="user@test.com",
        hashed_password="...",
        first_name="Test",
        last_name="User",
        role="user",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token(data={"sub": user.email, "role": "user", "id": user.id})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/api/admin/logs", headers=headers)
    assert response.status_code == 403

