import os
from datetime import datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from database.session import get_db
from database.models import User, GeneratedDocument, ChatHistory, LegalCase, AuditLog, SystemSetting, LegalTemplate, KnowledgeFile
from utils.security import get_password_hash, verify_password, create_access_token, decode_token, get_current_admin
from utils.audit_logger import log_event
from utils.rate_limit import limiter

router = APIRouter()

class AdminLoginRequest(BaseModel):
    admin_email: EmailStr
    password: str

@router.post("/login")
@limiter.limit("10/minute")
def admin_login(request: Request, req: AdminLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.admin_email.lower(), User.role == "admin").first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid administrator credentials")

    access_token = create_access_token(data={"sub": user.email, "role": "admin", "id": user.id})
    log_event(db=db, action="ADMIN_LOGIN", user_id=user.id)

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

class ResetUserPasswordRequest(BaseModel):
    user_id: int
    new_password: str

class TemplateCreateRequest(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    fields_json: str

class KnowledgeUploadRequest(BaseModel):
    filename: str
    category: str
    file_path: str
    file_size: Optional[str] = "1.2 MB"


@router.post("/users/reset-password")
def admin_reset_user_password(req: ResetUserPasswordRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(req.new_password)
    log_event(db=db, action=f"ADMIN_RESET_USER_{user.id}_PASSWORD", user_id=admin.id)
    return {"status": "success", "message": f"Password reset for user {user.email}"}


@router.get("/logs")
def get_audit_logs(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "domain": l.domain_detected,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S") if l.timestamp else "",
        }
        for l in logs
    ]


@router.get("/documents")
def get_all_documents(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    docs = db.query(GeneratedDocument).order_by(GeneratedDocument.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "user_id": d.user_id,
            "doc_type": d.doc_type,
            "content": d.content[:200] + "...",
            "created_at": d.created_at.strftime("%Y-%m-%d %H:%M") if d.created_at else "",
        }
        for d in docs
    ]


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    doc = db.query(GeneratedDocument).filter(GeneratedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    log_event(db=db, action=f"ADMIN_DELETED_DOC_{doc_id}", user_id=admin.id)
    db.commit()
    return {"status": "success", "message": f"Document {doc_id} deleted."}


@router.get("/templates")
def get_templates(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    templates = db.query(LegalTemplate).all()
    if not templates:
        # Return default master templates
        return [
            {"id": 1, "name": "FIR Complaint Draft", "category": "Police Complaints", "description": "Standard Indian Police FIR Registration Template"},
            {"id": 2, "name": "RTI Application Form", "category": "RTI Applications", "description": "Right to Information Act Section 6(1) Format"},
            {"id": 3, "name": "Rental Dispute Notice", "category": "Rental Laws", "description": "Notice for Security Deposit Recovery / Lease Breach"},
            {"id": 4, "name": "Consumer Rights Complaint", "category": "Consumer Protection", "description": "Notice under Consumer Protection Act 2019"},
            {"id": 5, "name": "Cyber Crime Complaint", "category": "Cyber Fraud", "description": "National Cyber Crime Reporting Portal Draft"},
            {"id": 6, "name": "Legal Notice for Non-Payment", "category": "Legal Notice", "description": "Formal Advocate Notice for Recovery of Dues"},
            {"id": 7, "name": "Self-Affidavit Draft", "category": "Affidavit", "description": "General General Purpose Indian Sworn Affidavit"},
            {"id": 8, "name": "POSH Workplace Complaint", "category": "Women's Rights", "description": "Sexual Harassment at Workplace (POSH) ICC Draft"},
        ]
    return templates


@router.get("/knowledge")
def get_knowledge_files(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    files = db.query(KnowledgeFile).all()
    return files

class UserActionRequest(BaseModel):
    user_id: int
    action: str # 'suspend', 'activate', 'delete', 'make_admin', 'make_user'

class SettingUpdateRequest(BaseModel):
    key: str
    value: str


@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):

    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    verified_users = db.query(User).filter(User.is_verified == True).count()

    now = datetime.utcnow()
    start_of_today = datetime.combine(now.date(), time.min)
    end_of_today = start_of_today + timedelta(days=1)
    chats_today = db.query(ChatHistory).filter(
        ChatHistory.timestamp >= start_of_today,
        ChatHistory.timestamp < end_of_today,
    ).count()

    total_documents = db.query(GeneratedDocument).count()
    total_cases = db.query(LegalCase).count()
    total_events = db.query(AuditLog).count()

    top_domain = (
        db.query(ChatHistory.domain, func.count(ChatHistory.id))
        .group_by(ChatHistory.domain)
        .order_by(func.count(ChatHistory.id).desc())
        .first()
    )
    most_used_category = top_domain[0] if top_domain and top_domain[0] else "N/A"

    storage_bytes = 0
    for f in db.query(KnowledgeFile).all():
        if f.file_path and os.path.exists(f.file_path):
            try:
                storage_bytes += os.path.getsize(f.file_path)
            except OSError:
                pass
    storage_used = f"{storage_bytes / (1024 * 1024):.1f} MB" if storage_bytes else "0 B"

    return {
        "total_users": total_users,
        "active_users": active_users,
        "verified_users": verified_users,
        "chats_today": chats_today,
        "generated_documents": total_documents,
        "saved_cases": total_cases,
        "api_usage": f"{total_events} requests logged",
        "most_used_category": most_used_category,
        "storage_used": storage_used,
    }


@router.get("/users")
def get_all_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    res = []
    for u in users:
        res.append({
            "id": u.id,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "preferred_language": u.preferred_language,
            "country": u.country,
            "state": u.state,
            "created_at": u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else "",
        })
    return res


@router.post("/users/action")
def user_action(req: UserActionRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    target_user = db.query(User).filter(User.id == req.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own active admin account")

    if req.action == "suspend":
        target_user.is_active = False
        action_text = "USER_SUSPENDED"
    elif req.action == "activate":
        target_user.is_active = True
        action_text = "USER_ACTIVATED"
    elif req.action == "delete":
        db.delete(target_user)
        db.commit()
        return {"status": "success", "message": f"User ID {req.user_id} deleted."}
    elif req.action == "make_admin":
        target_user.role = "admin"
        action_text = "ROLE_CHANGED_TO_ADMIN"
    elif req.action == "make_user":
        target_user.role = "user"
        action_text = "ROLE_CHANGED_TO_USER"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    log_event(db=db, action=action_text, user_id=admin.id)
    db.commit()
    return {"status": "success", "message": f"User ID {req.user_id} updated: {req.action}"}


@router.get("/settings")
def get_system_settings(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    settings = db.query(SystemSetting).all()
    res = {s.setting_key: s.setting_value for s in settings}
    # Defaults
    res.setdefault("maintenance_mode", "false")
    res.setdefault("smtp_host", "smtp.gmail.com")
    res.setdefault("smtp_port", "587")
    res.setdefault("default_language", "en")
    res.setdefault("rag_chunk_size", "500")
    return res


@router.post("/settings")
def update_system_setting(req: SettingUpdateRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    setting = db.query(SystemSetting).filter(SystemSetting.setting_key == req.key).first()
    if setting:
        setting.setting_value = req.value
    else:
        db.add(SystemSetting(setting_key=req.key, setting_value=req.value))

    log_event(db=db, action=f"SETTING_UPDATED_{req.key}", user_id=admin.id)
    db.commit()
    return {"status": "success", "key": req.key, "value": req.value}
