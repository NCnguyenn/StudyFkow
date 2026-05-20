import uuid
from datetime import datetime

from sqlalchemy import String, Integer, text, Boolean
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.base import Base

class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    soul_color_hex: Mapped[str] = mapped_column(String(7), default="#e2e8f0", server_default="#e2e8f0")
    lite_mode_enabled: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    timezone: Mapped[str] = mapped_column(String(50))
    subscription_tier: Mapped[str] = mapped_column(String(50), server_default="free")
    
    llm_provider: Mapped[str] = mapped_column(String(50), server_default="OLLAMA")
    llm_api_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=text("NOW()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=text("NOW()"),
        onupdate=text("NOW()"),
    )
