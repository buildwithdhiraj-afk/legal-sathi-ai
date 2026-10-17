import json
import os
import sys

# Add backend to sys path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.embeddings import get_vector_store
from rag.legal_engine import DOMAINS, ACTS_PATH, SECTIONS_PATH


def _load_json(path):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def populate():
    vector_store = get_vector_store(persist_directory="./chroma")

    documents, metadatas, ids = [], [], []

    # 1. Domain summaries (used by detect_domain for semantic matching).
    for i, domain in enumerate(DOMAINS):
        documents.append(f"{domain['name']}. {domain['summary']} {domain['explanation']}")
        metadatas.append({"name": domain["name"], "kb_act_id": domain.get("kb_act_id") or ""})
        ids.append(f"domain_{i}")

    # 2. Individual statutory sections (used by retrieve_sections).
    acts_by_id = {a.get("id"): a for a in _load_json(ACTS_PATH)}
    for i, section in enumerate(_load_json(SECTIONS_PATH)):
        act = acts_by_id.get(section.get("act_id"), {})
        documents.append(
            f"{act.get('title', '')} {section.get('section_number', '')} "
            f"{section.get('title', '')}: {section.get('content', '')}"
        )
        metadatas.append({
            "act_id": section.get("act_id"),
            "act_title": act.get("title", ""),
            "section_number": section.get("section_number", ""),
            "title": section.get("title", ""),
            "punishment": section.get("punishment", ""),
            "url": act.get("government_link"),
        })
        ids.append(f"section_{i}")

    vector_store.add_texts(texts=documents, metadatas=metadatas, ids=ids)
    print(f"Successfully added {len(documents)} documents to ChromaDB.")


if __name__ == "__main__":
    populate()
