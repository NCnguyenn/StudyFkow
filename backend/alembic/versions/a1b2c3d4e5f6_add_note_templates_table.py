"""add_note_templates_table

Revision ID: a1b2c3d4e5f6
Revises: b3ca8ebd4f5b
Create Date: 2026-05-30 09:53:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'b3ca8ebd4f5b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    op.create_table(
        'note_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('mode', sa.String(20), nullable=False, server_default='document'),
        sa.Column('content_json', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('thumbnail', sa.Text(), nullable=True),
        sa.Column('is_public', sa.Boolean(), server_default='false'),
        sa.Column('tags', postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('usage_count', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_note_templates_user', 'note_templates', ['user_id'])


def downgrade() -> None:
    op.drop_index('idx_note_templates_user', table_name='note_templates')
    op.drop_table('note_templates')
