"""
Audit Logger Utility — LegalSathi AI
Logs every query and admin action to the `audit_logs` database table.
Designed to be used as a FastAPI dependency or a utility function.
"""
from __future__ import annotations

from typing import Optional
from sqlalchemy.orm import Session
from database.models import AuditLog


def log_event(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    query_text: Optional[str] = None,
    domain_detected: Optional[str] = None,
    confidence_score: Optional[float] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    auto_commit: bool = True,
) -> AuditLog:
    """
    Persist an audit event to the database.

    Parameters
    ----------
    db              : Active SQLAlchemy session.
    action          : Event name (e.g. 'CHAT_QUERY', 'LOGIN', 'ADMIN_LOGIN').
    user_id         : ID of the acting user. None for guest / anonymous.
    query_text      : PII-redacted text of the user's query (max 1000 chars).
    domain_detected : Legal domain detected by the RAG engine.
    confidence_score: Float confidence value from the RAG response.
    ip_address      : Client IP from the HTTP request.
    user_agent      : Client user-agent header.
    auto_commit     : If True, commit immediately. Set False when the caller
                      already manages the transaction.

    Returns
    -------
    The persisted AuditLog ORM instance.
    """
    entry = AuditLog(
        user_id=user_id,
        action=action,
        query_text=(query_text or "")[:1000] if query_text else None,
        domain_detected=domain_detected,
        confidence_score=str(confidence_score) if confidence_score is not None else None,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(entry)
    if auto_commit:
        db.commit()
        db.refresh(entry)
    return entry


def get_client_ip(request) -> Optional[str]:
    """Extract the client IP from a FastAPI Request, resisting spoofing.

    X-Forwarded-For is client-controllable. We only trust it when the number
    of front proxies is known (TRUSTED_PROXY_COUNT). In that case the real
    client IP is the entry N positions from the right of the header chain.
    Otherwise we fall back to the direct peer address.
    """
    from config.settings import settings

    direct = request.client.host if request.client else None
    trusted = settings.TRUSTED_PROXY_COUNT

    if trusted and trusted > 0:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            parts = [p.strip() for p in forwarded_for.split(",") if p.strip()]
            if parts:
                # The rightmost `trusted` entries are added by our proxies;
                # the real client sits just to the left of them.
                index = len(parts) - trusted
                if index >= 0:
                    return parts[index]
                return parts[0]
    return direct


def get_user_agent(request) -> Optional[str]:
    """Extract User-Agent header from a FastAPI Request object."""
    return request.headers.get("User-Agent")
