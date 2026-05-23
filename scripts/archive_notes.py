import os
import zipfile
from pathlib import Path

FILES_MAPPING = {
    # Backend Notes Module
    "backend_features_notes_api_router.py": "backend/features/notes/api/router.py",
    "backend_features_notes_application_service.py": "backend/features/notes/application/service.py",
    "backend_features_notes_domain_schemas.py": "backend/features/notes/domain/schemas.py",
    "backend_features_notes_infrastructure_models.py": "backend/features/notes/infrastructure/models.py",
    
    # Frontend (Page, Store & Types)
    "frontend_src_app_(dashboard)_notes_page.tsx": "frontend/src/app/(dashboard)/notes/page.tsx",
    "frontend_src_store_useNoteStore.ts": "frontend/src/store/useNoteStore.ts",
    "frontend_src_store_useEditorBlockStore.ts": "frontend/src/store/useEditorBlockStore.ts",
    "frontend_src_types_notes.ts": "frontend/src/types/notes.ts",
    
    # Frontend (Editor & Toolbars)
    "frontend_src_components_features_notes_TiptapEditor.tsx": "frontend/src/components/features/notes/TiptapEditor.tsx",
    "frontend_src_components_features_notes_EditorHeader.tsx": "frontend/src/components/features/notes/EditorHeader.tsx",
    "frontend_src_components_features_notes_EditorToolbar.tsx": "frontend/src/components/features/notes/EditorToolbar.tsx",
    "frontend_src_components_features_notes_StudioToolbar.tsx": "frontend/src/components/features/notes/StudioToolbar.tsx",
    "frontend_src_components_features_notes_WorkspaceSidebar.tsx": "frontend/src/components/features/notes/WorkspaceSidebar.tsx",
    "frontend_src_components_features_notes_NetworkGraphModal.tsx": "frontend/src/components/features/notes/NetworkGraphModal.tsx",
    
    # Frontend (Diagram, Chart & Spreadsheet)
    "frontend_src_lib_tiptap_diagram-block.tsx": "frontend/src/lib/tiptap/diagram-block.tsx",
    "frontend_src_components_features_notes_DiagramToolbar.tsx": "frontend/src/components/features/notes/DiagramToolbar.tsx",
    "frontend_src_lib_tiptap_chart-block.tsx": "frontend/src/lib/tiptap/chart-block.tsx",
    "frontend_src_components_features_notes_ChartToolbar.tsx": "frontend/src/components/features/notes/ChartToolbar.tsx",
    "frontend_src_components_features_notes_SpreadsheetModal.tsx": "frontend/src/components/features/notes/SpreadsheetModal.tsx",
    
    # Frontend (Tiptap Editor Extensions & Tools)
    "frontend_src_components_features_notes_MagicGloss.ts": "frontend/src/components/features/notes/MagicGloss.ts",
    "frontend_src_lib_tiptap_bidirectional-link.ts": "frontend/src/lib/tiptap/bidirectional-link.ts",
    "frontend_src_lib_tiptap_font-size.ts": "frontend/src/lib/tiptap/font-size.ts",
    "frontend_src_lib_tiptap_inline-comment.ts": "frontend/src/lib/tiptap/inline-comment.ts",
    "frontend_src_lib_tiptap_mention-suggestion.ts": "frontend/src/lib/tiptap/mention-suggestion.ts",
    "frontend_src_lib_tiptap_smart-mention.ts": "frontend/src/lib/tiptap/smart-mention.ts",
    "frontend_src_lib_tiptap_MentionSuggestionList.tsx": "frontend/src/lib/tiptap/MentionSuggestionList.tsx"
}

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

def archive_explicit_notes():
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    
    output_zip = Path(r"D:\note.zip")
    print(f"Archiving explicit Note module files to flat ZIP: {output_zip}")
    
    try:
        output_zip.parent.mkdir(parents=True, exist_ok=True)
        
        with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
            count = 0
            for flat_name, rel_path_str in FILES_MAPPING.items():
                # Reconstruct source path
                src_path = project_root / rel_path_str
                
                if not src_path.exists():
                    print(f"Warning: File not found: {rel_path_str}")
                    continue
                    
                # Read content
                content = read_file_content(src_path)
                
                # Append .txt to flattened name
                archive_name = flat_name + ".txt"
                
                # Write to zip
                zipf.writestr(archive_name, content)
                print(f"Added: {rel_path_str} -> {archive_name}")
                count += 1
                
        print(f"\nSuccessfully archived {count} of {len(FILES_MAPPING)} files to {output_zip}")
    except Exception as e:
        print(f"Error during archival: {e}")

if __name__ == "__main__":
    archive_explicit_notes()
