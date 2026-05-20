import os
import zipfile
import glob

BASE_DIR = r"D:\Personal_Project\AI_StudyFlow"
EXPORT_DIR = os.path.join(BASE_DIR, "export_temp")

if not os.path.exists(EXPORT_DIR):
    os.makedirs(EXPORT_DIR)

def get_group_files(pattern):
    # Support both direct files and directory patterns
    files = []
    if "*" in pattern:
        full_pattern = os.path.join(BASE_DIR, pattern.replace("/", os.sep))
        files = [os.path.relpath(f, BASE_DIR).replace(os.sep, "/") for f in glob.glob(full_pattern)]
    else:
        files = [pattern]
    return files

# The user explicitly listed some files and groups. I will follow the groups but use globbing for "All files inside..."
groups_config = {
    "01_Architecture_and_Features.md": [
        "PROJECT_STRUCTURE.md",
        ".ai/architecture/ai_pipeline.md",
        ".ai/architecture/api_contracts.md",
        ".ai/architecture/impact_map.md",
        ".ai/features/FEATURE_BOUNDARIES.md"
    ],
    "02_Rules_and_Governance.md": [
        ".ai/rules/*.md"
    ],
    "03_Workflows_and_Testing.md": [
        ".ai/testing/*.md",
        ".ai/workflows/*.md"
    ],
    "04_Active_Memory.md": [
        ".ai/memory/*.md"
    ]
}

def merge_files(target_name, source_patterns):
    target_path = os.path.join(EXPORT_DIR, target_name)
    merged_count = 0
    with open(target_path, 'w', encoding='utf-8') as outfile:
        for pattern in source_patterns:
            rel_paths = get_group_files(pattern)
            for rel_path in sorted(rel_paths): # Sort for consistency
                abs_path = os.path.join(BASE_DIR, rel_path.replace("/", os.sep))
                if os.path.exists(abs_path) and os.path.isfile(abs_path):
                    outfile.write("// ==========================================\n")
                    outfile.write(f"// SOURCE FILE: {rel_path}\n")
                    outfile.write("// ==========================================\n\n")
                    with open(abs_path, 'r', encoding='utf-8') as infile:
                        outfile.write(infile.read())
                    outfile.write("\n\n")
                    merged_count += 1
                else:
                    print(f"Warning: File or pattern not found: {rel_path}")
    print(f"Created {target_name} with {merged_count} source files.")

for target, patterns in groups_config.items():
    merge_files(target, patterns)

# Create ZIP
zip_path = r"D:\Md.zip"
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for target in groups_config.keys():
        file_path = os.path.join(EXPORT_DIR, target)
        zipf.write(file_path, target)

print(f"Successfully created {zip_path}")
