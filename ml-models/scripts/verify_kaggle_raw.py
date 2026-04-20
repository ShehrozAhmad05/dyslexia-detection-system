"""
Verify copied Kaggle raw handwriting dataset quality and consistency.

Run from project root:
    python ml-models/scripts/verify_kaggle_raw.py
"""

from __future__ import annotations

import random
from collections import Counter
from pathlib import Path

from PIL import Image, ImageChops


RANDOM_SEED = 42
SAMPLE_PER_CLASS = 50
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".gif", ".webp"}


def is_grayscale_image(image: Image.Image) -> bool:
    if image.mode == "L":
        return True

    if image.mode in {"RGB", "RGBA"}:
        rgb = image.convert("RGB")
        r, g, b = rgb.split()
        rg_diff = ImageChops.difference(r, g).getbbox()
        gb_diff = ImageChops.difference(g, b).getbbox()
        return rg_diff is None and gb_diff is None

    return False


def is_blank_image(image: Image.Image) -> bool:
    grayscale = image.convert("L")
    min_pixel, max_pixel = grayscale.getextrema()
    return min_pixel == max_pixel and min_pixel in {0, 255}


def list_images(folder: Path) -> list[Path]:
    return sorted(
        p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS
    )


def main() -> int:
    random.seed(RANDOM_SEED)

    project_root = Path(__file__).resolve().parents[2]
    raw_root = project_root / "data" / "raw" / "handwriting" / "kaggle_dyslexia"
    class_folders = [
        ("Train", "Normal"),
        ("Train", "Reversal"),
        ("Train", "Corrected"),
        ("Test", "Normal"),
        ("Test", "Reversal"),
        ("Test", "Corrected"),
    ]

    print("=" * 72)
    print("STEP 1.2 - VERIFY KAGGLE RAW DATA")
    print("=" * 72)
    print(f"Dataset root: {raw_root}")
    print(f"Random seed: {RANDOM_SEED}")
    print(f"Sample per class folder: {SAMPLE_PER_CLASS}")

    missing_folders: list[str] = []
    for split, cls in class_folders:
        folder = raw_root / split / cls
        if not folder.exists():
            missing_folders.append(f"{split}\\{cls}")

    if missing_folders:
        print("\nERROR: Missing required folders:")
        for item in missing_folders:
            print(f"  - {item}")
        print("\nSUMMARY: WARN")
        return 1

    print("\nImage counts per folder:")
    folder_images: dict[tuple[str, str], list[Path]] = {}
    for split, cls in class_folders:
        images = list_images(raw_root / split / cls)
        folder_images[(split, cls)] = images
        print(f"  {split}\\{cls}: {len(images):,}")

    corrupt_images: list[str] = []
    non_grayscale_images: list[str] = []
    blank_images: list[str] = []
    class_size_ranges: dict[str, tuple[tuple[int, int], tuple[int, int]]] = {}
    class_common_sizes: dict[str, tuple[int, int] | None] = {}

    print("\nSampling and validating images...")
    for split, cls in class_folders:
        class_key = f"{split}\\{cls}"
        images = folder_images[(split, cls)]
        sample_size = min(SAMPLE_PER_CLASS, len(images))
        sampled = random.sample(images, sample_size)

        size_counter: Counter[tuple[int, int]] = Counter()
        widths: list[int] = []
        heights: list[int] = []

        for path in sampled:
            rel_name = f"{class_key}\\{path.name}"
            try:
                with Image.open(path) as image:
                    image.load()
                    width, height = image.size
                    widths.append(width)
                    heights.append(height)
                    size_counter[(width, height)] += 1

                    if not is_grayscale_image(image):
                        non_grayscale_images.append(rel_name)

                    if is_blank_image(image):
                        blank_images.append(rel_name)
            except Exception:
                corrupt_images.append(rel_name)

        min_size = (min(widths), min(heights)) if widths and heights else (0, 0)
        max_size = (max(widths), max(heights)) if widths and heights else (0, 0)
        class_size_ranges[class_key] = (min_size, max_size)
        class_common_sizes[class_key] = (
            size_counter.most_common(1)[0][0] if size_counter else None
        )

    print("\nPer-class sampled size ranges (min to max):")
    for class_key, (min_size, max_size) in class_size_ranges.items():
        print(f"  {class_key}: min={min_size}, max={max_size}")

    print("\nMost common sampled image size per class:")
    for class_key, common_size in class_common_sizes.items():
        print(f"  {class_key}: {common_size}")

    print("\nIssue details:")
    print(f"  Corrupt images: {len(corrupt_images)}")
    for item in corrupt_images:
        print(f"    - {item}")

    print(f"  Non-grayscale images: {len(non_grayscale_images)}")
    for item in non_grayscale_images:
        print(f"    - {item}")

    print(f"  Blank images (all black/all white): {len(blank_images)}")
    for item in blank_images:
        print(f"    - {item}")

    total_issues = len(corrupt_images) + len(non_grayscale_images) + len(blank_images)
    print("\n" + "=" * 72)
    if total_issues == 0:
        print("SUMMARY: PASS")
    else:
        print(f"SUMMARY: WARN ({total_issues} issues found in sampled images)")
    print("=" * 72)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
