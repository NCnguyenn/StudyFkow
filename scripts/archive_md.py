import os
import zipfile
from pathlib import Path

def archive_md_files(root_dir, output_zip):
    """
    Archives all .md files in the project, preserving structure.
    Ignores specified directories.
    """
    root_path = Path(root_dir).resolve()
    ignore_dirs = {
        'node_modules', 
        '.git', 
        '__pycache__', 
        '.next', 
        'alembic',
        'venv',
        '.pytest_cache'
    }

    print(f"Scanning for .md files in: {root_path}")
    
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        count = 0
        for path in root_path.rglob('*.md'):
            # Check if any part of the path is in ignore_dirs
            if any(part in ignore_dirs for part in path.parts):
                continue
            
            # Calculate relative path for storage in zip
            rel_path = path.relative_to(root_path)
            zipf.write(path, rel_path)
            print(f"Added: {rel_path}")
            count += 1
            
    print(f"\nSuccessfully archived {count} files to {output_zip}")

if __name__ == "__main__":
    PROJECT_ROOT = os.getcwd()
    OUTPUT_FILE = r"D:\md.zip"
    
    try:
        archive_md_files(PROJECT_ROOT, OUTPUT_FILE)
    except Exception as e:
        print(f"Error during archival: {e}")
