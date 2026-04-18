"""
Verify YOLO dataset integrity for synthdata_augmented.

Run from project root:
    python ml-models/scripts/verify_yolo_dataset.py
"""

from __future__ import annotations

from pathlib import Path


VALID_CLASSES = {0, 1, 2}


def is_valid_label_line(line: str) -> bool:
    parts = line.strip().split()
    if len(parts) != 5:
        return False

    try:
        class_id = int(parts[0])
    except ValueError:
        return False

    if class_id not in VALID_CLASSES:
        return False

    try:
        coords = [float(value) for value in parts[1:]]
    except ValueError:
        return False

    return all(0.0 <= value <= 1.0 for value in coords)


def validate_label_file(label_path: Path) -> bool:
    content = label_path.read_text(encoding="utf-8").strip()
    if not content:
        return False

    return all(is_valid_label_line(line) for line in content.splitlines())


def main() -> int:
    project_root = Path(__file__).resolve().parents[2]
    dataset_root = project_root / "data" / "processed" / "handwriting" / "synthdata_augmented"

    images_train = dataset_root / "images" / "train"
    images_val = dataset_root / "images" / "val"
    labels_train = dataset_root / "labels" / "train"
    labels_val = dataset_root / "labels" / "val"

    required_dirs = [images_train, images_val, labels_train, labels_val]

    print("=" * 72)
    print("YOLO DATASET VERIFICATION")
    print("=" * 72)
    print(f"Dataset root: {dataset_root}")

    missing_dirs = [str(path) for path in required_dirs if not path.exists()]
    if missing_dirs:
        print("\nERROR: Missing required folders:")
        for path in missing_dirs:
            print(f"  - {path}")
        print("\nFINAL SUMMARY: FAIL (missing required folders)")
        return 1

    train_images = sorted(images_train.glob("*.png"))
    val_images = sorted(images_val.glob("*.png"))
    print(f"\nimages/train count: {len(train_images)}")
    print(f"images/val count: {len(val_images)}")

    missing_labels: list[str] = []
    invalid_labels: list[str] = []

    for split_name, image_paths, labels_dir in (
        ("train", train_images, labels_train),
        ("val", val_images, labels_val),
    ):
        print(f"\nChecking {split_name} image-label pairs...")
        for image_path in image_paths:
            label_path = labels_dir / f"{image_path.stem}.txt"
            if not label_path.exists():
                missing_labels.append(f"{split_name}/{image_path.name}")

    if missing_labels:
        print("\nImages missing label files:")
        for item in missing_labels:
            print(f"  - {item}")
    else:
        print("\nNo missing label files found.")

    for split_name, labels_dir in (("train", labels_train), ("val", labels_val)):
        print(f"\nValidating {split_name} label files...")
        for label_path in sorted(labels_dir.glob("*.txt")):
            if not validate_label_file(label_path):
                invalid_labels.append(f"{split_name}/{label_path.name}")

    if invalid_labels:
        print("\nInvalid label files:")
        for item in invalid_labels:
            print(f"  - {item}")
    else:
        print("\nNo invalid label files found.")

    total_issues = len(missing_labels) + len(invalid_labels)
    print("\n" + "=" * 72)
    if total_issues == 0:
        print("FINAL SUMMARY: PASS")
        print("Missing labels: 0")
        print("Invalid label files: 0")
        print("=" * 72)
        return 0

    print("FINAL SUMMARY: FAIL")
    print(f"Missing labels: {len(missing_labels)}")
    print(f"Invalid label files: {len(invalid_labels)}")
    print(f"Total issues: {total_issues}")
    print("=" * 72)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
