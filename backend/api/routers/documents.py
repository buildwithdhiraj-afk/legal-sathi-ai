from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.session import get_db
from database.models import GeneratedDocument, User
from pydantic import BaseModel
from typing import List
from utils.security import get_current_user
from utils.audit_logger import log_event

router = APIRouter()

class DocumentRequest(BaseModel):
    doc_type: str
    details: dict

class DocumentResponse(BaseModel):
    id: int
    doc_type: str
    content: str

@router.post("/generate", response_model=DocumentResponse)
def generate_document(
    request: DocumentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    generated_content = f"Generated {request.doc_type} based on provided details."

    doc = GeneratedDocument(
        user_id=current_user.id,
        doc_type=request.doc_type,
        content=generated_content,
    )
    db.add(doc)
    log_event(
        db=db,
        action="DOCUMENT_GENERATED",
        user_id=current_user.id,
        query_text=request.doc_type,
        auto_commit=False,
    )
    db.commit()
    db.refresh(doc)

    return DocumentResponse(
        id=doc.id,
        doc_type=doc.doc_type,
        content=doc.content,
    )

@router.get("/saved", response_model=List[DocumentResponse])
def get_saved_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = (
        db.query(GeneratedDocument)
        .filter(GeneratedDocument.user_id == current_user.id)
        .order_by(GeneratedDocument.created_at.desc())
        .all()
    )
    return [
        DocumentResponse(id=d.id, doc_type=d.doc_type, content=d.content)
        for d in docs
    ]

@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(GeneratedDocument).filter(GeneratedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not own this document")
    return DocumentResponse(id=doc.id, doc_type=doc.doc_type, content=doc.content)
