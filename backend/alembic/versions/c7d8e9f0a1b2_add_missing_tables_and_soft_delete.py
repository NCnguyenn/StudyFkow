"""add_missing_tables_and_soft_delete

Revision ID: c7d8e9f0a1b2
Revises: a1b2c3d4e5f6
Create Date: 2026-05-31 21:42:00.000000

Phase 0 Hotfix:
  1. Create note_links table (Zettelkasten bi-directional links) — was missing migration
  2. Create note_versions table (version history) — was missing migration
  3. Add soft delete (deleted_at) to notes, note_folders, note_templates
  4. Add partial indexes for active-only queries
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c7d8e9f0a1b2'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. Create note_links table (Zettelkasten bi-directional links)
    # ------------------------------------------------------------------
    op.create_table(
        'note_links',
        sa.Column('source_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('notes.id', ondelete='CASCADE'),
                  primary_key=True, nullable=False),
        sa.Column('target_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('notes.id', ondelete='CASCADE'),
                  primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_note_links_source', 'note_links', ['source_id'])
    op.create_index('idx_note_links_target', 'note_links', ['target_id'])

    # ------------------------------------------------------------------
    # 2. Create note_versions table (version history snapshots)
    # ------------------------------------------------------------------
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    op.create_table(
        'note_versions',
        sa.Column('id', postgresql.UUID(as_uuid=True),
                  primary_key=True,
                  server_default=sa.text('uuid_generate_v4()')),
        sa.Column('note_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('notes.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('content_json', postgresql.JSONB(astext_type=sa.Text()),
                  nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_note_versions_note_id', 'note_versions', ['note_id'])

    # ------------------------------------------------------------------
    # 3. Add soft delete columns (deleted_at) to all main entities
    # ------------------------------------------------------------------
    op.add_column('notes',
                  sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('note_folders',
                  sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('note_templates',
                  sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

    # ------------------------------------------------------------------
    # 4. Partial indexes — only index ACTIVE (non-deleted) records
    #    This optimizes the most common query pattern (WHERE deleted_at IS NULL)
    # ------------------------------------------------------------------
    op.execute("""
        CREATE INDEX idx_notes_active
        ON notes (user_id)
        WHERE deleted_at IS NULL;
    """)
    op.execute("""
        CREATE INDEX idx_note_folders_active
        ON note_folders (user_id)
        WHERE deleted_at IS NULL;
    """)


def downgrade() -> None:
    # Remove partial indexes
    op.execute("DROP INDEX IF EXISTS idx_note_folders_active;")
    op.execute("DROP INDEX IF EXISTS idx_notes_active;")

    # Remove soft delete columns
    op.drop_column('note_templates', 'deleted_at')
    op.drop_column('note_folders', 'deleted_at')
    op.drop_column('notes', 'deleted_at')

    # Drop tables
    op.drop_index('idx_note_versions_note_id', table_name='note_versions')
    op.drop_table('note_versions')
    op.drop_index('idx_note_links_target', table_name='note_links')
    op.drop_index('idx_note_links_source', table_name='note_links')
    op.drop_table('note_links')
