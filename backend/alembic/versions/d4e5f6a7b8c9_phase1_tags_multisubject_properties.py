"""phase1_tags_multisubject_properties

Revision ID: d4e5f6a7b8c9
Revises: c7d8e9f0a1b2
Create Date: 2026-05-31 22:10:00.000000

Phase 1 — Database Foundation:
  1.1 Tags system: note_tags + note_tag_mappings tables
  1.1 Custom properties: status, note_type, priority on notes
  1.2 Multi-Subject Linking: note_subjects + note_tasks M2M tables
      Data migration from old FK columns → M2M, then drop old FKs
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c7d8e9f0a1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ==================================================================
    # 1.1 — Tags system
    # ==================================================================

    # note_tags — user-scoped tag definitions
    op.create_table(
        'note_tags',
        sa.Column('id', postgresql.UUID(as_uuid=True),
                  primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('color', sa.String(7), nullable=False,
                  server_default='#6366f1'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_note_tags_user', 'note_tags', ['user_id'])
    op.create_unique_constraint('uq_note_tags_user_name', 'note_tags',
                                ['user_id', 'name'])

    # note_tag_mappings — many-to-many note ↔ tag
    op.create_table(
        'note_tag_mappings',
        sa.Column('note_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('notes.id', ondelete='CASCADE'),
                  primary_key=True, nullable=False),
        sa.Column('tag_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('note_tags.id', ondelete='CASCADE'),
                  primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )

    # ==================================================================
    # 1.1 — Custom properties on notes
    # ==================================================================
    op.add_column('notes',
                  sa.Column('status', sa.String(20), nullable=True,
                            server_default='draft'))
    op.add_column('notes',
                  sa.Column('note_type', sa.String(30), nullable=True))
    op.add_column('notes',
                  sa.Column('priority', sa.String(10), nullable=True))

    # Partial indexes for common filter patterns
    op.execute("""
        CREATE INDEX idx_notes_status
        ON notes (user_id, status)
        WHERE deleted_at IS NULL;
    """)
    op.execute("""
        CREATE INDEX idx_notes_type
        ON notes (user_id, note_type)
        WHERE deleted_at IS NULL;
    """)

    # ==================================================================
    # 1.2 — Multi-Subject / Multi-Task M2M tables
    # ==================================================================

    # note_subjects — many-to-many note ↔ subject
    op.create_table(
        'note_subjects',
        sa.Column('note_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('notes.id', ondelete='CASCADE'),
                  primary_key=True, nullable=False),
        sa.Column('subject_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('subjects.id', ondelete='CASCADE'),
                  primary_key=True, nullable=False),
    )
    op.create_index('idx_note_subjects_note', 'note_subjects', ['note_id'])
    op.create_index('idx_note_subjects_subject', 'note_subjects', ['subject_id'])

    # note_tasks — many-to-many note ↔ task
    op.create_table(
        'note_tasks',
        sa.Column('note_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('notes.id', ondelete='CASCADE'),
                  primary_key=True, nullable=False),
        sa.Column('task_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('tasks.id', ondelete='CASCADE'),
                  primary_key=True, nullable=False),
    )
    op.create_index('idx_note_tasks_note', 'note_tasks', ['note_id'])
    op.create_index('idx_note_tasks_task', 'note_tasks', ['task_id'])

    # ------------------------------------------------------------------
    # Migrate existing FK data → M2M tables BEFORE dropping old columns
    # ------------------------------------------------------------------
    op.execute("""
        INSERT INTO note_subjects (note_id, subject_id)
        SELECT id, subject_id FROM notes
        WHERE subject_id IS NOT NULL
        ON CONFLICT DO NOTHING;
    """)
    op.execute("""
        INSERT INTO note_tasks (note_id, task_id)
        SELECT id, task_id FROM notes
        WHERE task_id IS NOT NULL
        ON CONFLICT DO NOTHING;
    """)

    # ------------------------------------------------------------------
    # Drop old single-FK columns & their index
    # ------------------------------------------------------------------
    op.drop_index('idx_notes_relations', table_name='notes')
    op.drop_constraint('notes_subject_id_fkey', 'notes', type_='foreignkey')
    op.drop_constraint('notes_task_id_fkey', 'notes', type_='foreignkey')
    op.drop_column('notes', 'subject_id')
    op.drop_column('notes', 'task_id')


def downgrade() -> None:
    # ------------------------------------------------------------------
    # Restore old FK columns on notes
    # ------------------------------------------------------------------
    op.add_column('notes',
                  sa.Column('subject_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('notes',
                  sa.Column('task_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('notes_subject_id_fkey', 'notes', 'subjects',
                          ['subject_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('notes_task_id_fkey', 'notes', 'tasks',
                          ['task_id'], ['id'], ondelete='SET NULL')

    # Migrate M2M data back (take first subject/task per note)
    op.execute("""
        UPDATE notes SET subject_id = ns.subject_id
        FROM (
            SELECT DISTINCT ON (note_id) note_id, subject_id
            FROM note_subjects ORDER BY note_id
        ) ns WHERE notes.id = ns.note_id;
    """)
    op.execute("""
        UPDATE notes SET task_id = nt.task_id
        FROM (
            SELECT DISTINCT ON (note_id) note_id, task_id
            FROM note_tasks ORDER BY note_id
        ) nt WHERE notes.id = nt.note_id;
    """)

    op.create_index('idx_notes_relations', 'notes', ['subject_id', 'task_id'])

    # Drop M2M tables
    op.drop_index('idx_note_tasks_task', table_name='note_tasks')
    op.drop_index('idx_note_tasks_note', table_name='note_tasks')
    op.drop_table('note_tasks')
    op.drop_index('idx_note_subjects_subject', table_name='note_subjects')
    op.drop_index('idx_note_subjects_note', table_name='note_subjects')
    op.drop_table('note_subjects')

    # Drop property columns
    op.execute("DROP INDEX IF EXISTS idx_notes_type;")
    op.execute("DROP INDEX IF EXISTS idx_notes_status;")
    op.drop_column('notes', 'priority')
    op.drop_column('notes', 'note_type')
    op.drop_column('notes', 'status')

    # Drop tag tables
    op.drop_table('note_tag_mappings')
    op.drop_unique_constraint('uq_note_tags_user_name', 'note_tags')
    op.drop_index('idx_note_tags_user', table_name='note_tags')
    op.drop_table('note_tags')
