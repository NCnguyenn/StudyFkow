import os
import zipfile
import ast
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

def is_non_trivial_init_py(path):
    """Check if __init__.py contains real logic or is just standard import boilerplate."""
    try:
        content = read_file_content(path)
        tree = ast.parse(content)
        # Check if there are function or class definitions
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                return True
        return False
    except Exception:
        # Fallback to simple keyword check
        try:
            content = read_file_content(path)
            lines = [l.strip() for l in content.splitlines() if l.strip() and not l.strip().startswith("#")]
            for line in lines:
                if line.startswith("def ") or line.startswith("class "):
                    return True
        except Exception:
            pass
    return False

def archive_code():
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    
    ignore_dirs = {
        'node_modules', 
        '.git', 
        '__pycache__', 
        '.next', 
        'alembic',
        'venv',
        '.venv',
        'scratch',
        'scripts'
    }
    
    allowed_extensions = {'.py', '.ts', '.tsx'}
    
    print(f"Scanning for core logic files in: {project_root}")
    
    matched_files = []
    
    for path in project_root.rglob('*'):
        if not path.is_file():
            continue
            
        # Check if any part of the path is in ignore_dirs
        try:
            rel_parts = path.relative_to(project_root).parts
        except ValueError:
            continue
            
        if any(part in ignore_dirs for part in rel_parts):
            continue
            
        # Extension filter
        ext = path.suffix.lower()
        if ext not in allowed_extensions:
            continue
            
        # File-specific exclusions
        filename = path.name.lower()
        
        # 1. Trivial __init__.py files
        if filename == "__init__.py":
            if not is_non_trivial_init_py(path):
                continue
                
        # 2. Config files
        # Check if file name contains "config" (e.g., tailwind.config.ts, next.config.ts)
        if "config" in filename:
            continue
            
        matched_files.append(path)
        
    print(f"Found {len(matched_files)} files matching the criteria.")
    
    output_zip = Path(r"D:\code.zip")
    print(f"Writing flat archive to: {output_zip}")
    
    try:
        output_zip.parent.mkdir(parents=True, exist_ok=True)
        
        with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for path in matched_files:
                # Relative path
                rel_path = path.relative_to(project_root)
                # Flatten the filename by replacing directory separators with underscores
                flat_name = str(rel_path).replace(os.sep, '_').replace('/', '_') + '.txt'
                
                # Read content
                content = read_file_content(path)
                
                # Write to zip
                zipf.writestr(flat_name, content)
                print(f"Added: {rel_path} -> {flat_name}")
                
        print(f"\nSuccessfully archived {len(matched_files)} files to {output_zip}")
    except Exception as e:
        print(f"Error during archival: {e}")

if __name__ == "__main__":
    archive_code()
