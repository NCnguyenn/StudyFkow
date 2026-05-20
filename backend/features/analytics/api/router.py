"""
analytics — API Router

Endpoints:
  GET /analytics/summary   → AnalyticsSummary for the authenticated user
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_write_session
from backend.features.user_auth.api.dependencies import get_current_user
from backend.features.user_auth.domain.models import UserSummary
from ..domain import AnalyticsSummary
from ..application import service

router = APIRouter()


@router.get(
    "/analytics/summary",
    tags=["Analytics"],
    response_model=AnalyticsSummary,
    summary="Get analytics summary for the current user",
)
async def get_analytics_summary(
    current_user: UserSummary = Depends(get_current_user),
    db: AsyncSession = Depends(get_write_session),
) -> AnalyticsSummary:
    """
    Returns aggregated study statistics:
    - Total focus minutes (today & this week)
    - Current daily streak
    - 7-day daily trend (bar chart data)
    - Per-task time breakdown (donut chart data)
    """
    return await service.get_summary(user_id=current_user.user_id, db=db)


from ..domain import InsightResponse, InsightFeedbackRequest
from uuid import UUID

@router.get(
    "/insights",
    tags=["Insights"],
    response_model=list[InsightResponse],
    summary="Get non-dismissed insights for the current user",
)
async def get_insights(
    current_user: UserSummary = Depends(get_current_user),
    db: AsyncSession = Depends(get_write_session),
) -> list[InsightResponse]:
    """Returns a list of active insights for the user."""
    return await service.get_active_insights(user_id=current_user.user_id, db=db)

@router.post(
    "/insights/{insight_id}/feedback",
    tags=["Insights"],
    summary="Submit feedback or dismiss an insight",
)
async def submit_insight_feedback(
    insight_id: UUID,
    payload: InsightFeedbackRequest,
    current_user: UserSummary = Depends(get_current_user),
    db: AsyncSession = Depends(get_write_session),
) -> dict:
    """Updates feedback score and dismissal status for an insight."""
    await service.update_insight_feedback(
        insight_id=insight_id,
        user_id=current_user.user_id,
        score=payload.score,
        dismiss=payload.dismiss,
        db=db,
    )
    return {"status": "success"}

from fastapi import HTTPException, status
from backend.features.ai_pipeline.worker import generate_llm_insight

@router.post(
    "/insights/generate-llm",
    tags=["Insights"],
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger a manual AI analysis using the configured LLM provider"
)
async def trigger_llm_insight(
    current_user: UserSummary = Depends(get_current_user),
    db: AsyncSession = Depends(get_write_session),
) -> dict:
    """
    Checks if the user has enough sessions (>= 10) and then enqueues a background
    task to generate an LLM insight based on their recent activity.
    """
    summary = await service.get_summary(user_id=current_user.user_id, db=db)
    
    if summary.total_sessions_completed < 10:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You need at least 10 completed sessions to unlock deep AI analysis."
        )
        
    generate_llm_insight.delay(user_id_str=str(current_user.user_id))
    
    return {
        "success": True,
        "data": {"status": "processing"}
    }
