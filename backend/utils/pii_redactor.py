import re

def redact_pii(text: str) -> str:
    """
    Robust PII redactor.
    Redacts emails, phone numbers, Aadhaar, PAN, and common ID patterns.
    """
    if not text:
        return text

    # Email
    text = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', '[EMAIL_REDACTED]', text)

    # Phone Numbers (Handles 10 digits, optional +91 or 0 prefix)
    text = re.sub(r'(?:\+91|0)?[6-9]\d{9}', '[PHONE_REDACTED]', text)

    # Aadhaar (Handles with and without spaces)
    text = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[AADHAAR_REDACTED]', text)

    # PAN Card (Format: ABCDE1234F)
    text = re.sub(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', '[PAN_REDACTED]', text)

    return text

