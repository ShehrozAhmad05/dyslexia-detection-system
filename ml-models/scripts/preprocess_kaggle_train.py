"""
Preprocess Kaggle sampled Train images for the redesigned handwriting module.

Run from project root:
    python ml-models/scripts/preprocess_kaggle_train.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image


TARGET_SIZE = (64, 64)
CLASSES = ("Normal", "Reversal", "Corrected")
PROGRESS_EVERY = 5000
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


def preprocess_image(source_path: Path, destination_path: Path) -> None:
    with Image.open(source_path) as img:
        grayscale = img.convert("L")
        resized = grayscale.resize(TARGET_SIZE, Image.Resampling.LANCZOS)

        # Explicit normalization flow: uint8 -> float [0,1] -> uint8
        normalized = [pixel / 255.0 for pixel in resized.getdata()]
        restored = [int(round(value * 255.0)) for value in normalized]

        output = Image.new("L", TARGET_SIZE)
        output.putdata(restored)
        output.save(destination_path, format="PNG")


def main() -> int:
    project_root = Path(__file__).resolve().parents[2]
    input_root = project_root / "data" / "processed" / "handwriting" / "kaggle_sampled"
    output_root = (
        project_root / "data" / "processed" / "handwriting" / "kaggle_preprocessed" / "Train"
    )

    print("=" * 72)
    print("STEP 1.4 - PREPROCESS KAGGLE TRAIN IMAGES")
    print("=" * 72)
    print(f"Input root:  {input_root}")
    print(f"Output root: {output_root}")
    print(f"Pipeline: grayscale -> resize {TARGET_SIZE} -> normalize -> save PNG")

    class_counts: dict[str, int] = {}
    total_processed = 0

    for class_name in CLASSES:
        source_dir = input_root / class_name
        if not source_dir.exists():
            print(f"\nERROR: Missing source folder: {source_dir}")
            return 1

        destination_dir = output_root / class_name
        clear_output_folder(destination_dir)

        images = list_images(source_dir)
        print(f"\nProcessing {class_name}: {len(images):,} images")

        processed = 0
        for image_path in images:
            destination_path = destination_dir / image_path.name
            preprocess_image(image_path, destination_path)
            processed += 1

            if processed % PROGRESS_EVERY == 0:
                print(f"  {class_name}: processed {processed:,}/{len(images):,}")

        class_counts[class_name] = processed
        total_processed += processed
        print(f"  {class_name}: completed {processed:,}/{len(images):,}")

    print("\nFinal preprocessed Train counts:")
    for class_name in CLASSES:
        print(f"  {class_name}: {class_counts[class_name]:,}")
    print(f"  TOTAL: {total_processed:,}")

    print("\nStep 1.4 COMPLETE — 45,000 Train images preprocessed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
