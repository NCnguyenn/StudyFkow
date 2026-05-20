"""
Core database engine and session factory.

Usage:
  - Import `get_write_session` or `get_read_session` as FastAPI dependencies.
  - Transaction management belongs in the Service layer (see database.md §7.1).

Connection routing:
  - get_write_session → primary PgBouncer URL
  - get_read_session  → same URL today; will point to read-replica when deployed

Pool settings follow database.md §9.3: pool_pre_ping guards against stale conns.
"""

import os
from typing import AsyncGenerator
from dotenv import load_dotenv

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

# Load environment variables from .env file
load_dotenv()

# ---------------------------------------------------------------------------
# Engine configuration
# ---------------------------------------------------------------------------

# Default to raw Postgres port (5432) instead of PgBouncer (6432) for dev.
# Replace 'postgresql' scheme with 'postgresql+asyncpg' for async driver.
_raw_url = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@127.0.0.1:5433/studyflow",
)
DATABASE_URL = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("ENVIRONMENT", "development") == "development",
    pool_pre_ping=True,       # database.md §9.3
    pool_size=10,
    max_overflow=5,
)

# ---------------------------------------------------------------------------
# Session factories
# ---------------------------------------------------------------------------

_async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_write_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields a session intended for write operations."""
    async with _async_session_factory() as session:
        yield session


async def get_read_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency — yields a session intended for read-only queries.

    Currently points to the same engine. When PostgreSQL read-replicas
    are provisioned, this factory will route to a separate read engine
    without any application-layer changes (database.md §6.3).
    """
    async with _async_session_factory() as session:
        yield session
