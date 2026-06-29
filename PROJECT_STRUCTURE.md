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
│   │   ├── session_state_machine.md
│   │   └── ui_architecture.md
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
│   ├── AI_ENTRYPOINT.md          ← DEPRECATED (redirect stub)
│   ├── CONTEXT_MANIFEST.md        ← NEW: routing & context manifest
│   ├── EXECUTION_GUIDE.md
│   ├── ROADMAP.md
│   ├── SYSTEM_OVERVIEW.md         ← DEPRECATED (redirect stub)
│   └── context_loading.md         ← DEPRECATED (redirect stub)
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
│   │   │   ├── b3ca8ebd4f5b_add_ui_metadata_to_folders.py
│   │   │   ├── cc10f11a94ea_ui_overhaul_schema.py
│   │   │   ├── cc36f4cded66_add_insights_table.py
│   │   │   ├── dbd6bc88be81_add_subject_id_and_task_id_to_notes.py
│   │   │   ├── deed4964a275_add_llm_settings_to_users.py
│   │   │   ├── f4ebd962a04c_update_users_table.py
│   │   │   └── f9d4e68d221f_add_ui_metadata_to_notes.py
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
│   │   │   ├── tests/
│   │   │   │   ├── unit/
│   │   │   │   │   └── test_notes_service.py
│   │   │   │   └── run_tests.py
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
│   ├── tests/
│   │   └── test_versions.py
│   ├── __init__.py
│   ├── alembic.ini
│   ├── init_db.py
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
│   │   │   │   │   │   ├── ColorInsertGroups.tsx
│   │   │   │   │   │   ├── FormatAlignGroups.tsx
│   │   │   │   │   │   ├── ListBlockGroups.tsx
│   │   │   │   │   │   ├── README.md
│   │   │   │   │   │   ├── ToolbarButton.tsx
│   │   │   │   │   │   ├── ToolbarContext.tsx
│   │   │   │   │   │   └── highlight-comment-picker.tsx
│   │   │   │   │   ├── BackgroundCanvas.tsx
│   │   │   │   │   ├── BacklinksPanel.tsx
│   │   │   │   │   ├── BlockDragHandle.tsx
│   │   │   │   │   ├── CanvasStatusBar.tsx
│   │   │   │   │   ├── CanvasToolbar.tsx
│   │   │   │   │   ├── ChartToolbar.tsx
│   │   │   │   │   ├── CsvImportModal.tsx
│   │   │   │   │   ├── DiagramToolbar.tsx
│   │   │   │   │   ├── EditorHeader.tsx
│   │   │   │   │   ├── EditorToolbar.tsx
│   │   │   │   │   ├── FloatingTOC.tsx
│   │   │   │   │   ├── KeyboardShortcutsModal.tsx
│   │   │   │   │   ├── MagicGloss.ts
│   │   │   │   │   ├── NetworkGraphModal.tsx
│   │   │   │   │   ├── NoteBookshelf.tsx
│   │   │   │   │   ├── NoteCanvas.tsx
│   │   │   │   │   ├── NoteCanvasSidebar.tsx
│   │   │   │   │   ├── NoteCardGrid.tsx
│   │   │   │   │   ├── NoteCoverDashboard.tsx
│   │   │   │   │   ├── NoteDashboard.tsx
│   │   │   │   │   ├── NotePickerModal.tsx
│   │   │   │   │   ├── NoteSettingsPanel.tsx
│   │   │   │   │   ├── QuickCaptureModal.tsx
│   │   │   │   │   ├── SlashMenu.tsx
│   │   │   │   │   ├── SpreadsheetModal.tsx
│   │   │   │   │   ├── TemplatePickerModal.tsx
│   │   │   │   │   ├── TiptapEditor.tsx
│   │   │   │   │   ├── VersionHistoryPanel.tsx
│   │   │   │   │   └── WorkspaceSidebar.tsx
│   │   │   │   ├── planner/
│   │   │   │   │   ├── BacklogSidebar.tsx
│   │   │   │   │   ├── CalendarGrid.tsx
│   │   │   │   │   ├── RolloverPopup.tsx
│   │   │   │   │   ├── SubjectCard.tsx
│   │   │   │   │   ├── TaskBlock.tsx
│   │   │   │   │   └── TaskQuickPanel.tsx
│   │   │   │   ├── search/
│   │   │   │   │   └── GlobalSearchModal.tsx
│   │   │   │   └── tasks/
│   │   │   │       └── TaskModal.tsx
│   │   │   ├── room/
│   │   │   │   ├── GlassCard.tsx
│   │   │   │   ├── HudOverlay.tsx
│   │   │   │   ├── InteractiveRoomEngine.tsx
│   │   │   │   ├── ModuleTransition.tsx
│   │   │   │   └── QuickToast.tsx
│   │   │   └── ui/
│   │   │       ├── GlassCard.tsx
│   │   │       ├── RadialNavMenu.tsx
│   │   │       ├── button.tsx
│   │   │       ├── checkbox.tsx
│   │   │       ├── dialog.tsx
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
│   │   │   ├── useBatteryPerformance.ts
│   │   │   ├── useNoteKeyboardShortcuts.ts
│   │   │   ├── useRealtimeEvents.ts
│   │   │   ├── useRealtimeTaskStatus.ts
│   │   │   ├── useStrictFocus.ts
│   │   │   └── useTypingPerformance.ts
│   │   ├── lib/
│   │   │   ├── tiptap/
│   │   │   │   ├── slash-command/
│   │   │   │   │   ├── extension.ts
│   │   │   │   │   └── items.ts
│   │   │   │   ├── MentionSuggestionList.tsx
│   │   │   │   ├── WikilinkSuggestionList.tsx
│   │   │   │   ├── audio-block.tsx
│   │   │   │   ├── bento-grid-block.tsx
│   │   │   │   ├── bidirectional-link.ts
│   │   │   │   ├── bookmark-block.tsx
│   │   │   │   ├── calendar-widget.tsx
│   │   │   │   ├── callout-block.tsx
│   │   │   │   ├── card-grid-block.tsx
│   │   │   │   ├── chart-block.tsx
│   │   │   │   ├── code-block-enhanced.tsx
│   │   │   │   ├── columns-block.tsx
│   │   │   │   ├── custom-image.tsx
│   │   │   │   ├── diagram-block.tsx
│   │   │   │   ├── embed-block.tsx
│   │   │   │   ├── flashcard-block.tsx
│   │   │   │   ├── focus-reading.ts
│   │   │   │   ├── font-size.ts
│   │   │   │   ├── inline-comment.ts
│   │   │   │   ├── math-block.tsx
│   │   │   │   ├── mention-suggestion.ts
│   │   │   │   ├── page-node.ts
│   │   │   │   ├── page-stamp-link.ts
│   │   │   │   ├── pagination-plugin.ts
│   │   │   │   ├── pdf-block.tsx
│   │   │   │   ├── profile-card-block.tsx
│   │   │   │   ├── quiz-block.tsx
│   │   │   │   ├── section-block.tsx
│   │   │   │   ├── smart-mention.ts
│   │   │   │   ├── smart-task-node.tsx
│   │   │   │   ├── smart-timer-node.tsx
│   │   │   │   ├── tab-group.tsx
│   │   │   │   ├── timestamp-link.ts
│   │   │   │   ├── toggle-block.tsx
│   │   │   │   ├── wikilink-suggestion.ts
│   │   │   │   └── youtube-block.tsx
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
│   │       ├── planner.ts
│   │       └── room.ts
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
│   ├── run_unit_tests.py
│   ├── test_editor.py
│   ├── test_insights_flow.py
│   ├── test_note_upload.py
│   ├── test_pagination_result.png
│   ├── test_script.py
│   └── verify_phase3_phase4.py
├── scripts/
│   ├── archive_code.py
│   ├── archive_md.py
│   ├── archive_md_v2.py
│   ├── archive_notes.py
│   ├── consolidate_docs.py
│   ├── extract_note_module.py
│   ├── mass_extract.py
│   └── test_notes.py
├── static_cdn/
│   └── note_images/
│       └── c65ab3b8-eede-433b-9583-8f67a9c80c38.png
├── tests/
├── .agents/
│   └── AGENTS.md
├── .cursorrules
├── .env
├── .env.example
├── .gitignore
├── DESIGN.md
├── PRODUCT.md
├── PROJECT_STRUCTURE.md
├── TEAM_BOUNDARIES.md
├── ANTIGRAVITY_PROMPT.md
├── JULES_PROMPT.md
├── SYSTEM_UPGRADE_SPEC.md
├── db_hotfix.py
├── docker-compose.yml
├── pyrightconfig.json
└── start_dev.py
```
