"""
RAG (Retrieval-Augmented Generation) service for the Second Brain chatbot.

Queries the ChromaDB vector store filtered by user_id, constructs
a context-augmented prompt, and generates a grounded answer.
LLM integration is mocked with asyncio.sleep for now — swap in the
real provider from ai_pipeline.application.factory once ready.
"""

import asyncio
import logging
from typing import Optional

import chromadb

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy-initialized ChromaDB client (process-safe for Celery workers)
# ---------------------------------------------------------------------------
_chroma_client: Optional[chromadb.ClientAPI] = None
_CHROMA_PERSIST_DIR = "./chroma_data"
_COLLECTION_NAME = "studyflow_notes"


def _get_collection() -> chromadb.Collection:
    """Return the shared Chroma collection, initializing the client if needed."""
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=_CHROMA_PERSIST_DIR)
    return _chroma_client.get_or_create_collection(
        name=_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def ask_second_brain(user_id: str, query: str) -> str:
    """
    Answer a question using only the user's embedded notes.

    Steps:
      1. Query ChromaDB with user_id filter → top 3 chunks.
      2. Build a grounded prompt.
      3. Call the LLM (mocked for now).
      4. Return the answer with source citations.
    """
    collection = _get_collection()

    # --- 1. Retrieve relevant chunks ---
    try:
        results = collection.query(
            query_texts=[query],
            n_results=3,
            where={"user_id": user_id},
        )
    except Exception as exc:
        logger.warning("ChromaDB query failed (possibly empty collection): %s", exc)
        return (
            "I don't have any notes to reference yet. "
            "Start writing some notes and I'll be able to answer your questions!"
        )

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]

    if not documents:
        return (
            "I couldn't find any relevant notes for your question. "
            "Try rephrasing, or make sure you have notes on this topic."
        )

    # --- 2. Build context string with source attribution ---
    context_parts: list[str] = []
    cited_titles: set[str] = set()
    for doc, meta in zip(documents, metadatas):
        title = meta.get("title", "Untitled")
        cited_titles.add(title)
        context_parts.append(f"[Source: {title}]\n{doc}")

    context_block = "\n\n---\n\n".join(context_parts)

    prompt = (
        f"You are the user's personal study assistant. "
        f"Answer STRICTLY based on the following context from their notes.\n\n"
        f"Context:\n{context_block}\n\n"
        f"Question: {query}\n\n"
        f"Answer (cite which note(s) your answer is based on):"
    )

    # --- 3. Mock LLM call (replace with real provider later) ---
    logger.info("RAG prompt length: %d chars, sources: %s", len(prompt), cited_titles)
    await asyncio.sleep(2)  # Simulate LLM latency

    # --- 4. Construct mock response with citations ---
    citations = ", ".join(f'"{t}"' for t in sorted(cited_titles))
    mock_answer = (
        f"Based on your notes, here's what I found:\n\n"
        f"{documents[0][:300]}{'...' if len(documents[0]) > 300 else ''}\n\n"
        f"📚 Sources: {citations}"
    )

    return mock_answer
