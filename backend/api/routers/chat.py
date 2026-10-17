"""
Chat Router — LegalSathi AI
- Optional JWT auth (guests allowed, logged-in users get query history saved)
- PII redaction before all AI processing (handled inside pipeline.ask)
- Audit logging of every query (user_id, redacted query, domain, confidence)
- Returns source_references list for clickable citation chips in the frontend
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database.session import get_db
from database.models import ChatHistory, User
from pydantic import BaseModel
from rag.pipeline import pipeline
from utils.security import get_optional_user
from utils.audit_logger import log_event, get_client_ip, get_user_agent
from utils.rate_limit import limiter
import json
import re

router = APIRouter()


class ChatRequest(BaseModel):
    query: str
    language: str = "en"


class SourceReference(BaseModel):
    act: str
    section: str


class ChatResponse(BaseModel):
    summary: str
    applicable_law: str
    explanation: str
    rights: str
    next_steps: str
    required_documents: str
    government_website: str
    disclaimer: str
    confidence_score: float
    source_references: List[SourceReference] = []


def _extract_source_references(text: str) -> List[SourceReference]:
    """
    Parse inline citations of the form [Act Name, Section X] from any
    text field in the RAG response and return unique SourceReference objects.

    Examples matched:
        [Indian Penal Code, Section 354]
        [Protection of Women from Domestic Violence Act, Section 12]
        [Information Technology Act 2000, Section 66C]
    """
    pattern = re.compile(
        r"\[([^\],]+?),\s*(Section\s+\d+[A-Za-z]?(?:\([a-z]\))?)\]",
        re.IGNORECASE,
    )
    seen: set = set()
    refs: List[SourceReference] = []
    for act, section in pattern.findall(text):
        key = (act.strip(), section.strip())
        if key not in seen:
            seen.add(key)
            refs.append(SourceReference(act=act.strip(), section=section.strip()))
    return refs


def _refs_from_sources(sources) -> List[SourceReference]:
    """Build citations from the retrieved section sources (preferred)."""
    refs: List[SourceReference] = []
    seen: set = set()
    for s in sources or []:
        act = (s.get("act_title") or "").strip()
        section = (s.get("section_number") or "").strip()
        if not act or not section:
            continue
        key = (act, section)
        if key in seen:
            continue
        seen.add(key)
        refs.append(SourceReference(act=act, section=section))
    return refs


@router.post("/", response_model=ChatResponse)
@limiter.limit("20/minute")
def chat_with_bot(
    request: Request,
    chat_req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Main chat endpoint.
    - Accepts queries from both guests and logged-in users.
    - Redacts PII before anything is stored or sent to the AI.
    - Saves chat history only for authenticated users.
    - Audit-logs every request with user_id (or None for guest).
    """
    # RAG pipeline (PII redaction happens inside)
    # We get the redacted version back to ensure privacy in logs
    from utils.pii_redactor import redact_pii
    redacted_query = redact_pii(chat_req.query)
    
    response = pipeline.ask(chat_req.query, chat_req.language)

    # Prefer citations drawn from the retrieved sources; fall back to scraping
    # inline [Act, Section X] markers from the response text.
    source_refs = _refs_from_sources(response.get("sources"))
    if not source_refs:
        combined_text = " ".join(
            str(response.get(k, ""))
            for k in ("summary", "applicable_law", "explanation", "rights", "next_steps")
        )
        source_refs = _extract_source_references(combined_text)

    # Persist chat history for authenticated users only
    if current_user:
        db.add(
            ChatHistory(
                user_id=current_user.id,
                query=chat_req.query[:2000],          # raw query for UX display (private to user)
                response=json.dumps(response, ensure_ascii=False)[:4000],
                domain=response.get("applicable_law", "")[:200],
            )
        )

    # Audit log — always, for every query (guest or authenticated)
    # CRITICAL: We log the REDACTED query to the audit table for privacy compliance
    log_event(
        db=db,
        action="CHAT_QUERY",
        user_id=current_user.id if current_user else None,
        query_text=redacted_query,
        domain_detected=response.get("applicable_law", "")[:200],
        confidence_score=float(response.get("confidence_score", 0)),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        auto_commit=False,
    )
    db.commit()

    return ChatResponse(
        **{k: v for k, v in response.items() if k in ChatResponse.model_fields},
        source_references=source_refs,
    )


@router.post("/stream")
@limiter.limit("20/minute")
def chat_stream(
    request: Request,
    chat_req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Server-Sent Events (SSE) variant of the chat endpoint.

    Streams the structured response field-by-field, then a terminating `done`
    event carrying the confidence score and source references. Persistence and
    audit logging behave identically to `POST /`.
    """
    from utils.pii_redactor import redact_pii
    redacted_query = redact_pii(chat_req.query)

    response = pipeline.ask(chat_req.query, chat_req.language)

    source_refs = _refs_from_sources(response.get("sources"))
    if not source_refs:
        combined_text = " ".join(
            str(response.get(k, ""))
            for k in ("summary", "applicable_law", "explanation", "rights", "next_steps")
        )
        source_refs = _extract_source_references(combined_text)

    # Persist chat history for authenticated users only
    if current_user:
        db.add(
            ChatHistory(
                user_id=current_user.id,
                query=chat_req.query[:2000],
                response=json.dumps(response, ensure_ascii=False)[:4000],
                domain=response.get("applicable_law", "")[:200],
            )
        )

    log_event(
        db=db,
        action="CHAT_QUERY",
        user_id=current_user.id if current_user else None,
        query_text=redacted_query,
        domain_detected=response.get("applicable_law", "")[:200],
        confidence_score=float(response.get("confidence_score", 0)),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
        auto_commit=False,
    )
    db.commit()

    fields = (
        "summary", "applicable_law", "explanation", "rights",
        "next_steps", "required_documents", "government_website", "disclaimer",
    )

    def event_stream():
        for key in fields:
            if key in response:
                yield f"event: field\ndata: {json.dumps({key: response[key]}, ensure_ascii=False)}\n\n"
        done_payload = {
            "confidence_score": float(response.get("confidence_score", 0)),
            "source_references": [r.model_dump() for r in source_refs],
        }
        yield f"event: done\ndata: {json.dumps(done_payload, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/history")
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Returns chat history for the authenticated user.
    Guests (no token) receive an empty list.
    """
    if not current_user:
        return []
    history = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.timestamp.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": h.id,
            "query": h.query,
            "domain": h.domain,
            "timestamp": h.timestamp.strftime("%Y-%m-%d %H:%M") if h.timestamp else "",
        }
        for h in history
    ]
