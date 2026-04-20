"""
Verify integrity and format of generated synthetic word dataset.

Run from project root:
    python ml-models/scripts/verify_synthetic_words.py
"""

from __future__ import annotations

import random
from pathlib import Path

from PIL import Image


RANDOM_SEED = 42
SAMPLE_COUNT_PER_SPLIT = 50
EXPECTED_HEIGHT = 64 + (2 * 10)  # LETTER_SIZE + 2 * CANVAS_PADDING


def parse_label_file(label_path: Path) -> tuple[bool, str]:
    """
    Parse and validate one YOLO label file.

    Args:
        label_path: Path to label text file.

    Returns:
        Tuple of (is_valid, reason_if_invalid).
    """
    content = label_path.read_text(encoding="utf-8").strip()
    if not content:
        return False, "empty file"

    lines = content.splitlines()
    if not (3 <= len(lines) <= 7):
        return False, f"line count {len(lines)} not in [3, 7]"

    for line in lines:
        parts = line.strip().split()
        if len(parts) != 5:
            return False, "line does not contain exactly 5 values"

        try:
            class_id = int(parts[0])
        except ValueError:
            return False, "class_id is not an integer"

        if class_id not in {0, 1, 2}:
            return False, "class_id not in {0,1,2}"

        try:
            values = [float(v) for v in parts[1:]]
        except ValueError:
            return False, "bbox values are not floats"

        if any(v < 0.0 or v > 1.0 for v in values):
            return False, "bbox values outside [0.0, 1.0]"

    return True, ""


def main() -> int:
    """
    Verify synthetic words dataset structure, pairing, and sampled format.
    """
    random.seed(RANDOM_SEED)
    project_root = Path(__file__).resolve().parents[2]
    dataset_root = project_root / "data" / "processed" / "handwriting" / "synthetic_words"

    images_train = dataset_root / "images" / "train"
    images_val = dataset_root / "images" / "val"
    labels_train = dataset_root / "labels" / "train"
    labels_val = dataset_root / "labels" / "val"

    required_dirs = [images_train, images_val, labels_train, labels_val]
    missing_dirs = [str(path) for path in required_dirs if not path.exists()]
    if missing_dirs:
        print("Missing required folders:")
        for path in missing_dirs:
            print(f"  - {path}")
        print("Overall: FAIL")
        return 1

    train_images = sorted(images_train.glob("*.png"))
    val_images = sorted(images_val.glob("*.png"))
    train_labels = sorted(labels_train.glob("*.txt"))
    val_labels = sorted(labels_val.glob("*.txt"))

    print(f"images/train: {len(train_images)} images")
    print(f"images/val: {len(val_images)} images")
    print(f"labels/train: {len(train_labels)} label files")
    print(f"labels/val: {len(val_labels)} label files")

    train_image_stems = {path.stem for path in train_images}
    val_image_stems = {path.stem for path in val_images}
    train_label_stems = {path.stem for path in train_labels}
    val_label_stems = {path.stem for path in val_labels}

    pair_failures: list[str] = []
    missing_train_labels = sorted(train_image_stems - train_label_stems)
    missing_val_labels = sorted(val_image_stems - val_label_stems)
    extra_train_labels = sorted(train_label_stems - train_image_stems)
    extra_val_labels = sorted(val_label_stems - val_image_stems)

    for stem in missing_train_labels:
        pair_failures.append(f"train missing label for image stem: {stem}")
    for stem in missing_val_labels:
        pair_failures.append(f"val missing label for image stem: {stem}")
    for stem in extra_train_labels:
        pair_failures.append(f"train extra label without image stem: {stem}")
    for stem in extra_val_labels:
        pair_failures.append(f"val extra label without image stem: {stem}")

    pair_check_pass = len(pair_failures) == 0
    print(f"Image/label pair check: {'PASS' if pair_check_pass else 'FAIL'}")

    format_failures: list[str] = []
    rng = random.Random(RANDOM_SEED)

    for split, image_paths, labels_dir in (
        ("train", train_images, labels_train),
        ("val", val_images, labels_val),
    ):
        sample_size = min(SAMPLE_COUNT_PER_SPLIT, len(image_paths))
        sampled_images = rng.sample(image_paths, sample_size)

        for image_path in sampled_images:
            try:
                with Image.open(image_path) as image:
                    if image.mode != "L":
                        format_failures.append(
                            f"{split}/{image_path.name}: mode {image.mode} is not L"
                        )
                    if image.width <= 64:
                        format_failures.append(
                            f"{split}/{image_path.name}: width {image.width} is not > 64"
                        )
                    if image.height != EXPECTED_HEIGHT:
                        format_failures.append(
                            f"{split}/{image_path.name}: height {image.height} != {EXPECTED_HEIGHT}"
                        )
            except Exception as exc:
                format_failures.append(f"{split}/{image_path.name}: open error: {exc}")
                continue

            label_path = labels_dir / f"{image_path.stem}.txt"
            if not label_path.exists():
                format_failures.append(f"{split}/{image_path.name}: sampled label missing")
                continue

            is_valid, reason = parse_label_file(label_path)
            if not is_valid:
                format_failures.append(
                    f"{split}/{label_path.name}: invalid label format ({reason})"
                )

    format_check_pass = len(format_failures) == 0
    print(
        f"Format check (50 samples each split): {'PASS' if format_check_pass else 'FAIL'}"
    )

    overall_pass = pair_check_pass and format_check_pass
    print(f"Overall: {'PASS' if overall_pass else 'FAIL'}")

    if not overall_pass:
        print("\nPair check issues:")
        for issue in pair_failures[:20]:
            print(f"  - {issue}")
        if len(pair_failures) > 20:
            print(f"  ... and {len(pair_failures) - 20} more")

        print("\nFormat check issues:")
        for issue in format_failures[:20]:
            print(f"  - {issue}")
        if len(format_failures) > 20:
            print(f"  ... and {len(format_failures) - 20} more")

    return 0 if overall_pass else 1


if __name__ == "__main__":
    raise SystemExit(main())
