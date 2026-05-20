import os
import zipfile
import glob

# Project paths
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUTPUT_ZIP_PATH = r"D:\md.zip"

# Group definitions: key is output filename, value is a list of directory/file source patterns relative to root
GROUPS = {
    "Consolidated_Rules.md": [
        os.path.join(".ai", "rules", "**", "*.md")
    ],
    "Consolidated_Workflows.md": [
        os.path.join(".ai", "workflows", "**", "*.md")
    ],
    "Consolidated_Architecture_ADR.md": [
        os.path.join(".ai", "architecture", "**", "*.md"),
        os.path.join(".ai", "adr", "**", "*.md")
    ],
    "Consolidated_Memory_Logs.md": [
        os.path.join(".ai", "memory", "**", "*.md"),
        os.path.join(".ai", "logs", "**", "*.md")
    ],
    "Consolidated_Project_Overview.md": [
        os.path.join(".ai", "ROADMAP.md"),
        os.path.join(".ai", "SYSTEM_OVERVIEW.md"),
        os.path.join(".ai", "AI_ENTRYPOINT.md"),
        "PROJECT_STRUCTURE.md"
    ]
}

def consolidate_group(group_name, patterns):
    """Gathers and merges markdown contents matching the patterns for a group."""
    print(f"Consolidating group: {group_name}...")
    merged_content = []
    
    # Resolve all files
    matched_files = []
    for pattern in patterns:
        full_pattern = os.path.join(PROJECT_ROOT, pattern)
        # Glob recursively if ** is in pattern, otherwise simple glob
        files = glob.glob(full_pattern, recursive=True)
        matched_files.extend(files)
    
    # Deduplicate while preserving order
    seen = set()
    deduped_files = []
    for f in matched_files:
        normalized = os.path.abspath(f)
        if normalized not in seen and os.path.isfile(normalized):
            seen.add(normalized)
            deduped_files.append(normalized)
            
    # Sort files by name to ensure stable, predictable merging order
    deduped_files.sort()
            
    for file_path in deduped_files:
        rel_path = os.path.relpath(file_path, PROJECT_ROOT)
        print(f"  -> Merging: {rel_path}")
        try:
            # Fallback to ignore decoding errors for legacy log artifacts
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            # Formatting separator
            header = f"\n\n--- FILE: {rel_path} ---\n\n"
            merged_content.append(header)
            merged_content.append(content)
        except Exception as e:
            print(f"  [ERROR] Could not read {rel_path}: {e}")
            
    return "".join(merged_content)

def main():
    temp_files = []
    
    try:
        # Step 1: Consolidate content and write to temporary root files
        for group_name, patterns in GROUPS.items():
            content = consolidate_group(group_name, patterns)
            temp_path = os.path.join(PROJECT_ROOT, group_name)
            
            with open(temp_path, "w", encoding="utf-8") as f:
                f.write(content)
            temp_files.append(temp_path)
            print(f"Created consolidated file: {group_name} ({len(content)} bytes)")
            
        # Step 2: Zip the consolidated files in a flat structure
        print(f"\nPackaging into flat ZIP at: {OUTPUT_ZIP_PATH}...")
        with zipfile.ZipFile(OUTPUT_ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in temp_files:
                filename = os.path.basename(file_path)
                zipf.write(file_path, arcname=filename)
                print(f"  -> Zipped flat: {filename}")
                
        print("\nPackaging completed successfully!")
        
    finally:
        # Step 3: Cleanup temporary consolidated files
        print("\nCleaning up temporary consolidated files...")
        for file_path in temp_files:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"  -> Removed: {os.path.basename(file_path)}")
                
if __name__ == "__main__":
    main()
