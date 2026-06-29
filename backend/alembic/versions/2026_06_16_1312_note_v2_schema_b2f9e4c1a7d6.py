"""Note Module V2 Schema Evolution and ETL

Revision ID: b2f9e4c1a7d6
Revises: fae38be5443c
Create Date: 2026-06-16

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b2f9e4c1a7d6'
down_revision = 'fae38be5443c'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Expand `note_folders`
    op.add_column('note_folders', sa.Column('workspace_kit_id', sa.String(length=50), nullable=True))

    # 2. Expand `notes`
    op.add_column('notes', sa.Column('theme_id', sa.String(length=50), nullable=True))
    op.add_column('notes', sa.Column('layout_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.create_index('idx_notes_content_json_gin', 'notes', ['content_json'], unique=False, postgresql_using='gin')

    # 3. Expand `note_templates` and enforce category length/enum boundary
    op.add_column('note_templates', sa.Column('subcategory', sa.String(length=50), nullable=True))
    op.add_column('note_templates', sa.Column('preview_image', sa.Text(), nullable=True))
    op.add_column('note_templates', sa.Column('difficulty', sa.String(length=20), nullable=True))
    op.add_column('note_templates', sa.Column('blocks_used', postgresql.ARRAY(sa.Text()), nullable=True))
    op.add_column('note_templates', sa.Column('theme_id', sa.String(length=50), nullable=True))
    
    op.alter_column('note_templates', 'category',
               existing_type=sa.VARCHAR(length=100),
               type_=sa.String(length=50),
               existing_nullable=True)

    # 4. Phase 1 -> Phase 6 ETL: Extract existing theme data embedded in ui_metadata
    op.execute("""
        UPDATE notes
        SET theme_id = COALESCE(ui_metadata->>'theme_id', ui_metadata->>'page_theme')
        WHERE theme_id IS NULL AND (ui_metadata->>'theme_id' IS NOT NULL OR ui_metadata->>'page_theme' IS NOT NULL);
    """)

    # 5. Fallback Backfill: Set 'default' only for rows with no pre-existing theme config
    op.execute("""
        UPDATE notes
        SET theme_id = 'default'
        WHERE theme_id IS NULL;
    """)


def downgrade():
    # 1. Revert `note_templates`
    op.alter_column('note_templates', 'category',
               existing_type=sa.String(length=50),
               type_=sa.VARCHAR(length=100),
               existing_nullable=True)
    op.drop_column('note_templates', 'theme_id')
    op.drop_column('note_templates', 'blocks_used')
    op.drop_column('note_templates', 'difficulty')
    op.drop_column('note_templates', 'preview_image')
    op.drop_column('note_templates', 'subcategory')

    # 2. Revert `notes`
    op.drop_index('idx_notes_content_json_gin', table_name='notes', postgresql_using='gin')
    op.drop_column('notes', 'layout_data')
    op.drop_column('notes', 'theme_id')

    # 3. Revert `note_folders`
    op.drop_column('note_folders', 'workspace_kit_id')
