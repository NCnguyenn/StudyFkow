"""
SQLAlchemy ORM models for the `sessions` and `session_pauses` tables.

These models are strict REFLECTIONS of the schema defined in the Phase 1
Alembic migration (2026_05_08_1445_initial_9_table_schema.py).

Column mapping — sessions table (migration → ORM):
  id                → id               (UUID PK)
  user_id           → user_id          (UUID FK → users.id)
  title             → title            (String 255)
  status            → status           (String 50, CHECK via enum)
  duration_seconds  → duration_seconds (Integer, default 0)
  last_seen_at      → last_seen_at     (TIMESTAMPTZ)
  created_at        → created_at       (TIMESTAMPTZ, auto)
  updated_at        → updated_at       (TIMESTAMPTZ, auto via trigger)
  deleted_at        → deleted_at       (TIMESTAMPTZ, soft-delete sentinel)

Column mapping — session_pauses table (migration → ORM):
  id                      → id                      (UUID PK)
  session_id              → session_id               (UUID FK → sessions.id)
  pause_duration_seconds  → pause_duration_seconds   (Integer, default 0)
  created_at              → created_at               (TIMESTAMPTZ, auto — acts as paused_at)
  updated_at              → updated_at               (TIMESTAMPTZ, auto via trigger — acts as resumed_at)
  deleted_at              → deleted_at               (TIMESTAMPTZ, soft-delete sentinel)
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    ForeignKey,
    text,
    ARRAY,
)
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


import traceback
import sys
from backend.app.core.base import Base
print(f"--- IMPORTING orm.py: __name__={__name__} ---", file=sys.stderr)
traceback.print_stack(file=sys.stderr)

class SessionModel(Base):
    """
    ORM mapping to the `sessions` table.

    NOTE: The DB trigger `trg_update_updated_at` handles `updated_at`
    automatically on UPDATE. The service layer does NOT need to set it.
    """
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
    )
    task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(String(5000), nullable=True)
    topic_ids: Mapped[list[uuid.UUID] | None] = mapped_column(ARRAY(UUID(as_uuid=True)), nullable=True)
    status: Mapped[str] = mapped_column(String(50))
    duration_seconds: Mapped[int] = mapped_column(Integer, server_default="0")
    last_seen_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=text("NOW()"),
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=text("NOW()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=text("NOW()"),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )

    # Relationship: one session → many pauses
    pauses: Mapped[list["SessionPauseModel"]] = relationship(
        back_populates="session",
        lazy="selectin",
    )


class SessionPauseModel(Base):
    """
    ORM mapping to the `session_pauses` table.

    Lifecycle:
      - INSERT on pause  → created_at = paused_at timestamp
      - UPDATE on resume  → pause_duration_seconds filled, updated_at = resumed_at
      - An "open" pause has pause_duration_seconds == 0 (not yet resumed)
    """
    __tablename__ = "session_pauses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
    )
    pause_duration_seconds: Mapped[int] = mapped_column(
        Integer, server_default="0",
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=text("NOW()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=text("NOW()"),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )

    # Relationship: many pauses → one session
    session: Mapped["SessionModel"] = relationship(
        back_populates="pauses",
    )
