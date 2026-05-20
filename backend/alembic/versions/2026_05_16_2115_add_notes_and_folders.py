# backend/alembic/versions/2026_05_16_2115_add_notes_and_folders.py
"""add notes and folders

Revision ID: 2026_05_16_2115
Revises: 2026_05_16_2030  
Create Date: 2026-05-16 21:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2026_05_16_2115'
down_revision = '7a8b9c0d1e2f'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create note_folders table
    op.create_table(
        'note_folders',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['parent_id'], ['note_folders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Hierarchy index for faster traversal
    op.create_index('idx_note_folders_hierarchy', 'note_folders', ['user_id', 'parent_id'], unique=False)

    # Create notes table
    op.create_table(
        'notes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('folder_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('subject_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(length=255), server_default='Untitled Note', nullable=False),
        sa.Column('content_json', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('content_markdown', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['folder_id'], ['note_folders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Index for bidirectional linking resolution
    op.create_index('idx_notes_relations', 'notes', ['subject_id', 'task_id'], unique=False)

def downgrade() -> None:
    op.drop_index('idx_notes_relations', table_name='notes')
    op.drop_table('notes')
    
    op.drop_index('idx_note_folders_hierarchy', table_name='note_folders')
    op.drop_table('note_folders')
