from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(String, default="user") # 'user', 'admin'
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    preferred_language = Column(String, default="en")
    theme = Column(String, default="light")
    country = Column(String, default="India")
    state = Column(String, default="Delhi")
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chats = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("GeneratedDocument", back_populates="user", cascade="all, delete-orphan")
    cases = relationship("LegalCase", back_populates="user", cascade="all, delete-orphan")
    verification_tokens = relationship("VerificationToken", back_populates="user", cascade="all, delete-orphan")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")

class VerificationToken(Base):
    __tablename__ = "verification_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    token_type = Column(String, default="email_verify") # 'email_verify'
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="verification_tokens")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reset_tokens")

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    refresh_token = Column(String, unique=True, index=True, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")

class ChatHistory(Base):
    __tablename__ = "chat_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    domain = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chats")

class GeneratedDocument(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    doc_type = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="documents")

class LegalCase(Base):
    __tablename__ = "legal_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_code = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    urgency = Column(String, default="Medium")
    status = Column(String, default="In Progress")
    progress = Column(Integer, default=20)
    data_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="cases")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)          # None for guest users
    action = Column(String, nullable=False)           # e.g. CHAT_QUERY, LOGIN, REGISTER
    query_text = Column(Text, nullable=True)          # Redacted query text (PII removed)
    domain_detected = Column(String, nullable=True)   # e.g. Women's Rights
    confidence_score = Column(String, nullable=True)  # confidence of the RAG response
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String, unique=True, index=True, nullable=False)
    setting_value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bookmarks")

class LegalTemplate(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    fields_json = Column(Text, nullable=False) # JSON string of fields
    created_at = Column(DateTime, default=datetime.utcnow)

class KnowledgeFile(Base):
    __tablename__ = "knowledge_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    category = Column(String, nullable=False) # 'PDF', 'Court Judgement', 'Act', 'Circular'
    file_path = Column(String, nullable=False)
    file_size = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class GovernmentAnnouncement(Base):
    __tablename__ = "government_announcements"

    id = Column(Integer, primary_key=True, index=True)
    gazette_notification_no = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    ministry = Column(String, nullable=False)
    publication_date = Column(String, nullable=False)
    effective_date = Column(String, nullable=True)
    
    # Official Source Verification
    official_pdf_url = Column(String, nullable=False) # Must be *.gov.in or *.nic.in
    pdf_sha256 = Column(String, nullable=False)
    is_verified_source = Column(Boolean, default=True)
    
    # Rule Change Matrix
    act_affected = Column(String, nullable=False)
    summary_old_rule = Column(Text, nullable=True)
    summary_new_rule = Column(Text, nullable=False)
    key_citizen_impact = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
