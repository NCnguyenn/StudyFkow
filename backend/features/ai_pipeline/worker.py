import asyncio
import json
from uuid import UUID
from backend.app.core.celery_app import celery_app, REDIS_URL
from backend.app.core.database import _async_session_factory
from sqlalchemy import select
import redis.asyncio as aioredis

from backend.features.user_auth.infrastructure.orm import UserModel
from backend.features.analytics.infrastructure.orm import InsightModel
from .application.factory import get_llm_provider
from .application.prompt_builder import build_user_context

async def _generate_llm_insight_async(user_id: UUID):
    async with _async_session_factory() as db:
        # Fetch user settings
        user_result = await db.execute(select(UserModel).where(UserModel.id == user_id))
        user = user_result.scalars().first()
        if not user:
            return

        # Fetch optimized context
        context = await build_user_context(user_id, db)

        # Skip if minimum sessions not met (cold-start threshold is 10)
        if context["summary"]["total_sessions"] < 10:
            return

        # Initialize provider
        provider = get_llm_provider(user.llm_provider, user.llm_api_key)

        # Generate insight
        insight_text = await provider.generate_insight(context)
        
        # Don't save empty/error responses if generation fails
        if insight_text.startswith("Error"):
            print(f"Insight Generation Failed: {insight_text}")
            return

        # Insert insight into DB
        new_insight = InsightModel(
            user_id=user_id,
            insight_type="LLM",
            content=insight_text
        )
        db.add(new_insight)
        await db.commit()

@celery_app.task(name="ai_pipeline.generate_llm_insight", acks_late=True)
def generate_llm_insight(user_id_str: str):
    """
    Celery task that orchestrates fetching user context and generating
    an LLM insight via the configured provider.
    """
    user_id = UUID(user_id_str)
    asyncio.run(_generate_llm_insight_async(user_id))


# ---------------------------------------------------------------------------
# Voice Memo → Note pipeline
# ---------------------------------------------------------------------------

async def _process_voice_memo_async(user_id: UUID, audio_file_path: str) -> None:
    from backend.features.notes.infrastructure.models import NoteModel
    """
    Async implementation of voice memo processing.

    Steps:
      1. Simulate transcription with asyncio.sleep (real Whisper call goes here later).
      2. Persist a new NoteModel row with the transcription result.
      3. Publish a VOICE_NOTE_READY event to the user's Redis channel so the
         SSE stream can forward it to the connected browser in real time.
    """
    raise NotImplementedError("Voice transcription is not yet implemented")

    # --- Step 1: Simulate heavy AI transcription ---
    await asyncio.sleep(3)
    mock_transcript = f"[Voice note from {audio_file_path}] — Transcription placeholder."

    # --- Step 2: Persist note ---
    note_id: str
    async with _async_session_factory() as db:
        new_note = NoteModel(
            user_id=user_id,
            title="Voice Note",
            content_json={"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": mock_transcript}]}]},
            content_markdown=mock_transcript,
        )
        db.add(new_note)
        await db.commit()
        await db.refresh(new_note)
        note_id = str(new_note.id)

    # --- Step 3: Publish to Redis Pub/Sub ---
    redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
    try:
        channel = f"channel:user_events:{user_id}"
        payload = json.dumps({"type": "VOICE_NOTE_READY", "note_id": note_id})
        await redis_client.publish(channel, payload)
    finally:
        await redis_client.aclose()


@celery_app.task(name="ai_pipeline.process_voice_memo", acks_late=True)
def process_voice_memo(user_id_str: str, audio_file_path: str) -> None:
    """
    Celery task: transcribe a voice memo and notify the frontend via SSE.

    Called immediately with .delay() after the audio file is saved, so the
    HTTP endpoint can return 202 Accepted without blocking.
    """
    user_id = UUID(user_id_str)
    asyncio.run(_process_voice_memo_async(user_id, audio_file_path))


# ---------------------------------------------------------------------------
# Vector DB — Note Embedding Pipeline (ChromaDB)
# ---------------------------------------------------------------------------

import chromadb
from typing import Optional

_chroma_client: Optional[chromadb.ClientAPI] = None
_CHROMA_PERSIST_DIR = "./chroma_data"
_COLLECTION_NAME = "studyflow_notes"
_CHUNK_SIZE = 500  # characters per chunk


def _get_chroma_collection() -> chromadb.Collection:
    """
    Lazy-initialize the ChromaDB PersistentClient.
    Safe for Celery prefork: each worker process gets its own client
    instance after the fork — no shared state corruption.
    """
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=_CHROMA_PERSIST_DIR)
    return _chroma_client.get_or_create_collection(
        name=_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


def _chunk_text(text: str, chunk_size: int = _CHUNK_SIZE) -> list[str]:
    """Split text into chunks, preferring double-newline boundaries."""
    if not text or not text.strip():
        return []

    # Try splitting on paragraph boundaries first
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    chunks: list[str] = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) + 2 <= chunk_size:
            current = f"{current}\n\n{para}" if current else para
        else:
            if current:
                chunks.append(current)
            # If a single paragraph exceeds chunk_size, hard-split it
            while len(para) > chunk_size:
                chunks.append(para[:chunk_size])
                para = para[chunk_size:]
            current = para

    if current:
        chunks.append(current)

    return chunks


@celery_app.task(name="ai_pipeline.embed_note_to_vector_db", acks_late=True)
def embed_note_to_vector_db(
    note_id: str, user_id: str, content: str, title: str
) -> None:
    """
    Celery task: chunk a note's text content and upsert into ChromaDB.

    Each chunk gets a deterministic ID `{note_id}_chunk_{i}` so repeated
    saves of the same note overwrite stale embeddings (idempotent upsert).
    Metadata includes user_id for strict tenant isolation at query time.
    """
    collection = _get_chroma_collection()

    chunks = _chunk_text(content)
    if not chunks:
        # Note has no meaningful text — remove any old embeddings
        try:
            existing = collection.get(where={"note_id": note_id})
            if existing and existing["ids"]:
                collection.delete(ids=existing["ids"])
        except Exception:
            pass
        return

    ids = [f"{note_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {"user_id": user_id, "note_id": note_id, "title": title}
        for _ in chunks
    ]

    # Upsert: if chunk IDs already exist they are overwritten
    collection.upsert(
        ids=ids,
        documents=chunks,
        metadatas=metadatas,  # type: ignore
    )

    # Clean up orphaned chunks from previous saves with more chunks
    try:
        existing = collection.get(where={"note_id": note_id})
        orphan_ids = [eid for eid in existing["ids"] if eid not in set(ids)]
        if orphan_ids:
            collection.delete(ids=orphan_ids)
    except Exception:
        pass

