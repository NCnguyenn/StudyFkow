"""
process_sprites.py — AI StudyFlow Sprite Processing Pipeline (v3.1)

Converts raw AI-generated composite images (white background) into individual
transparent WebP sprites for the isometric 3/4 study room.

Workflow:
  1. Read raw composite WebP/PNG images from input directory
  2. Convert to RGBA
  3. Remove white background (R >= 245, G >= 245, B >= 245 → alpha = 0)
  4. Anti-alias: edge pixels (240-244 range) get smooth alpha gradient
  5. Auto-crop transparent margins (trim to bounding box)
  6. Save as WebP RGBA quality=85

Usage:
  python scripts/process_sprites.py [--input scripts/raw_sprites] [--output frontend/public/assets/rooms/home]

Requirements:
  pip install Pillow
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow is required. Install it with: pip install Pillow")
    sys.exit(1)


# ─── Configuration ────────────────────────────────────────────────────────────

# RGB threshold for "white" background removal
WHITE_THRESHOLD = 245

# Near-white zone for anti-aliased edges (smooth alpha transition)
NEAR_WHITE_LOWER = 240
NEAR_WHITE_UPPER = 244

# Output WebP quality (0-100)
WEBP_QUALITY = 85


def remove_white_background(img: Image.Image) -> Image.Image:
    """
    Remove white/near-white background from an image.
    Returns RGBA image with transparent background.
    """
    # Ensure RGBA mode
    img = img.convert("RGBA")
    data = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = data[x, y]

            # Pure white → fully transparent
            if r >= WHITE_THRESHOLD and g >= WHITE_THRESHOLD and b >= WHITE_THRESHOLD:
                data[x, y] = (r, g, b, 0)

            # Near-white → partial transparency (anti-alias)
            elif (
                r >= NEAR_WHITE_LOWER
                and g >= NEAR_WHITE_LOWER
                and b >= NEAR_WHITE_LOWER
            ):
                # Compute alpha based on distance from white
                avg = (r + g + b) / 3
                alpha_ratio = 1.0 - (avg - NEAR_WHITE_LOWER) / (
                    WHITE_THRESHOLD - NEAR_WHITE_LOWER
                )
                new_alpha = int(min(a, alpha_ratio * 255))
                data[x, y] = (r, g, b, new_alpha)

    return img


def auto_crop(img: Image.Image) -> Image.Image:
    """
    Crop transparent margins to the bounding box of non-transparent pixels.
    """
    bbox = img.getbbox()
    if bbox:
        return img.crop(bbox)
    return img


def process_single_image(
    input_path: Path, output_dir: Path, name: str
) -> None:
    """Process a single raw sprite image -> transparent WebP."""
    print(f"  Processing: {input_path.name} -> {name}.webp")

    img = Image.open(input_path)
    img = remove_white_background(img)
    img = auto_crop(img)

    output_path = output_dir / f"{name}.webp"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, "WEBP", quality=WEBP_QUALITY, method=6)

    print(f"    Saved: {output_path} ({img.size[0]}x{img.size[1]})")


def main():
    parser = argparse.ArgumentParser(
        description="Process raw AI sprites → transparent WebP for AI StudyFlow"
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("scripts/raw_sprites"),
        help="Directory containing raw composite images",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("frontend/public/assets/rooms/home"),
        help="Output base directory (will create bg/ and fg/ subdirectories)",
    )
    args = parser.parse_args()

    input_dir = args.input
    output_dir = args.output

    if not input_dir.exists():
        print(f"ERROR: Input directory not found: {input_dir}")
        print("  Place raw AI-generated images in this directory first.")
        sys.exit(1)

    # Find all image files in input directory
    image_extensions = {".webp", ".png", ".jpg", ".jpeg"}
    raw_files = sorted(
        f
        for f in input_dir.iterdir()
        if f.suffix.lower() in image_extensions
    )

    if not raw_files:
        print(f"No image files found in {input_dir}")
        sys.exit(1)

    print(f"\nAI StudyFlow Sprite Processor v3.1")
    print(f"Input:  {input_dir.resolve()}")
    print(f"Output: {output_dir.resolve()}")
    print(f"Found {len(raw_files)} raw image(s)\n")

    for raw_file in raw_files:
        # Use the filename (without extension) as output name
        # E.g., "room_shell.png" → "bg/room_shell.webp"
        name = raw_file.stem

        # Route to bg/ or fg/ based on naming convention
        # Foreground items: desk_*, laptop_*, notebook_*, clock_*, coffee_*,
        #                   pen_*, books_stack_desk, desk_plant_*, headphones,
        #                   sticky_*, water_*, phone_*, eraser_*, desk_chair
        fg_prefixes = (
            "desk_", "laptop_", "notebook_", "clock_", "coffee_",
            "pen_", "books_stack_desk", "desk_plant_", "headphones",
            "sticky_", "water_", "phone_", "eraser_",
        )
        if name.startswith(fg_prefixes):
            sub_dir = "fg"
        else:
            sub_dir = "bg"

        process_single_image(
            raw_file, output_dir / sub_dir, name
        )

    print(f"\n[OK] Done! {len(raw_files)} sprite(s) processed.")


if __name__ == "__main__":
    main()
