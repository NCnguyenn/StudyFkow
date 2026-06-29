"""merge note v2 and synced blocks heads

Revision ID: b1df200d81e2
Revises: b2f9e4c1a7d6, 3159faa451da
Create Date: 2026-06-16 15:32:07.647174

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1df200d81e2'
down_revision: Union[str, None] = ('b2f9e4c1a7d6', '3159faa451da')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
