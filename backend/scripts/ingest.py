import os
import json
from rag.embeddings import get_vector_store # Assuming this utility exists

# Path setup
RAW_DOCS_DIR = os.path.join(os.path.dirname(__file__), "..", "knowledge_base", "raw_docs")
VECTOR_STORE_DIR = os.path.join(os.path.dirname(__file__), "..", "chroma")

def ingest_documents():
    print("Starting ingestion...")
    if not os.path.exists(RAW_DOCS_DIR):
        print(f"Please create {RAW_DOCS_DIR} and add your text files.")
        return

    # Initialize vector store
    vector_store = get_vector_store(VECTOR_STORE_DIR)
    
    # Process files
    for filename in os.listdir(RAW_DOCS_DIR):
        if filename.endswith(".txt"):
            print(f"Processing {filename}...")
            with open(os.path.join(RAW_DOCS_DIR, filename), "r", encoding="utf-8") as f:
                content = f.read()
                # Simple chunking by paragraph (can be improved)
                chunks = [p.strip() for p in content.split("\n\n") if p.strip()]
                
                # Add to vector store
                vector_store.add_texts(chunks, metadatas=[{"source": filename} for _ in chunks])
                
    print("Ingestion complete. Vector store updated.")

if __name__ == "__main__":
    ingest_documents()
