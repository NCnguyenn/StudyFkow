import os
import zipfile

# Project paths
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUTPUT_ZIP_PATH = r"D:\code.zip"

# Directories to exclude from traversal
EXCLUDED_DIRS = {
    "node_modules", ".git", "__pycache__", ".next", "alembic", "venv", ".venv", "scratch", "scripts"
}

# Config files or definitions to filter out
EXCLUDED_FILES = {
    "tailwind.config.ts", "postcss.config.js", "next-env.d.ts", "next.config.mjs"
}

def main():
    included_count = 0
    print(f"Starting core logic extraction from: {PROJECT_ROOT}...")
    
    with zipfile.ZipFile(OUTPUT_ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(PROJECT_ROOT):
            # Prune excluded directories in-place to avoid deep traversal
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
            
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                
                # Filter only logic extensions
                if ext not in {'.py', '.ts', '.tsx'}:
                    continue
                
                # Skip config files
                if file in EXCLUDED_FILES:
                    continue
                
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, PROJECT_ROOT)
                
                # Special handling for __init__.py: Exclude if empty or purely structural boilerplate (< 100 chars)
                if file == '__init__.py':
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read().strip()
                        if len(content) < 100:
                            continue
                    except Exception:
                        continue
                
                # Transform relative path into flat filename with underscores and append .txt
                # E.g., backend/app/main.py -> backend_app_main.py.txt
                flat_name = rel_path.replace(os.sep, '_') + '.txt'
                
                print(f"  -> Archiving: {rel_path} as {flat_name}")
                
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        file_content = f.read()
                    
                    # Add to zip with flattened filename directly from memory
                    zipf.writestr(flat_name, file_content)
                    included_count += 1
                except Exception as e:
                    print(f"  [ERROR] Failed to read/archive {rel_path}: {e}")
                    
    print(f"\nSuccessfully archived {included_count} logic files into flat ZIP at {OUTPUT_ZIP_PATH}!")

if __name__ == "__main__":
    main()
