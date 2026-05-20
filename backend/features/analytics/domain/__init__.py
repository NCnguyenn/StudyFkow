"""
analytics — Domain Models

Pydantic response shapes for the Analytics summary endpoint.
All durations are expressed in SECONDS server-side; the frontend
converts to minutes/hours for display.
"""

from pydantic import BaseModel
from typing import Optional


class DailyTrendPoint(BaseModel):
    """One day's aggregate for the 7-day trend chart."""
    date: str          # ISO-8601 date  "2026-05-11"
    minutes: float     # total focused minutes (completed + interrupted sessions)


class TaskBreakdown(BaseModel):
    """Per-task focus time for the donut chart."""
    task_id: Optional[str] = None   # None = unlinked sessions bucket
    title: str                       # task title or "Unlinked Sessions"
    color_code: Optional[str] = None # pastel hex from tasks table
    minutes: float


class TaskMastery(BaseModel):
    """Task completion metrics based on completion_status."""
    on_time: int
    late: int
    incomplete: int


class SubjectBalance(BaseModel):
    """Percentage of study time dedicated to each subject category."""
    category_name: str
    color_code: str
    percentage: float


class AnalyticsSummary(BaseModel):
    """Top-level analytics payload returned by GET /api/v1/analytics/summary."""
    total_minutes_today: float
    total_minutes_this_week: float
    current_streak_days: int
    total_sessions_completed: int
    daily_trend: list[DailyTrendPoint]    # 7 entries (oldest → newest)
    task_breakdown: list[TaskBreakdown]   # sorted descending by minutes
    task_mastery: TaskMastery
    subject_balance: list[SubjectBalance]


class InsightResponse(BaseModel):
    id: str
    insight_type: str
    content: str
    feedback_score: int


class InsightFeedbackRequest(BaseModel):
    score: int
    dismiss: bool
