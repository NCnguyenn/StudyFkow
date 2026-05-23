```txt
AI_StudyFlow/
├── .ai/                                    # AI Governance & Architecture
│   ├── adr/                                # Architectural Decision Records
│   │   ├── 001_use_postgresql.md
│   │   ├── 002_use_celery.md
│   │   └── 003_hybrid_ai_inference.md
│   ├── architecture/
│   │   ├── ai_pipeline.md
│   │   ├── api_contracts.md
│   │   ├── database_schema.md
│   │   ├── dependencies.md
│   │   ├── impact_map.md
│   │   ├── offline_sync.md
│   │   └── session_state_machine.md
│   ├── features/
│   │   ├── ai_pipeline/
│   │   ├── auth/
│   │   ├── session_engine/
│   │   ├── task_timeline/
│   │   └── FEATURE_BOUNDARIES.md
│   ├── logs/
│   │   └── ai_changes.md
│   ├── memory/
│   │   ├── archive/
│   │   ├── reports/
│   │   │   └── E2E_VALIDATION_PHASE_4.md
│   │   ├── completed_tasks.md
│   │   ├── current_session.md
│   │   └── known_bugs.md
│   ├── prompts/
│   ├── rules/
│   │   ├── ai_behavior.md
│   │   ├── backend.md
│   │   ├── database.md
│   │   ├── frontend.md
│   │   ├── global.md
│   │   └── refactor.md
│   ├── testing/
│   │   ├── e2e_strategy.md
│   │   ├── integration_test_rules.md
│   │   └── unit_test_rules.md
│   ├── workflows/
│   │   ├── api_creation.md
│   │   ├── bug_fixing.md
│   │   ├── database_safety.md
│   │   ├── feature_creation.md
│   │   └── refactor_flow.md
│   ├── AI_ENTRYPOINT.md
│   ├── EXECUTION_GUIDE.md
│   ├── ROADMAP.md
│   ├── SYSTEM_OVERVIEW.md
│   └── context_loading.md
├── .antigravitycli/
├── .vscode/
│   └── settings.json
├── backend/
│   ├── alembic/
│   │   ├── versions/
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
│   ├── app/
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── celery_app.py
│   │   │   └── database.py
│   │   ├── features/
│   │   │   ├── ai_pipeline/
│   │   │   ├── analytics/
│   │   │   ├── flashcard_engine/
│   │   │   ├── notifications/
│   │   │   ├── spaced_repetition/
│   │   │   ├── study_sessions/
│   │   │   ├── sync_engine/
│   │   │   └── user_auth/
│   │   └── main.py
│   ├── features/
│   │   ├── ai_pipeline/
│   │   │   ├── application/
│   │   │   │   ├── factory.py
│   │   │   │   └── prompt_builder.py
│   │   │   ├── domain/
│   │   │   │   └── interfaces.py
│   │   │   ├── infrastructure/
│   │   │   │   ├── gemini_client.py
│   │   │   │   └── ollama_client.py
│   │   │   └── worker.py
│   │   ├── analytics/
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   └── router.py
│   │   │   ├── application/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── insight_generator.py
│   │   │   │   └── service.py
│   │   │   ├── domain/
│   │   │   │   └── __init__.py
│   │   │   ├── infrastructure/
│   │   │   │   ├── orm.py
│   │   │   │   └── repository.py
│   │   │   └── __init__.py
│   │   ├── chat/
│   │   │   ├── __init__.py
│   │   │   ├── api_router.py
│   │   │   └── rag_service.py
│   │   ├── notes/
│   │   │   ├── api/
│   │   │   │   └── router.py
│   │   │   ├── application/
│   │   │   │   └── service.py
│   │   │   ├── domain/
│   │   │   │   └── schemas.py
│   │   │   ├── infrastructure/
│   │   │   │   └── models.py
│   │   │   └── __init__.py
│   │   ├── realtime/
│   │   │   ├── __init__.py
│   │   │   └── api_router.py
│   │   ├── study_sessions/
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   └── router.py
│   │   │   ├── application/
│   │   │   │   ├── __init__.py
│   │   │   │   └── service.py
│   │   │   ├── domain/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── exceptions.py
│   │   │   │   ├── interfaces.py
│   │   │   │   └── models.py
│   │   │   ├── infrastructure/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── orm.py
│   │   │   │   └── repository.py
│   │   │   ├── tests/
│   │   │   │   └── unit/
│   │   │   │       └── test_session_service.py
│   │   │   ├── __init__.py
│   │   │   └── worker.py
│   │   ├── task_management/
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── dependencies.py
│   │   │   │   └── router.py
│   │   │   ├── application/
│   │   │   │   ├── __init__.py
│   │   │   │   └── service.py
│   │   │   ├── domain/
│   │   │   │   ├── __init__.py
│   │   │   │   └── models.py
│   │   │   ├── infrastructure/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── orm.py
│   │   │   │   └── repository.py
│   │   │   └── __init__.py
│   │   └── user_auth/
│   │       ├── api/
│   │       │   ├── dependencies.py
│   │       │   └── router.py
│   │       ├── application/
│   │       │   └── service.py
│   │       ├── domain/
│   │       │   └── models.py
│   │       ├── infrastructure/
│   │       │   ├── orm.py
│   │       │   └── repository.py
│   │       └── __init__.py
│   ├── scratch/
│   │   └── create_user.py
│   ├── __init__.py
│   ├── alembic.ini
│   └── requirements.txt
├── chroma_data/
│   └── chroma.sqlite3
├── frontend/
│   ├── scratch/
│   │   └── test_tiptap.ts
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── focus/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── insights/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── notes/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── tasks/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── globals.css
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── FreeformCanvas.tsx
│   │   │   │   ├── OnboardingModal.tsx
│   │   │   │   ├── ProfileHero.tsx
│   │   │   │   ├── WidgetGrid.tsx
│   │   │   │   ├── useProfileData.ts
│   │   │   │   └── widgets.tsx
│   │   │   ├── features/
│   │   │   │   ├── chat/
│   │   │   │   │   └── FloatingChat.tsx
│   │   │   │   ├── notes/
│   │   │   │   │   ├── toolbar/
│   │   │   │   │   │   ├── README.md
│   │   │   │   │   │   └── highlight-comment-picker.tsx
│   │   │   │   │   ├── ChartToolbar.tsx
│   │   │   │   │   ├── DiagramToolbar.tsx
│   │   │   │   │   ├── EditorHeader.tsx
│   │   │   │   │   ├── MagicGloss.ts
│   │   │   │   │   ├── NetworkGraphModal.tsx
│   │   │   │   │   ├── SpreadsheetModal.tsx
│   │   │   │   │   ├── StudioToolbar.tsx
│   │   │   │   │   ├── TiptapEditor.tsx
│   │   │   │   │   └── WorkspaceSidebar.tsx
│   │   │   │   ├── planner/
│   │   │   │   │   ├── BacklogSidebar.tsx
│   │   │   │   │   ├── CalendarGrid.tsx
│   │   │   │   │   ├── RolloverPopup.tsx
│   │   │   │   │   ├── SubjectCard.tsx
│   │   │   │   │   ├── TaskBlock.tsx
│   │   │   │   │   ├── TaskModal.tsx
│   │   │   │   │   └── TaskQuickPanel.tsx
│   │   │   │   ├── search/
│   │   │   │   │   └── GlobalSearchModal.tsx
│   │   │   │   └── tasks/
│   │   │   │       └── TaskModal.tsx
│   │   │   └── ui/
│   │   │       ├── GlassCard.tsx
│   │   │       ├── button.tsx
│   │   │       ├── input.tsx
│   │   │       ├── popover.tsx
│   │   │       ├── select.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── toggle.tsx
│   │   │       └── tooltip.tsx
│   │   ├── features/
│   │   │   ├── ai_pipeline/
│   │   │   ├── analytics/
│   │   │   │   ├── api/
│   │   │   │   │   ├── analyticsApi.ts
│   │   │   │   │   └── insightsApi.ts
│   │   │   │   └── components/
│   │   │   │       └── InsightCard.tsx
│   │   │   ├── flashcard_engine/
│   │   │   ├── notifications/
│   │   │   ├── spaced_repetition/
│   │   │   ├── study_sessions/
│   │   │   │   ├── api/
│   │   │   │   │   └── sessionApi.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── DeepFocusWorkspace.tsx
│   │   │   │   │   ├── FocusSessionManager.tsx
│   │   │   │   │   ├── PrepareSpace.tsx
│   │   │   │   │   ├── SoundscapePlayer.tsx
│   │   │   │   │   └── ZenClock.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useStudySession.ts
│   │   │   │   ├── types/
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   ├── sync_engine/
│   │   │   ├── task_management/
│   │   │   │   └── api/
│   │   │   │       └── taskApi.ts
│   │   │   └── user_auth/
│   │   │       └── api/
│   │   │           └── settingsApi.ts
│   │   ├── hooks/
│   │   │   ├── useRealtimeEvents.ts
│   │   │   ├── useRealtimeTaskStatus.ts
│   │   │   └── useStrictFocus.ts
│   │   ├── lib/
│   │   │   ├── tiptap/
│   │   │   │   ├── MentionSuggestionList.tsx
│   │   │   │   ├── bidirectional-link.ts
│   │   │   │   ├── chart-block.tsx
│   │   │   │   ├── diagram-block.tsx
│   │   │   │   ├── font-size.ts
│   │   │   │   ├── inline-comment.ts
│   │   │   │   ├── mention-suggestion.ts
│   │   │   │   └── smart-mention.ts
│   │   │   ├── api-utils.ts
│   │   │   ├── audioDb.ts
│   │   │   ├── calendar-utils.ts
│   │   │   └── utils.ts
│   │   ├── store/
│   │   │   ├── useAppStore.ts
│   │   │   ├── useEditorBlockStore.ts
│   │   │   ├── useFocusStore.ts
│   │   │   ├── useNoteStore.ts
│   │   │   ├── useSubjectStore.ts
│   │   │   └── useTaskStore.ts
│   │   └── types/
│   │       ├── notes.ts
│   │       └── planner.ts
│   ├── components.json
│   ├── next-env.d.ts
│   ├── next.config.js
│   ├── out.css
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── infrastructure/
├── scratch/
│   ├── db_check.py
│   ├── e2e_test.js
│   ├── generate_tree.py
│   ├── test_insights_flow.py
│   └── test_note_upload.py
├── scripts/
│   ├── archive_code.py
│   ├── archive_md.py
│   ├── archive_md_v2.py
│   ├── archive_notes.py
│   ├── consolidate_docs.py
│   └── extract_note_module.py
├── static_cdn/
│   └── note_images/
│       └── c65ab3b8-eede-433b-9583-8f67a9c80c38.png
├── tests/
├── .cursorrules
├── .env
├── .env.example
├── .gitignore
├── PROJECT_STRUCTURE.md
├── SYSTEM_UPGRADE_SPEC.md
├── db_hotfix.py
├── docker-compose.yml
├── pyrightconfig.json
└── start_dev.py
```
