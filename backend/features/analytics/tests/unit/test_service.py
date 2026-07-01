import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4
from datetime import datetime, timezone, timedelta

from backend.features.analytics.application.service import get_summary, _compute_streak, get_active_insights, update_insight_feedback
from backend.features.analytics.domain import AnalyticsSummary

@pytest.mark.asyncio
async def test_get_summary():
    mock_db = AsyncMock()
    user_id = uuid4()

    call_count = 0
    def side_effect_execute(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        mock_result = MagicMock()

        if call_count == 1:
            mock_result.scalar.return_value = 1200 # 20 mins today
        elif call_count == 2:
            mock_result.scalar.return_value = 3600 # 60 mins this week
        elif call_count == 3:
            class MockRow:
                def date(self):
                    return datetime.now(timezone.utc).date()
            mock_result.scalars().all.return_value = [MockRow()]
        elif call_count == 4:
            mock_result.scalar.return_value = 3 # 3 sessions completed
        elif call_count == 5:
            class MockDailyRow:
                def __init__(self):
                    self.day = datetime.now(timezone.utc)
                    self.secs = 1200
            mock_result.all.return_value = [MockDailyRow()]
        elif call_count == 6:
            class MockTaskRow:
                def __init__(self):
                    self.task_id = uuid4()
                    self.title = "Task 1"
                    self.color_code = "#ffffff"
                    self.secs = 1200
            mock_result.all.return_value = [MockTaskRow()]
        elif call_count == 7:
            class MockMasteryRow:
                def __init__(self):
                    self.on_time = 1
                    self.late = 0
                    self.incomplete = 0
            mock_result.one.return_value = MockMasteryRow()
        elif call_count == 8:
            class MockSubjectRow:
                def __init__(self):
                    self.category_name = "Math"
                    self.color_code = "#000000"
                    self.secs = 1200
            mock_result.all.return_value = [MockSubjectRow()]

        return mock_result

    mock_db.execute.side_effect = side_effect_execute

    summary = await get_summary(user_id, mock_db)

    assert summary.total_minutes_today == 20.0
    assert summary.total_minutes_this_week == 60.0
    assert summary.current_streak_days == 1
    assert summary.total_sessions_completed == 3
    assert len(summary.task_breakdown) == 1
    assert summary.task_breakdown[0].title == "Task 1"
    assert summary.task_mastery.on_time == 1
    assert len(summary.subject_balance) == 1
    assert summary.subject_balance[0].category_name == "Math"

@pytest.mark.asyncio
async def test_compute_streak():
    mock_db = AsyncMock()
    user_id = uuid4()

    mock_result = MagicMock()

    class MockRow:
        def __init__(self, days_ago):
            self._date = (datetime.now(timezone.utc) - timedelta(days=days_ago)).date()
        def date(self):
            return self._date

    mock_result.scalars().all.return_value = [MockRow(0), MockRow(1), MockRow(3)]
    mock_db.execute.return_value = mock_result

    streak = await _compute_streak(user_id, datetime.now(timezone.utc), mock_db)

    assert streak == 2 # days 0 and 1

@pytest.mark.asyncio
@patch("backend.features.analytics.application.service.AnalyticsRepository")
async def test_get_active_insights(mock_repo):
    mock_db = AsyncMock()
    user_id = uuid4()

    class MockInsightModel:
        def __init__(self):
            self.id = uuid4()
            self.insight_type = "RULE_BASED"
            self.content = "Content"
            self.feedback_score = 0

    mock_repo.get_active_insights = AsyncMock(return_value=[MockInsightModel()])

    result = await get_active_insights(user_id, mock_db)

    assert len(result) == 1
    assert result[0].content == "Content"

@pytest.mark.asyncio
@patch("backend.features.analytics.application.service.AnalyticsRepository")
async def test_update_insight_feedback(mock_repo):
    mock_db = AsyncMock()
    insight_id = uuid4()
    user_id = uuid4()

    mock_repo.update_insight_feedback = AsyncMock()

    await update_insight_feedback(insight_id, user_id, 1, False, mock_db)

    mock_repo.update_insight_feedback.assert_called_once_with(insight_id=insight_id, user_id=user_id, score=1, dismiss=False, db=mock_db)
    mock_db.commit.assert_called_once()
