"""
Sample Kaggle Train split into a balanced 45,000-image subset.

Run from project root:
    python ml-models/scripts/sample_kaggle_train.py
"""

from __future__ import annotations

import random
import shutil
from pathlib import Path


RANDOM_SEED = 42
SAMPLE_PER_CLASS = 15_000
CLASSES = ("Normal", "Reversal", "Corrected")
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".gif", ".webp"}


def list_images(folder: Path) -> list[Path]:
    return sorted(
        p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS
    )


def clear_output_folder(folder: Path) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    for path in folder.iterdir():
        if path.is_file():
            path.unlink()


def main() -> int:
    random.seed(RANDOM_SEED)

    project_root = Path(__file__).resolve().parents[2]
    input_root = project_root / "data" / "raw" / "handwriting" / "kaggle_dyslexia" / "Train"
    output_root = project_root / "data" / "processed" / "handwriting" / "kaggle_sampled"

    print("=" * 72)
    print("STEP 1.3 - SAMPLE KAGGLE TRAIN SUBSET")
    print("=" * 72)
    print(f"Input root: {input_root}")
    print(f"Output root: {output_root}")
    print(f"Random seed: {RANDOM_SEED}")
    print(f"Sample per class: {SAMPLE_PER_CLASS}")

    sampled_totals = 0
    for cls in CLASSES:
        source_dir = input_root / cls
        if not source_dir.exists():
            print(f"\nERROR: Missing source folder: {source_dir}")
            return 1

        images = list_images(source_dir)
        total_available = len(images)
        if total_available < SAMPLE_PER_CLASS:
            print(
                f"\nERROR: Not enough images in {cls}. "
                f"Available={total_available:,}, Required={SAMPLE_PER_CLASS:,}"
            )
            return 1

        selected = random.sample(images, SAMPLE_PER_CLASS)
        destination_dir = output_root / cls
        clear_output_folder(destination_dir)

        print(f"\nSampling {cls}: {SAMPLE_PER_CLASS:,} from {total_available:,}")
        for idx, image_path in enumerate(selected, start=1):
            shutil.copy2(image_path, destination_dir / image_path.name)
            if idx % 5000 == 0:
                print(f"  {cls}: copied {idx:,}/{SAMPLE_PER_CLASS:,}")

        copied_count = len(list_images(destination_dir))
        sampled_totals += copied_count
        print(f"  {cls}: copied count confirmed = {copied_count:,}")

    print("\nFinal sampled counts:")
    for cls in CLASSES:
        count = len(list_images(output_root / cls))
        print(f"  {cls}: {count:,}")

    print(f"  TOTAL: {sampled_totals:,}")
    print("\nStep 1.3 COMPLETE — 45,000 images sampled")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
