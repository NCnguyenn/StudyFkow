import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from uuid import uuid4

from backend.features.chat.rag_service import ask_second_brain

@pytest.mark.asyncio
@patch("backend.features.chat.rag_service.get_llm_provider")
@patch("backend.features.chat.rag_service._get_collection")
@patch("backend.features.chat.rag_service.select")
async def test_ask_second_brain(mock_select, mock_get_collection, mock_get_provider):
    mock_db = AsyncMock()
    user_id = str(uuid4())

    mock_user = MagicMock()
    mock_user.llm_provider = "GEMINI"
    mock_user.llm_api_key = "test"

    mock_result = MagicMock()
    mock_result.scalars().first.return_value = mock_user
    mock_db.execute.return_value = mock_result

    mock_collection = MagicMock()
    mock_collection.query.return_value = {
        "documents": [["Doc 1", "Doc 2"]],
        "metadatas": [[{"title": "Note 1"}, {"title": "Note 2"}]]
    }
    mock_get_collection.return_value = mock_collection

    mock_provider = AsyncMock()
    mock_provider.generate_chat_response.return_value = "This is the answer."
    mock_get_provider.return_value = mock_provider

    answer = await ask_second_brain(user_id, "What is X?", mock_db)

    assert "This is the answer." in answer
    mock_provider.generate_chat_response.assert_called_once()
