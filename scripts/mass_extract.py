import os
import zipfile
from pathlib import Path

def read_file_content(path):
    """Robustly read file content trying different encodings."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        pass
    
    try:
        with open(path, "r", encoding="cp1252") as f:
            return f.read()
    except UnicodeDecodeError:
        pass
        
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()

def mass_extract():
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    
    targets = {
        "D:\\planner.zip": [
            "backend_features_task_management_api_dependencies.py.txt",
            "backend_features_task_management_api_router.py.txt",
            "backend_features_task_management_application_service.py.txt",
            "backend_features_task_management_domain_models.py.txt",
            "backend_features_task_management_infrastructure_orm.py.txt",
            "backend_features_task_management_infrastructure_repository.py.txt",
            "frontend_src_app_(dashboard)_tasks_page.tsx.txt",
            "frontend_src_features_task_management_api_taskApi.ts.txt",
            "frontend_src_components_features_planner_BacklogSidebar.tsx.txt",
            "frontend_src_components_features_planner_CalendarGrid.tsx.txt",
            "frontend_src_components_features_planner_RolloverPopup.tsx.txt",
            "frontend_src_components_features_planner_SubjectCard.tsx.txt",
            "frontend_src_components_features_planner_TaskBlock.tsx.txt",
            "frontend_src_components_features_planner_TaskQuickPanel.tsx.txt",
            "frontend_src_components_features_tasks_TaskModal.tsx.txt",
            "frontend_src_hooks_useRealtimeTaskStatus.ts.txt",
            "frontend_src_lib_calendar-utils.ts.txt",
            "frontend_src_store_useTaskStore.ts.txt",
            "frontend_src_store_useSubjectStore.ts.txt",
            "frontend_src_types_planner.ts.txt",
        ],
        "D:\\focus.zip": [
            "backend_features_study_sessions_api_router.py.txt",
            "backend_features_study_sessions_application_service.py.txt",
            "backend_features_study_sessions_domain_exceptions.py.txt",
            "backend_features_study_sessions_domain_interfaces.py.txt",
            "backend_features_study_sessions_domain_models.py.txt",
            "backend_features_study_sessions_infrastructure_orm.py.txt",
            "backend_features_study_sessions_infrastructure_repository.py.txt",
            "backend_features_study_sessions_tests_unit_test_session_service.py.txt",
            "backend_features_study_sessions_worker.py.txt",
            "frontend_src_app_(dashboard)_focus_page.tsx.txt",
            "frontend_src_features_study_sessions_api_sessionApi.ts.txt",
            "frontend_src_features_study_sessions_components_DeepFocusWorkspace.tsx.txt",
            "frontend_src_features_study_sessions_components_FocusSessionManager.tsx.txt",
            "frontend_src_features_study_sessions_components_PrepareSpace.tsx.txt",
            "frontend_src_features_study_sessions_components_SoundscapePlayer.tsx.txt",
            "frontend_src_features_study_sessions_components_ZenClock.tsx.txt",
            "frontend_src_features_study_sessions_hooks_useStudySession.ts.txt",
            "frontend_src_features_study_sessions_index.ts.txt",
            "frontend_src_features_study_sessions_types_index.ts.txt",
            "frontend_src_hooks_useStrictFocus.ts.txt",
            "frontend_src_lib_audioDb.ts.txt",
            "frontend_src_store_useFocusStore.ts.txt",
        ],
        "D:\\note.zip": [
            "backend_features_notes_api_router.py.txt",
            "backend_features_notes_application_service.py.txt",
            "backend_features_notes_domain_schemas.py.txt",
            "backend_features_notes_infrastructure_models.py.txt",
            "frontend_src_app_(dashboard)_notes_page.tsx.txt",
            "frontend_src_components_features_notes_ChartToolbar.tsx.txt",
            "frontend_src_components_features_notes_DiagramToolbar.tsx.txt",
            "frontend_src_components_features_notes_EditorHeader.tsx.txt",
            "frontend_src_components_features_notes_EditorToolbar.tsx.txt",
            "frontend_src_components_features_notes_MagicGloss.ts.txt",
            "frontend_src_components_features_notes_NetworkGraphModal.tsx.txt",
            "frontend_src_components_features_notes_PageSidebar.tsx.txt",
            "frontend_src_components_features_notes_SpreadsheetModal.tsx.txt",
            "frontend_src_components_features_notes_StudioToolbar.tsx.txt",
            "frontend_src_components_features_notes_TiptapEditor.tsx.txt",
            "frontend_src_components_features_notes_WorkspaceSidebar.tsx.txt",
            "frontend_src_components_features_notes_toolbar_ColorInsertGroups.tsx.txt",
            "frontend_src_components_features_notes_toolbar_FormatAlignGroups.tsx.txt",
            "frontend_src_components_features_notes_toolbar_ListBlockGroups.tsx.txt",
            "frontend_src_components_features_notes_toolbar_ToolbarButton.tsx.txt",
            "frontend_src_components_features_notes_toolbar_ToolbarContext.tsx.txt",
            "frontend_src_components_features_notes_toolbar_highlight-comment-picker.tsx.txt",
            "frontend_src_lib_tiptap_MentionSuggestionList.tsx.txt",
            "frontend_src_lib_tiptap_bidirectional-link.ts.txt",
            "frontend_src_lib_tiptap_chart-block.tsx.txt",
            "frontend_src_lib_tiptap_diagram-block.tsx.txt",
            "frontend_src_lib_tiptap_font-size.ts.txt",
            "frontend_src_lib_tiptap_inline-comment.ts.txt",
            "frontend_src_lib_tiptap_mention-suggestion.ts.txt",
            "frontend_src_lib_tiptap_pagination-plugin.ts.txt",
            "frontend_src_lib_tiptap_smart-mention.ts.txt",
            "frontend_src_store_useNoteStore.ts.txt",
            "frontend_src_store_useEditorBlockStore.ts.txt",
            "frontend_src_types_notes.ts.txt",
        ],
        "D:\\core.zip": [
            "backend_app_core_base.py.txt",
            "backend_app_core_celery_app.py.txt",
            "backend_app_core_database.py.txt",
            "backend_app_main.py.txt",
            "backend_features_user_auth_api_dependencies.py.txt",
            "backend_features_realtime_api_router.py.txt",
            "db_hotfix.py.txt",
            "frontend_src_lib_api-utils.ts.txt",
            "frontend_src_lib_utils.ts.txt",
            "frontend_src_store_useAppStore.ts.txt",
            "frontend_src_hooks_useRealtimeEvents.ts.txt",
            "frontend_src_components_features_search_GlobalSearchModal.tsx.txt",
            "frontend_src_components_ui_GlassCard.tsx.txt",
            "frontend_src_components_ui_button.tsx.txt",
            "frontend_src_components_ui_input.tsx.txt",
            "frontend_src_components_ui_popover.tsx.txt",
            "frontend_src_components_ui_select.tsx.txt",
            "frontend_src_components_ui_separator.tsx.txt",
            "frontend_src_components_ui_toggle.tsx.txt",
            "frontend_src_components_ui_tooltip.tsx.txt",
        ]
    }
    
    # 1. Gather all files in the project to match against
    print("Scanning project files...")
    all_files = []
    # Using rglob to get all files
    for p in project_root.rglob("*"):
        if p.is_file() and not any(part in p.parts for part in ['.git', 'node_modules', '__pycache__', '.next', 'venv', '.venv']):
            all_files.append(p)
            
    # Create a mapping from flat_name to actual path
    flat_to_path = {}
    for p in all_files:
        try:
            rel_path = p.relative_to(project_root)
            flat_name = str(rel_path).replace(os.sep, '_').replace('/', '_')
            flat_to_path[flat_name] = p
        except ValueError:
            pass

    # 2. Process each zip target
    for zip_file_path, file_list in targets.items():
        print(f"\\nProcessing {zip_file_path}...")
        
        output_zip = Path(zip_file_path)
        output_zip.parent.mkdir(parents=True, exist_ok=True)
        
        missing_files = []
        added_count = 0
        
        with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zipf:
            for target_name in file_list:
                # The target name ends with .txt, so strip it to find the original flat name
                if not target_name.endswith('.txt'):
                    print(f"  Warning: {target_name} does not end with .txt")
                    continue
                    
                flat_name = target_name[:-4] # remove .txt
                
                if flat_name in flat_to_path:
                    src_path = flat_to_path[flat_name]
                    try:
                        content = read_file_content(src_path)
                        zipf.writestr(target_name, content)
                        added_count += 1
                        print(f"  Added: {flat_name} -> {target_name}")
                    except Exception as e:
                        print(f"  Error reading {src_path}: {e}")
                else:
                    missing_files.append(target_name)
                    print(f"  Missing: Could not locate source for {target_name}")
                    
        print(f"Finished {zip_file_path}: added {added_count}/{len(file_list)} files.")
        if missing_files:
            print(f"Missing files for {zip_file_path}: {missing_files}")

if __name__ == "__main__":
    mass_extract()
