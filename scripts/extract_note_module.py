import os
import zipfile
import shutil
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

def extract_note_module():
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    
    # Map from user-provided flat filename representation to actual relative repo path
    targets = {
        "frontend_src_components_features_notes_EditorToolbar.tsx": "frontend/src/components/features/notes/EditorToolbar.tsx",
        "frontend_src_components_features_notes_StudioToolbar.tsx": "frontend/src/components/features/notes/StudioToolbar.tsx",
        "frontend_src_components_features_notes_toolbar_highlight-comment-picker.tsx": "frontend/src/components/features/notes/toolbar/highlight-comment-picker.tsx",
        "frontend_src_components_features_notes_EditorHeader.tsx": "frontend/src/components/features/notes/EditorHeader.tsx",
        "frontend_src_components_features_notes_ChartToolbar.tsx": "frontend/src/components/features/notes/ChartToolbar.tsx",
        "frontend_src_components_features_notes_DiagramToolbar.tsx": "frontend/src/components/features/notes/DiagramToolbar.tsx",
        "frontend_src_components_features_notes_SpreadsheetModal.tsx": "frontend/src/components/features/notes/SpreadsheetModal.tsx"
    }
    
    temp_dir = project_root / "temp_note_docs"
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    generated_files = []
    
    print("Reading and copying specific Note module files...")
    for target_name, rel_path in targets.items():
        src_path = project_root / rel_path
        if not src_path.exists():
            print(f"Warning: File {rel_path} not found!")
            continue
            
        flat_name = f"{target_name}.txt"
        dest_path = temp_dir / flat_name
        
        try:
            content = read_file_content(src_path)
            with open(dest_path, "w", encoding="utf-8") as f:
                f.write(content)
            generated_files.append(dest_path)
            print(f"Copied: {rel_path} -> {flat_name}")
        except Exception as e:
            print(f"Error copying {rel_path}: {e}")
            
    output_zip = Path(r"D:\note.zip")
    print(f"\nCompressing to flat archive: {output_zip}")
    
    try:
        output_zip.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zipf:
            for p in generated_files:
                zipf.write(p, p.name)
                print(f"Zipped: {p.name}")
        print(f"\nSuccessfully created flat ZIP archive at {output_zip}")
    except Exception as e:
        print(f"Error during compression: {e}")
        
    # Clean up temp folder
    print("\nCleaning up temporary files...")
    try:
        shutil.rmtree(temp_dir)
        print("Cleanup completed.")
    except Exception as e:
        print(f"Error during cleanup of {temp_dir}: {e}")

if __name__ == "__main__":
    extract_note_module()
