"""add_ui_metadata_to_folders

Revision ID: b3ca8ebd4f5b
Revises: f9d4e68d221f
Create Date: 2026-05-28 13:55:02.660277

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3ca8ebd4f5b'
down_revision: Union[str, None] = 'f9d4e68d221f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from sqlalchemy.dialects import postgresql
    op.add_column(
        'note_folders',
        sa.Column('ui_metadata', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False)
    )


def downgrade() -> None:
    op.drop_column('note_folders', 'ui_metadata')

