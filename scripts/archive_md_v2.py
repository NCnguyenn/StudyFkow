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

def create_consolidated_md():
    # Base paths
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    
    # We will create temporary consolidated files in a temp folder
    temp_dir = project_root / "temp_consolidated_docs"
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    # Define groups
    groups = {
        "Consolidated_Rules.md": {
            "dirs": [project_root / ".ai" / "rules"],
            "files": []
        },
        "Consolidated_Workflows.md": {
            "dirs": [project_root / ".ai" / "workflows"],
            "files": []
        },
        "Consolidated_Architecture_ADR.md": {
            "dirs": [
                project_root / ".ai" / "architecture",
                project_root / ".ai" / "adr"
            ],
            "files": []
        },
        "Consolidated_Memory_Logs.md": {
            "dirs": [
                project_root / ".ai" / "memory",
                project_root / ".ai" / "logs"
            ],
            "files": []
        },
        "Consolidated_Project_Overview.md": {
            "dirs": [],
            "files": [
                "ROADMAP.md",
                "SYSTEM_OVERVIEW.md",
                "AI_ENTRYPOINT.md",
                "PROJECT_STRUCTURE.md"
            ]
        }
    }
    
    output_files = []
    
    # Process each group
    for consolidated_name, sources in groups.items():
        consolidated_path = temp_dir / consolidated_name
        merged_content = []
        
        # 1. Gather all files from directories
        file_paths = []
        for d in sources["dirs"]:
            if d.exists() and d.is_dir():
                # Get all .md files recursively
                for p in d.rglob("*.md"):
                    file_paths.append(p)
                    
        # 2. Gather specific files
        for f_name in sources["files"]:
            # Search at project_root and project_root / .ai
            found = False
            for parent in [project_root, project_root / ".ai"]:
                p = parent / f_name
                if p.exists() and p.is_file():
                    file_paths.append(p)
                    found = True
                    break
            if not found:
                print(f"Warning: {f_name} not found at root or in .ai/")
                
        # Deduplicate and sort file paths to keep order deterministic and stable
        if consolidated_name == "Consolidated_Project_Overview.md":
            # For the overview, preserve the order specified in sources["files"] if possible
            ordered_paths = []
            for f_name in sources["files"]:
                for p in file_paths:
                    if p.name == f_name and p not in ordered_paths:
                        ordered_paths.append(p)
            file_paths = ordered_paths
        else:
            file_paths = sorted(list(set(file_paths)))
            
        print(f"Group: {consolidated_name} - merging {len(file_paths)} files:")
        for p in file_paths:
            rel_path = p.relative_to(project_root).as_posix()
            print(f"  - {rel_path}")
            
            try:
                content = read_file_content(p)
                
                # Append separator and content
                merged_content.append(f"--- FILE: {rel_path} ---")
                merged_content.append(content)
                merged_content.append("") # extra newline
            except Exception as e:
                print(f"Error reading {p}: {e}")
                
        # Write merged content
        if merged_content:
            try:
                with open(consolidated_path, "w", encoding="utf-8") as f:
                    f.write("\n".join(merged_content))
                output_files.append(consolidated_path)
                print(f"Created: {consolidated_path.name}")
            except Exception as e:
                print(f"Error writing consolidated file {consolidated_name}: {e}")
        else:
            print(f"No files found for {consolidated_name}")
            
    # Zipping into D:\md.zip with FLAT structure
    output_zip = Path(r"D:\md.zip")
    print(f"\nCompressing consolidated files to {output_zip}...")
    
    try:
        # Ensure output directory exists
        output_zip.parent.mkdir(parents=True, exist_ok=True)
        
        with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zipf:
            for p in output_files:
                # Write with flat structure: p.name is just the file name
                zipf.write(p, p.name)
                print(f"Zipped: {p.name}")
                
        print(f"Successfully created archive at {output_zip}")
    except Exception as e:
        print(f"Error during compression: {e}")
        
    # Clean up temporary consolidated files
    print("\nCleaning up temporary files...")
    try:
        shutil.rmtree(temp_dir)
        print("Cleanup completed.")
    except Exception as e:
        print(f"Error during cleanup of {temp_dir}: {e}")

if __name__ == "__main__":
    create_consolidated_md()
