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
    
    targets = [
        "backend/features/notes/api/router.py",
        "backend/features/notes/application/service.py",
        "backend/features/notes/domain/schemas.py",
        "backend/features/notes/infrastructure/models.py",
        "frontend/src/app/(dashboard)/notes/page.tsx",
        "frontend/src/components/features/notes/ChartToolbar.tsx",
        "frontend/src/components/features/notes/DiagramToolbar.tsx",
        "frontend/src/components/features/notes/EditorHeader.tsx",
        "frontend/src/components/features/notes/EditorToolbar.tsx",
        "frontend/src/components/features/notes/MagicGloss.ts",
        "frontend/src/components/features/notes/NetworkGraphModal.tsx",
        "frontend/src/components/features/notes/SpreadsheetModal.tsx",
        "frontend/src/components/features/notes/StudioToolbar.tsx",
        "frontend/src/components/features/notes/TiptapEditor.tsx",
        "frontend/src/components/features/notes/WorkspaceSidebar.tsx",
        "frontend/src/lib/tiptap/chart-block.tsx",
        "frontend/src/lib/tiptap/diagram-block.tsx",
        "frontend/src/store/useEditorBlockStore.ts",
        "frontend/src/store/useNoteStore.ts",
        "frontend/src/types/notes.ts"
    ]
    
    temp_dir = project_root / "temp_note_docs"
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    generated_files = []
    
    print("Reading and copying Note module files...")
    for t in targets:
        src_path = project_root / t
        if not src_path.exists():
            print(f"Warning: File {t} not found!")
            continue
            
        # Convert folder directory separators to underscores and append .txt
        flat_name = t.replace('/', '_').replace('\\', '_') + '.txt'
        dest_path = temp_dir / flat_name
        
        try:
            content = read_file_content(src_path)
            with open(dest_path, "w", encoding="utf-8") as f:
                f.write(content)
            generated_files.append(dest_path)
            print(f"Copied: {t} -> {flat_name}")
        except Exception as e:
            print(f"Error copying {t}: {e}")
            
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
