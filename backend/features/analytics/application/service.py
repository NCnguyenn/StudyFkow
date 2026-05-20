"""
analytics — Service Layer

All database aggregation queries live here.

Session states counted as "study time":
  - COMPLETED   → full actual_duration_seconds
  - INTERRUPTED → partial duration_seconds (best server estimate)

PENDING / ACTIVE / PAUSED sessions are in-flight and excluded from analytics
to avoid double-counting a session the user might still be working in.

Timezone policy:
  All raw timestamps are stored as UTC in Postgres.
  The service performs all date bucketing in UTC.
  The frontend is responsible for local-timezone display if needed.
"""

from uuid import UUID
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select, func, case, and_, text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.features.study_sessions.infrastructure.orm import SessionModel
from backend.features.task_management.infrastructure.orm import TaskModel, TaskCategoryModel
from ..infrastructure.repository import AnalyticsRepository
from ..domain import AnalyticsSummary, DailyTrendPoint, TaskBreakdown, InsightResponse, TaskMastery, SubjectBalance


# States whose duration_seconds is fully finalised on the server
_COUNTED_STATES = ("COMPLETED", "INTERRUPTED")

async def get_summary(user_id: UUID, db: AsyncSession) -> AnalyticsSummary:
    """
    Aggregate focus statistics for the authenticated user.

    Returns:
        AnalyticsSummary with today/week totals, 7-day trend, and per-task
        breakdown — all in minutes (float).
    """
    now_utc = datetime.now(timezone.utc)
    today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())  # Monday
    trend_start = today_start - timedelta(days=6)  # 7 days including today

    # ── 1. Total minutes TODAY ────────────────────────────────────────────────
    today_result = await db.execute(
        select(func.coalesce(func.sum(SessionModel.duration_seconds), 0))
        .where(
            SessionModel.user_id == user_id,
            SessionModel.status.in_(_COUNTED_STATES),
            SessionModel.deleted_at.is_(None),
            SessionModel.created_at >= today_start,
        )
    )
    total_seconds_today = float(today_result.scalar() or 0)

    # ── 2. Total minutes THIS WEEK ────────────────────────────────────────────
    week_result = await db.execute(
        select(func.coalesce(func.sum(SessionModel.duration_seconds), 0))
        .where(
            SessionModel.user_id == user_id,
            SessionModel.status.in_(_COUNTED_STATES),
            SessionModel.deleted_at.is_(None),
            SessionModel.created_at >= week_start,
        )
    )
    total_seconds_week = float(week_result.scalar() or 0)

    # ── 3. Current streak (consecutive days with ≥1 completed session) ────────
    streak = await _compute_streak(user_id, today_start, db)

    # ── 3.5 Total sessions completed ──────────────────────────────────────────
    total_sessions_result = await db.execute(
        select(func.count(SessionModel.id))
        .where(
            SessionModel.user_id == user_id,
            SessionModel.status.in_(_COUNTED_STATES),
            SessionModel.deleted_at.is_(None),
        )
    )
    total_sessions_completed = int(total_sessions_result.scalar() or 0)

    # ── 4. Daily trend — last 7 days ──────────────────────────────────────────
    # Use Postgres date_trunc to bucket by day
    daily_stmt = (
        select(
            func.date_trunc("day", SessionModel.created_at).label("day"),
            func.coalesce(func.sum(SessionModel.duration_seconds), 0).label("secs"),
        )
        .where(
            SessionModel.user_id == user_id,
            SessionModel.status.in_(_COUNTED_STATES),
            SessionModel.deleted_at.is_(None),
            SessionModel.created_at >= trend_start,
        )
        .group_by(text("day"))
        .order_by(text("day"))
    )
    daily_rows = (await db.execute(daily_stmt)).all()

    # Build a dict keyed by ISO date string so we can fill gaps
    daily_map: dict[str, float] = {}
    for row in daily_rows:
        day_key = row.day.date().isoformat()
        daily_map[day_key] = float(row.secs) / 60.0

    daily_trend: list[DailyTrendPoint] = []
    for offset in range(7):
        d = (trend_start + timedelta(days=offset)).date()
        daily_trend.append(
            DailyTrendPoint(date=d.isoformat(), minutes=round(daily_map.get(d.isoformat(), 0.0), 1))
        )

    # ── 5. Per-task breakdown ─────────────────────────────────────────────────
    breakdown_stmt = (
        select(
            SessionModel.task_id,
            func.coalesce(TaskModel.title, "Unlinked Sessions").label("title"),
            func.coalesce(TaskModel.color_code, "#94a3b8").label("color_code"),
            func.coalesce(func.sum(SessionModel.duration_seconds), 0).label("secs"),
        )
        .outerjoin(TaskModel, SessionModel.task_id == TaskModel.id)
        .where(
            SessionModel.user_id == user_id,
            SessionModel.status.in_(_COUNTED_STATES),
            SessionModel.deleted_at.is_(None),
        )
        .group_by(SessionModel.task_id, TaskModel.title, TaskModel.color_code)
        .order_by(text("secs DESC"))
    )
    breakdown_rows = (await db.execute(breakdown_stmt)).all()

    task_breakdown: list[TaskBreakdown] = [
        TaskBreakdown(
            task_id=str(row.task_id) if row.task_id else None,
            title=row.title,
            color_code=row.color_code,
            minutes=round(float(row.secs) / 60.0, 1),
        )
        for row in breakdown_rows
        if float(row.secs) > 0  # omit zero-duration rows
    ]

    # ── 6. Task Mastery ───────────────────────────────────────────────────────
    mastery_stmt = select(
        func.count().filter(TaskModel.completion_status == "ON_TIME").label("on_time"),
        func.count().filter(TaskModel.completion_status == "LATE").label("late"),
        func.count().filter(TaskModel.completion_status == "INCOMPLETE").label("incomplete"),
    ).where(TaskModel.user_id == user_id, TaskModel.is_deleted == False)
    
    mastery_row = (await db.execute(mastery_stmt)).one()
    task_mastery = TaskMastery(
        on_time=mastery_row.on_time or 0,
        late=mastery_row.late or 0,
        incomplete=mastery_row.incomplete or 0
    )

    # ── 7. Subject Balance ────────────────────────────────────────────────────
    balance_stmt = (
        select(
            func.coalesce(TaskCategoryModel.name, "Uncategorized").label("category_name"),
            func.coalesce(TaskCategoryModel.color_code, "#94a3b8").label("color_code"),
            func.coalesce(func.sum(SessionModel.duration_seconds), 0).label("secs")
        )
        .outerjoin(TaskModel, SessionModel.task_id == TaskModel.id)
        .outerjoin(TaskCategoryModel, TaskModel.category_id == TaskCategoryModel.id)
        .where(
            SessionModel.user_id == user_id,
            SessionModel.status.in_(_COUNTED_STATES),
            SessionModel.deleted_at.is_(None)
        )
        .group_by(TaskCategoryModel.name, TaskCategoryModel.color_code)
    )
    balance_rows = (await db.execute(balance_stmt)).all()
    
    total_secs_all_categories = sum(float(row.secs) for row in balance_rows)
    subject_balance = []
    if total_secs_all_categories > 0:
        subject_balance = [
            SubjectBalance(
                category_name=row.category_name,
                color_code=row.color_code,
                percentage=round((float(row.secs) / total_secs_all_categories) * 100, 1)
            )
            for row in balance_rows if float(row.secs) > 0
        ]

    return AnalyticsSummary(
        total_minutes_today=round(total_seconds_today / 60.0, 1),
        total_minutes_this_week=round(total_seconds_week / 60.0, 1),
        current_streak_days=streak,
        total_sessions_completed=total_sessions_completed,
        daily_trend=daily_trend,
        task_breakdown=task_breakdown,
        task_mastery=task_mastery,
        subject_balance=subject_balance,
    )


async def _compute_streak(user_id: UUID, today_start: datetime, db: AsyncSession) -> int:
    """
    Walk backwards from today counting consecutive days that have ≥1
    counted session.  Stops on the first gap day.
    """
    stmt = (
        select(func.date_trunc("day", SessionModel.created_at).label("day"))
        .where(
            SessionModel.user_id == user_id,
            SessionModel.status.in_(_COUNTED_STATES),
            SessionModel.deleted_at.is_(None),
        )
        .group_by(text("day"))
        .order_by(text("day DESC"))
    )
    rows = (await db.execute(stmt)).scalars().all()
    active_days = {r.date() for r in rows}

    streak = 0
    cursor = today_start.date()
    while cursor in active_days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


async def get_active_insights(user_id: UUID, db: AsyncSession) -> list[InsightResponse]:
    """Fetch non-dismissed insights for the user and return domain models."""
    models = await AnalyticsRepository.get_active_insights(user_id=user_id, db=db)
    return [
        InsightResponse(
            id=str(m.id),
            insight_type=m.insight_type,
            content=m.content,
            feedback_score=m.feedback_score,
        )
        for m in models
    ]

async def update_insight_feedback(
    insight_id: UUID,
    user_id: UUID,
    score: int,
    dismiss: bool,
    db: AsyncSession,
) -> None:
    """Update feedback score and dismiss status."""
    await AnalyticsRepository.update_insight_feedback(
        insight_id=insight_id,
        user_id=user_id,
        score=score,
        dismiss=dismiss,
        db=db,
    )
    await db.commit()
