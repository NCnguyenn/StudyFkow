```txt
AI_StudyFlow/
├── .ai/                            # AI Governance & Architecture
│   ├── adr/                        # Architectural Decision Records
│   │   ├── 001_use_postgresql.md
│   │   ├── 002_use_celery.md
│   │   └── 003_hybrid_ai_inference.md
│   ├── architecture/               # System, Component, Data specs
│   │   ├── ai_pipeline.md
│   │   ├── api_contracts.md
│   │   ├── database_schema.md
│   │   ├── dependencies.md
│   │   ├── impact_map.md
│   │   ├── offline_sync.md
│   │   └── session_state_machine.md
│   ├── features/                   # Feature boundaries and specifications
│   │   ├── ai_pipeline/
│   │   ├── auth/
│   │   ├── session_engine/
│   │   ├── task_timeline/
│   │   └── FEATURE_BOUNDARIES.md
│   ├── logs/                       # Activity and change logs
│   │   └── ai_changes.md
│   ├── memory/                     # Long-term AI memory, task records, and validation reports
│   │   ├── archive/
│   │   ├── reports/
│   │   │   └── E2E_VALIDATION_PHASE_4.md
│   │   ├── completed_tasks.md
│   │   ├── current_session.md
│   │   └── known_bugs.md
│   ├── prompts/                    # Template and system prompts for LLM queries (empty)
│   ├── rules/                      # Cursor/Claude project rules per component
│   │   ├── ai_behavior.md
│   │   ├── backend.md
│   │   ├── database.md
│   │   ├── frontend.md
│   │   ├── global.md
│   │   └── refactor.md
│   ├── testing/                    # Automated testing guidelines
│   │   ├── e2e_strategy.md
│   │   ├── integration_test_rules.md
│   │   └── unit_test_rules.md
│   ├── workflows/                  # Standardized agent workflows
│   │   ├── api_creation.md
│   │   ├── bug_fixing.md
│   │   ├── database_safety.md
│   │   ├── feature_creation.md
│   │   └── refactor_flow.md
│   ├── AI_ENTRYPOINT.md            # Entry point for AI agents
│   ├── context_loading.md          # Guide for restoring agent workspace context
│   ├── EXECUTION_GUIDE.md          # Multi-phase execution and implementation guide
│   ├── ROADMAP.md                  # Development roadmap and project milestones
│   └── SYSTEM_OVERVIEW.md          # High-level system architecture overview
├── .vscode/                        # VS Code workspace settings
│   └── settings.json
├── backend/                        # Python FastAPI Backend
│   ├── alembic/                    # Database Migrations
│   │   ├── versions/               # Schema evolution migration scripts
│   │   │   ├── 17c106cb1985_add_task_management_tables.py
│   │   │   ├── 2026_05_08_1445_initial_9_table_schema.py
│   │   │   ├── 2026_05_16_2030_add_planner_subjects_and_tasks.py
│   │   │   ├── 2026_05_16_2115_add_notes_and_folders.py
│   │   │   ├── 6182ffcbab04_add_task_id_to_sessions.py
│   │   │   ├── cc10f11a94ea_ui_overhaul_schema.py
│   │   │   ├── cc36f4cded66_add_insights_table.py
│   │   │   ├── dbd6bc88be81_add_subject_id_and_task_id_to_notes.py
│   │   │   ├── deed4964a275_add_llm_settings_to_users.py
│   │   │   └── f4ebd962a04c_update_users_table.py
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── app/                        # Application Bootstrap and Setup
│   │   ├── core/                   # Core application infrastructure
│   │   │   ├── base.py             # SQLAlchemy Base imports metadata
│   │   │   ├── celery_app.py       # Background worker bootstrap
│   │   │   ├── database.py         # Sessionmaker and Engine setups
│   │   │   └── security.py         # Password hashing & JWT generation tokens
│   │   ├── features/               # Registered application feature modules
│   │   │   ├── ai_pipeline/
│   │   │   ├── analytics/
│   │   │   ├── flashcard_engine/
│   │   │   ├── notifications/
│   │   │   ├── spaced_repetition/
│   │   │   ├── study_sessions/
│   │   │   ├── sync_engine/
│   │   │   └── user_auth/
│   │   └── main.py                 # FastAPI Web API application entrypoint
│   ├── features/                   # Core Domain logic (Vertical slices)
│   │   ├── ai_pipeline/            # AI Inference orchestrator (Ollama & Gemini)
│   │   │   ├── application/        # Prompt constructors and execution
│   │   │   ├── domain/             # LLM contract interfaces
│   │   │   ├── infrastructure/     # Client API libraries (Ollama, Google)
│   │   │   └── worker.py           # Background prompt consumer
│   │   ├── analytics/              # Aggregations, metrics, and insights engine
│   │   │   ├── api/                # REST endpoints for statistics
│   │   │   ├── application/        # Insight generators and summarizers
│   │   │   ├── domain/             # Aggregate entities
│   │   │   └── infrastructure/     # SQL repository models
│   │   ├── chat/                   # RAG-enabled chat assistant
│   │   │   ├── __init__.py
│   │   │   ├── api_router.py       # API endpoints for chat conversation
│   │   │   └── rag_service.py      # Note retriever and prompt builder
│   │   ├── notes/                  # Notes & folders (Zettelkasten network)
│   │   │   ├── api/
│   │   │   │   └── router.py       # Notes API routers (CRUDs)
│   │   │   ├── application/
│   │   │   │   └── service.py      # Note relation & link graph services
│   │   │   ├── domain/
│   │   │   │   └── schemas.py      # Pydantic schema validation models
│   │   │   └── infrastructure/
│   │   │       └── models.py       # SQLAlchemy models (Note, Folder, Link)
│   │   ├── realtime/               # Event broadcasting engine
│   │   │   ├── __init__.py
│   │   │   └── api_router.py       # Server-Sent Events (SSE) router via Redis
│   │   ├── study_sessions/         # Focus/Pomodoro sessions & state machines
│   │   │   ├── api/
│   │   │   ├── application/
│   │   │   ├── domain/
│   │   │   ├── infrastructure/
│   │   │   └── worker.py           # Stats reconciliation and timer completion tasks
│   │   ├── task_management/        # Tasks, calendar subjects, and deadlines
│   │   └── user_auth/              # Authentication & User Preferences
│   ├── scratch/                    # Temporary backend tooling
│   │   └── create_user.py          # Quick seed script for test user
│   ├── alembic.ini                 # Alembic configuration options
│   └── requirements.txt            # Python dependencies (fastapi, pydantic, sqlalchemy)
├── frontend/                       # Next.js Frontend
│   ├── src/
│   │   ├── app/                    # Next.js App Router Pages
│   │   │   ├── (dashboard)/        # Layout group for authenticated dashboard
│   │   │   │   ├── focus/          # Focus Session page (Pomodoro visualizer)
│   │   │   │   ├── insights/       # Productivity analytics page
│   │   │   │   ├── notes/          # Zen-mode Tiptap editor and note workspace
│   │   │   │   ├── settings/       # Settings and LLM configurations
│   │   │   │   ├── tasks/          # Timeline Planner dashboard
│   │   │   │   ├── layout.tsx      # Sidebar/Header structure
│   │   │   │   └── page.tsx        # Dashboard Hub Overview
│   │   │   ├── login/              # Simple, high-quality Login page
│   │   │   ├── globals.css         # Tailwind & CSS styling overrides
│   │   │   ├── layout.tsx          # Root HTML frame
│   │   │   └── page.tsx            # Welcome landing redirect
│   │   ├── components/             # Reusable UI React components
│   │   │   ├── dashboard/          # Specialized widgets for the Overview Hub
│   │   │   │   ├── FreeformCanvas.tsx
│   │   │   │   ├── ProfileHero.tsx
│   │   │   │   └── WidgetGrid.tsx
│   │   │   ├── features/           # Specialized feature UI assemblies
│   │   │   │   ├── chat/           # Float-over AI Chat module
│   │   │   │   │   └── FloatingChat.tsx
│   │   │   │   ├── notes/          # TipTap editor complex tools
│   │   │   │   │   ├── EditorHeader.tsx
│   │   │   │   │   ├── EditorToolbar.tsx
│   │   │   │   │   ├── MagicGloss.ts
│   │   │   │   │   ├── NetworkGraphModal.tsx
│   │   │   │   │   ├── StudioToolbar.tsx
│   │   │   │   │   ├── TiptapEditor.tsx
│   │   │   │   │   └── WorkspaceSidebar.tsx
│   │   │   │   ├── planner/        # Planner/Timeline view components
│   │   │   │   ├── search/         # Omnisearch components
│   │   │   │   └── tasks/          # Task lists and subtask managers
│   │   │   └── ui/                 # Atoms and baseline controls
│   │   │       └── GlassCard.tsx   # Premium glassmorphic component wrapper
│   │   ├── features/               # Client-side state interfaces and APIs
│   │   │   ├── ai_pipeline/
│   │   │   ├── analytics/
│   │   │   │   ├── api/
│   │   │   │   └── components/     # Cards & visualization controls
│   │   │   ├── flashcard_engine/
│   │   │   ├── notifications/
│   │   │   ├── spaced_repetition/
│   │   │   ├── study_sessions/
│   │   │   ├── sync_engine/
│   │   │   ├── task_management/
│   │   │   └── user_auth/
│   │   ├── hooks/                  # Global shared hooks
│   │   │   ├── useRealtimeEvents.ts     # Stream events observer
│   │   │   ├── useRealtimeTaskStatus.ts # Async task listener
│   │   │   └── useStrictFocus.ts        # Sync window timers
│   │   ├── lib/                    # Helper packages
│   │   │   ├── tiptap/             # TipTap rich text extensions
│   │   │   │   ├── bidirectional-link.ts # Double link nodes
│   │   │   │   ├── font-size.ts
│   │   │   │   └── inline-comment.ts
│   │   │   ├── api-utils.ts        # Network tools
│   │   │   ├── audioDb.ts          # IndexDB visual sound storage
│   │   │   └── calendar-utils.ts   # Chronological utilities
│   │   ├── store/                  # Zustand global state slices
│   │   │   ├── useAppStore.ts
│   │   │   ├── useFocusStore.ts
│   │   │   ├── useNoteStore.ts
│   │   │   ├── useSubjectStore.ts
│   │   │   └── useTaskStore.ts
│   │   └── types/                  # Common TypeScript typings
│   │       ├── notes.ts
│   │       └── planner.ts
│   ├── package.json                # Project dependencies and script runner configurations
│   ├── tailwind.config.ts          # Styling tokens for tailwindcss layout engine
│   └── tsconfig.json               # Config details for compiler
├── infrastructure/                 # Target deployment configurations (empty)
├── scratch/                        # Temporary tools/scripts
│   ├── db_check.py                 # Database connectivity testing helper
│   ├── e2e_test.js                 # Puppeteer integration test scripting
│   ├── test_insights_flow.py       # Local analytics flow runner
│   └── test_note_upload.py         # Testing script for notes uploads
├── scripts/                        # General maintenance scripts
│   ├── archive_code.py             # Zips codebase files for backup
│   ├── archive_md.py               # Document management tools
│   ├── archive_md_v2.py            # Optimized documentation management tools
│   └── consolidate_docs.py         # Summary generation and assembly scripts
├── tests/                          # Root test directory (empty)
├── .cursorrules                   # Development principles and guidelines
├── .env                            # Secret environment configurations
├── .env.example                    # Sample structure for setting up .env variables
├── db_hotfix.py                    # Database schema emergency correction script
├── docker-compose.yml              # Local container setups (PostgreSQL, Redis)
├── pyrightconfig.json              # Python static analysis parameters
├── start_dev.py                    # Complete application launch orchestrator
├── SYSTEM_UPGRADE_SPEC.md          # Empty upgrade specification doc
└── PROJECT_STRUCTURE.md            # [THIS FILE]
```
