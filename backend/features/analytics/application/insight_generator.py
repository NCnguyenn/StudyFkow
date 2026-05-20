from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.features.study_sessions.infrastructure.orm import SessionModel
from backend.features.analytics.infrastructure.orm import InsightModel
from backend.app.core.database import _async_session_factory

async def generate_rule_based_insights(user_id: UUID):
    """
    Analyzes user sessions and generates rule-based insights.
    Runs non-blocking via FastAPI BackgroundTasks.
    """
    async with _async_session_factory() as db:
        # Fetch all counted sessions for the user, sorted by created_at DESC
        _COUNTED_STATES = ("COMPLETED", "INTERRUPTED")
    
        sessions_result = await db.execute(
            select(SessionModel)
            .where(
                SessionModel.user_id == user_id,
                SessionModel.status.in_(_COUNTED_STATES),
                SessionModel.deleted_at.is_(None),
            )
            .order_by(SessionModel.created_at.desc())
        )
        sessions = sessions_result.scalars().all()

        if not sessions:
            return

        new_insights_to_add = []

        # Helper function to check if insight already exists and is not dismissed
        async def insight_exists(content: str) -> bool:
            result = await db.execute(
                select(InsightModel)
                .where(
                    InsightModel.user_id == user_id,
                    InsightModel.insight_type == "RULE_BASED",
                    InsightModel.content == content,
                    InsightModel.is_dismissed.is_(False),
                    InsightModel.deleted_at.is_(None)
                )
            )
            return result.scalars().first() is not None


        # RULE 1: Burnout Warning
        # If the last completed session was > 120 minutes with 0 pauses
        last_session = sessions[0]
        if last_session.duration_seconds > 120 * 60:
            # Check pauses
            # Using SessionModel.pauses which is a list of dicts or SessionPause models if loaded
            # Since pauses is a relationship, we can just check pause_count
            pause_count = len(last_session.pauses) if last_session.pauses else 0
            if pause_count == 0:
                burnout_content = "Marathon sessions can reduce retention. Try using the Pomodoro technique (25m focus, 5m break)."
                if not await insight_exists(burnout_content):
                    new_insights_to_add.append(InsightModel(
                        user_id=user_id,
                        insight_type="RULE_BASED",
                        content=burnout_content,
                    ))

        # RULE 2: Time Optimizer
        # If > 60% of their completed sessions started between 05:00 and 11:59 UTC (must have at least 3 total sessions)
        if len(sessions) >= 3:
            morning_count = 0
            for s in sessions:
                # s.created_at is a timezone-aware datetime in UTC
                if s.created_at.tzinfo is None:
                    dt_utc = s.created_at.replace(tzinfo=timezone.utc)
                else:
                    dt_utc = s.created_at.astimezone(timezone.utc)
                
                if 5 <= dt_utc.hour <= 11:
                    morning_count += 1
            
            if morning_count / len(sessions) > 0.6:
                optimizer_content = "Data shows you have a strong focus bias in the mornings. Try scheduling your hardest tasks before noon."
                if not await insight_exists(optimizer_content):
                    new_insights_to_add.append(InsightModel(
                        user_id=user_id,
                        insight_type="RULE_BASED",
                        content=optimizer_content,
                    ))

        if new_insights_to_add:
            db.add_all(new_insights_to_add)
            await db.commit()

