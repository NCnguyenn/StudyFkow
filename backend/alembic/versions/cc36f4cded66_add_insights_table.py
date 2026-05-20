"""add_insights_table

Revision ID: cc36f4cded66
Revises: 6182ffcbab04
Create Date: 2026-05-12 13:10:15.605246

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cc36f4cded66'
down_revision: Union[str, None] = '6182ffcbab04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "insights",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("insight_type", sa.String(length=50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("feedback_score", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_dismissed", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id")
    )
    
    # Add trigger for updated_at
    op.execute(
        """
        CREATE TRIGGER trg_insights_updated_at
        BEFORE UPDATE ON insights
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_insights_updated_at ON insights;")
    op.drop_table("insights")
