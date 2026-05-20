from uuid import UUID
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Sequence

from .orm import InsightModel

class AnalyticsRepository:
    @staticmethod
    async def get_active_insights(user_id: UUID, db: AsyncSession) -> Sequence[InsightModel]:
        """Fetch non-dismissed insights for the user."""
        result = await db.execute(
            select(InsightModel)
            .where(InsightModel.user_id == user_id)
            .where(InsightModel.is_dismissed.is_(False))
            .where(InsightModel.deleted_at.is_(None))
            .order_by(InsightModel.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def update_insight_feedback(
        insight_id: UUID,
        user_id: UUID,
        score: int,
        dismiss: bool,
        db: AsyncSession,
    ) -> int:
        """Update feedback score and dismiss status."""
        result = await db.execute(
            update(InsightModel)
            .where(InsightModel.id == insight_id)
            .where(InsightModel.user_id == user_id)
            .where(InsightModel.deleted_at.is_(None))
            .values(feedback_score=score, is_dismissed=dismiss)
        )
        return result.rowcount  # type: ignore[return-value]

    @staticmethod
    async def get_insight_by_id(
        insight_id: UUID, user_id: UUID, db: AsyncSession
    ) -> InsightModel | None:
        """Fetch an insight by ID to ensure it exists and belongs to the user."""
        result = await db.execute(
            select(InsightModel)
            .where(InsightModel.id == insight_id)
            .where(InsightModel.user_id == user_id)
            .where(InsightModel.deleted_at.is_(None))
        )
        return result.scalars().first()
