import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4
from datetime import datetime, timezone, timedelta

from backend.features.analytics.application.insight_generator import generate_rule_based_insights

@pytest.mark.asyncio
@patch("backend.features.analytics.application.insight_generator._async_session_factory")
async def test_generate_rule_based_insights(mock_session_factory):
    user_id = uuid4()

    mock_db = AsyncMock()
    mock_session_factory.return_value.__aenter__.return_value = mock_db

    call_count = 0
    def side_effect_execute(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        mock_result = MagicMock()

        if call_count == 1:
            class MockSession:
                def __init__(self, duration, hour, pauses):
                    self.duration_seconds = duration
                    self.created_at = datetime.now(timezone.utc).replace(hour=hour)
                    self.pauses = pauses

            mock_result.scalars().all.return_value = [
                MockSession(121 * 60, 8, []), # Last session > 120m, 0 pauses -> Burnout
                MockSession(60 * 60, 9, []), # morning
                MockSession(60 * 60, 10, []) # morning
            ]
        else:
            # insight_exists queries
            mock_result.scalars().first.return_value = None

        return mock_result

    mock_db.execute.side_effect = side_effect_execute

    await generate_rule_based_insights(user_id)

    assert mock_db.add_all.call_count == 1

    added_insights = mock_db.add_all.call_args[0][0]
    assert len(added_insights) == 2

    # 1 from rule 1, 1 from rule 2
    assert added_insights[0].content.startswith("Marathon sessions")
    assert added_insights[1].content.startswith("Data shows you have")

@pytest.mark.asyncio
@patch("backend.features.analytics.application.insight_generator._async_session_factory")
async def test_generate_rule_based_insights_no_sessions(mock_session_factory):
    user_id = uuid4()

    mock_db = AsyncMock()
    mock_session_factory.return_value.__aenter__.return_value = mock_db

    mock_result = MagicMock()
    mock_result.scalars().all.return_value = []
    mock_db.execute.return_value = mock_result

    await generate_rule_based_insights(user_id)

    mock_db.add_all.assert_not_called()
