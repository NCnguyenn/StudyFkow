"""add_llm_settings_to_users

Revision ID: deed4964a275
Revises: cc36f4cded66
Create Date: 2026-05-12 14:02:17.376578

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'deed4964a275'
down_revision: Union[str, None] = 'cc36f4cded66'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('llm_provider', sa.String(length=50), server_default='OLLAMA', nullable=False))
    op.add_column('users', sa.Column('llm_api_key', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'llm_api_key')
    op.drop_column('users', 'llm_provider')
