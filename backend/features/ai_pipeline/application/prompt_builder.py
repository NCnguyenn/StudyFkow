from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timezone

from backend.features.study_sessions.infrastructure.orm import SessionModel
from backend.features.analytics.application.service import get_summary
from backend.features.analytics.infrastructure.orm import InsightModel

async def build_user_context(user_id: UUID, db: AsyncSession) -> dict:
    """
    Builds a token-optimized context payload for the LLM.
    Fetches the analytics summary and the last 10 completed sessions.
    Strips redundant metadata to save tokens.
    """
    summary = await get_summary(user_id, db)
    
    # Fetch last 10 completed sessions
    sessions_result = await db.execute(
        select(SessionModel)
        .where(
            SessionModel.user_id == user_id,
            SessionModel.status.in_(["COMPLETED", "INTERRUPTED"]),
            SessionModel.deleted_at.is_(None)
        )
        .order_by(SessionModel.created_at.desc())
        .limit(10)
    )
    sessions = sessions_result.scalars().all()
    
    # Compress sessions
    compressed_sessions = []
    for s in sessions:
        # Avoid astimezone if created_at is naive, but it should be timezone-aware
        if s.created_at.tzinfo is None:
            dt_utc = s.created_at.replace(tzinfo=timezone.utc)
        else:
            dt_utc = s.created_at.astimezone(timezone.utc)
            
        compressed_sessions.append({
            "title": s.title,
            "duration_m": round(s.duration_seconds / 60, 1),
            "status": s.status,
            "hour": dt_utc.hour
        })
        
    # Fetch negative feedback insights to suppress
    rejected_insights_result = await db.execute(
        select(InsightModel)
        .where(
            InsightModel.user_id == user_id,
            InsightModel.feedback_score == -1,
            InsightModel.deleted_at.is_(None)
        )
        .order_by(InsightModel.created_at.desc())
        .limit(5)
    )
    rejected_insights = [i.content for i in rejected_insights_result.scalars().all()]
        
    return {
        "summary": {
            "today_m": summary.total_minutes_today,
            "week_m": summary.total_minutes_this_week,
            "streak": summary.current_streak_days,
            "total_sessions": summary.total_sessions_completed
        },
        "recent_sessions": compressed_sessions,
        "negative_constraints": rejected_insights
    }
