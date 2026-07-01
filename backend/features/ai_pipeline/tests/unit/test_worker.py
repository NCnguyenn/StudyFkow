import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from uuid import uuid4

@pytest.mark.asyncio
async def test_generate_llm_insight_async_success():
    with patch("backend.features.ai_pipeline.worker._async_session_factory") as mock_session_factory, \
         patch("backend.features.ai_pipeline.worker.build_user_context") as mock_build_context, \
         patch("backend.features.ai_pipeline.worker.get_llm_provider") as mock_get_provider:

        from backend.features.ai_pipeline.worker import _generate_llm_insight_async

        mock_db = AsyncMock()
        mock_session_factory.return_value.__aenter__.return_value = mock_db

        mock_user = MagicMock()
        mock_user.llm_provider = "GEMINI"
        mock_user.llm_api_key = "test"

        mock_result = MagicMock()
        mock_result.scalars().first.return_value = mock_user
        mock_db.execute.return_value = mock_result

        mock_build_context.return_value = {
            "summary": {"total_sessions": 15},
            "recent_sessions": [],
            "negative_constraints": []
        }

        mock_provider = AsyncMock()
        mock_provider.generate_insight.return_value = "Great job!"
        mock_get_provider.return_value = mock_provider

        await _generate_llm_insight_async(uuid4())

        mock_provider.generate_insight.assert_called_once()
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

@pytest.mark.asyncio
async def test_generate_llm_insight_async_insufficient_sessions():
    with patch("backend.features.ai_pipeline.worker._async_session_factory") as mock_session_factory, \
         patch("backend.features.ai_pipeline.worker.build_user_context") as mock_build_context:

        from backend.features.ai_pipeline.worker import _generate_llm_insight_async

        mock_db = AsyncMock()
        mock_session_factory.return_value.__aenter__.return_value = mock_db

        mock_user = MagicMock()
        mock_result = MagicMock()
        mock_result.scalars().first.return_value = mock_user
        mock_db.execute.return_value = mock_result

        mock_build_context.return_value = {
            "summary": {"total_sessions": 5},
        }

        await _generate_llm_insight_async(uuid4())

        mock_db.add.assert_not_called()

def test_generate_llm_insight_sync_wrapper():
    with patch("backend.features.ai_pipeline.worker.asyncio.run") as mock_run:
        from backend.features.ai_pipeline.worker import generate_llm_insight
        user_id = uuid4()
        generate_llm_insight(str(user_id))
        mock_run.assert_called_once()

def test_chunk_text():
    from backend.features.ai_pipeline.worker import _chunk_text
    res = _chunk_text("hello\n\nworld", 100)
    assert len(res) == 1

    res = _chunk_text("hello\n\nworld", 5)
    assert len(res) == 2

@patch("backend.features.ai_pipeline.worker._get_chroma_collection")
def test_embed_note_to_vector_db(mock_get_collection):
    mock_collection = MagicMock()
    mock_collection.get.return_value = {"ids": []}
    mock_get_collection.return_value = mock_collection

    from backend.features.ai_pipeline.worker import embed_note_to_vector_db
    embed_note_to_vector_db("note1", "user1", "test content", "title")

    mock_collection.upsert.assert_called_once()
