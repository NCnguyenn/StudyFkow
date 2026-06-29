"""add_fulltext_search_index

Revision ID: fae38be5443c
Revises: d4e5f6a7b8c9
Create Date: 2026-06-01 10:17:01.607217

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fae38be5443c'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable pg_trgm extension if not exists
    op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
    
    # 2. Create GIN index for full-text search
    op.execute(sa.text("""
        CREATE INDEX idx_notes_fulltext 
        ON notes 
        USING GIN (
            to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_markdown, ''))
        )
        WHERE deleted_at IS NULL;
    """))
    
    # 3. Create GIN index for title trigram (fast prefix/substring matching)
    op.execute(sa.text("""
        CREATE INDEX idx_notes_title_trgm 
        ON notes 
        USING GIN (title gin_trgm_ops)
        WHERE deleted_at IS NULL;
    """))


def downgrade() -> None:
    # Drop indexes
    op.execute(sa.text("DROP INDEX IF EXISTS idx_notes_title_trgm;"))
    op.execute(sa.text("DROP INDEX IF EXISTS idx_notes_fulltext;"))
    # We do NOT drop pg_trgm extension since other features or databases might be using it.
