import logging
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

from backend.app.core.base import Base
# Import all models here so Alembic can discover them
from backend.features.study_sessions.infrastructure.orm import SessionModel, SessionPauseModel
from backend.features.user_auth.infrastructure.orm import UserModel
from backend.features.task_management.infrastructure.orm import TaskModel, TaskCategoryModel, SubjectModel
from backend.features.notes.infrastructure.models import NoteFolderModel, NoteModel
from backend.features.analytics.infrastructure.orm import InsightModel

target_metadata = Base.metadata
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
