"""initial_9_table_schema

Revision ID: 1a2b3c4d5e6f
Revises: 
Create Date: 2026-05-08 14:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '1a2b3c4d5e6f'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create the updated_at trigger function
    op.execute("""
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # 1. users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('subscription_tier', sa.String(50), server_default='free', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('deleted_at', sa.TIMESTAMP(timezone=True), nullable=True)
    )
    op.execute("CREATE TRIGGER trg_update_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")

    # 2. user_stats
    op.create_table(
        'user_stats',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('total_study_time', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('deleted_at', sa.TIMESTAMP(timezone=True), nullable=True)
    )
    op.execute("CREATE TRIGGER trg_update_updated_at BEFORE UPDATE ON user_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")

    # 3. tasks
    op.create_table(
        'tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('is_completed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('due_date', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('deleted_at', sa.TIMESTAMP(timezone=True), nullable=True)
    )
    op.execute("CREATE TRIGGER trg_update_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")
    # Add index: idx_tasks_user_planned
    op.execute("CREATE INDEX idx_tasks_user_planned ON tasks (user_id) WHERE is_completed = false AND deleted_at IS NULL;")

    # 4. sessions
    op.create_table(
        'sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('duration_seconds', sa.Integer(), server_default='0', nullable=False),
        sa.Column('last_seen_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('deleted_at', sa.TIMESTAMP(timezone=True), nullable=True)
    )
    op.execute("CREATE TRIGGER trg_update_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")
    # Add indexes: idx_sessions_user_status, idx_sessions_last_seen
    op.execute("CREATE INDEX idx_sessions_user_status ON sessions (user_id, status) WHERE deleted_at IS NULL;")
    op.execute("CREATE INDEX idx_sessions_last_seen ON sessions (last_seen_at) WHERE deleted_at IS NULL;")

    # 5. session_pauses
    op.create_table(
        'session_pauses',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('pause_duration_seconds', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('deleted_at', sa.TIMESTAMP(timezone=True), nullable=True)
    )
    op.execute("CREATE TRIGGER trg_update_updated_at BEFORE UPDATE ON session_pauses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")

    # 6. event_log
    op.create_table(
        'event_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('action_type', sa.String(50), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('deleted_at', sa.TIMESTAMP(timezone=True), nullable=True)
    )
    op.execute("CREATE TRIGGER trg_update_updated_at BEFORE UPDATE ON event_log FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")

    # 7. insights
    op.create_table(
        'insights',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('deleted_at', sa.TIMESTAMP(timezone=True), nullable=True)
    )
    op.execute("CREATE TRIGGER trg_update_updated_at BEFORE UPDATE ON insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")

    # 8. quiz_attempts
    op.create_table(
        'quiz_attempts',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('deleted_at', sa.TIMESTAMP(timezone=True), nullable=True)
    )
    op.execute("CREATE TRIGGER trg_update_updated_at BEFORE UPDATE ON quiz_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")

    # 9. analytics_cache
    op.create_table(
        'analytics_cache',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('cache_key', sa.String(255), nullable=False),
        sa.Column('data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('deleted_at', sa.TIMESTAMP(timezone=True), nullable=True)
    )
    op.execute("CREATE TRIGGER trg_update_updated_at BEFORE UPDATE ON analytics_cache FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();")


def downgrade() -> None:
    op.drop_table('analytics_cache')
    op.drop_table('quiz_attempts')
    op.drop_table('insights')
    op.drop_table('event_log')
    op.drop_table('session_pauses')
    op.drop_table('sessions')
    op.drop_table('tasks')
    op.drop_table('user_stats')
    op.drop_table('users')
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;")
