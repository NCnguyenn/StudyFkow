"""add planner subjects and tasks

Revision ID: 7a8b9c0d1e2f
Revises: f4ebd962a04c
Create Date: 2026-05-16 20:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '7a8b9c0d1e2f'
down_revision = 'cc10f11a94ea'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Create priority ENUM type
    priority_enum = postgresql.ENUM('LOW', 'MEDIUM', 'HIGH', name='priority_enum')
    priority_enum.create(op.get_bind())

    # 2. Create subjects table
    op.create_table(
        'subjects',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', postgresql.ENUM('LOW', 'MEDIUM', 'HIGH', name='priority_enum', create_type=False), nullable=False),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subjects_user_id'), 'subjects', ['user_id'], unique=False)

    # 3. Add new columns to existing tasks table
    op.add_column('tasks', sa.Column('subject_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('tasks', sa.Column('subtasks', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('tasks', sa.Column('recurrence_rule', sa.String(length=255), nullable=True))
    op.add_column('tasks', sa.Column('overtime_buffer_minutes', sa.Integer(), nullable=True))
    op.add_column('tasks', sa.Column('failed_reason', sa.Text(), nullable=True))
    op.add_column('tasks', sa.Column('task_status', sa.String(length=20), server_default='PENDING', nullable=False))
    
    op.create_foreign_key('fk_tasks_subject_id', 'tasks', 'subjects', ['subject_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_tasks_subject_id'), 'tasks', ['subject_id'], unique=False)


def downgrade():
    # 1. Remove columns from tasks
    op.drop_constraint('fk_tasks_subject_id', 'tasks', type_='foreignkey')
    op.drop_index(op.f('ix_tasks_subject_id'), table_name='tasks')
    op.drop_column('tasks', 'task_status')
    op.drop_column('tasks', 'failed_reason')
    op.drop_column('tasks', 'overtime_buffer_minutes')
    op.drop_column('tasks', 'recurrence_rule')
    op.drop_column('tasks', 'subtasks')
    op.drop_column('tasks', 'subject_id')

    # 2. Drop subjects table
    op.drop_index(op.f('ix_subjects_user_id'), table_name='subjects')
    op.drop_table('subjects')

    # 3. Drop priority ENUM
    priority_enum = postgresql.ENUM('LOW', 'MEDIUM', 'HIGH', name='priority_enum')
    priority_enum.drop(op.get_bind())
