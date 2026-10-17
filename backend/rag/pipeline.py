from rag.legal_engine import get_engine
from utils.pii_redactor import redact_pii


class RAGPipeline:
    def __init__(self):
        self.engine = get_engine()

    def ask(self, query: str, language: str = "en") -> dict:
        redacted_query = redact_pii(query)
        return self.engine.build_response(redacted_query, language=language)


pipeline = RAGPipeline()
