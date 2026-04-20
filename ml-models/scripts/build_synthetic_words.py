"""
Build synthetic word generation utilities for handwriting module.

Steps 2.1-2.4 implement:
- Configuration constants
- Word image assembly with YOLO-format boxes
- Random word configuration sampling
- Letter pool loading

Run from project root:
    python ml-models/scripts/build_synthetic_words.py
"""

from __future__ import annotations

import random
from datetime import datetime
from pathlib import Path

from PIL import Image


# Word construction config
WORD_LENGTH_MIN = 3
WORD_LENGTH_MAX = 7
LETTER_SIZE = 64
LETTER_SPACING_MIN = 2
LETTER_SPACING_MAX = 8
CANVAS_PADDING = 10
CANVAS_HEIGHT = 64
BACKGROUND_COLOR = 255

# Class distribution - balanced (equal probability per class)
CLASS_NAMES = {0: "Normal", 1: "Reversal", 2: "Corrected"}
CLASS_WEIGHTS = {0: 1, 1: 1, 2: 1}

# Dataset generation config
TOTAL_WORDS = 15000
TRAIN_SPLIT = 0.80
VAL_SPLIT = 0.20
RANDOM_SEED = 42

# Paths (project-root relative)
LETTER_SRC = Path("data") / "processed" / "handwriting" / "kaggle_preprocessed" / "Train"
OUTPUT_ROOT = Path("data") / "processed" / "handwriting" / "synthetic_words"

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".gif", ".webp"}


def generate_word_image(
    letter_paths: list[Path], class_ids: list[int], spacing_values: list[int]
) -> tuple[Image.Image, list[tuple[int, float, float, float, float]]]:
    """
    Assemble a single synthetic word image from letter images.

    Args:
        letter_paths: List of letter image paths, one per letter.
        class_ids: List of class IDs (0/1/2), one per letter.
        spacing_values: List of pixel gaps between adjacent letters.

    Returns:
        Tuple of:
        - word_image: PIL Image in grayscale mode "L"
        - bboxes: list of (class_id, cx, cy, w, h) in normalized YOLO format
    """
    if len(letter_paths) == 0:
        raise ValueError("letter_paths must contain at least one image path.")
    if len(letter_paths) != len(class_ids):
        raise ValueError("letter_paths and class_ids must have the same length.")
    if len(spacing_values) != len(letter_paths) - 1:
        raise ValueError("spacing_values length must be len(letter_paths) - 1.")
    if any(class_id not in CLASS_NAMES for class_id in class_ids):
        raise ValueError("class_ids must only contain 0, 1, or 2.")
    if any(sp < 0 for sp in spacing_values):
        raise ValueError("spacing_values must be non-negative.")

    word_length = len(letter_paths)
    total_letters_width = word_length * LETTER_SIZE
    total_spacing_width = sum(spacing_values) if spacing_values else 0
    canvas_width = total_letters_width + total_spacing_width + (2 * CANVAS_PADDING)
    canvas_height = LETTER_SIZE + (2 * CANVAS_PADDING)

    word_image = Image.new("L", (canvas_width, canvas_height), color=BACKGROUND_COLOR)
    bboxes: list[tuple[int, float, float, float, float]] = []

    x_cursor = CANVAS_PADDING
    y_top = (canvas_height - LETTER_SIZE) // 2

    for index, (letter_path, class_id) in enumerate(zip(letter_paths, class_ids)):
        with Image.open(letter_path) as letter_image:
            glyph = letter_image.convert("L").resize(
                (LETTER_SIZE, LETTER_SIZE), Image.Resampling.LANCZOS
            )
            word_image.paste(glyph, (x_cursor, y_top))

        x_center = (x_cursor + (LETTER_SIZE / 2.0)) / float(canvas_width)
        y_center = 0.5
        width = LETTER_SIZE / float(canvas_width)
        height = LETTER_SIZE / float(canvas_height)

        bboxes.append((class_id, x_center, y_center, width, height))

        if index < len(spacing_values):
            x_cursor += LETTER_SIZE + spacing_values[index]
        else:
            x_cursor += LETTER_SIZE

    for _, cx, cy, w, h in bboxes:
        if not (0.0 <= cx <= 1.0 and 0.0 <= cy <= 1.0 and 0.0 <= w <= 1.0 and 0.0 <= h <= 1.0):
            raise ValueError("Generated bounding box values are outside [0.0, 1.0].")

    return word_image, bboxes


def sample_letter_for_class(
    class_id: int, letter_pool: dict[int, list[Path]], rng: random.Random
) -> Path:
    """
    Randomly pick one letter image path from the given class pool.

    Args:
        class_id: Target class ID (0, 1, or 2).
        letter_pool: Mapping of class_id to list of image Paths.
        rng: Seeded random.Random instance.

    Returns:
        Path to a selected letter image.
    """
    if class_id not in letter_pool:
        raise ValueError(f"class_id {class_id} is not present in letter_pool.")
    if not letter_pool[class_id]:
        raise ValueError(f"letter_pool for class_id {class_id} is empty.")
    return rng.choice(letter_pool[class_id])


def generate_word_config(rng: random.Random) -> tuple[int, list[int], list[int]]:
    """
    Randomly decide word length, class sequence, and inter-letter spacings.

    Args:
        rng: Seeded random.Random instance.

    Returns:
        Tuple of:
        - word_length: int in [WORD_LENGTH_MIN, WORD_LENGTH_MAX]
        - class_sequence: list of class IDs, one per letter
        - spacings: list of spacing values, length (word_length - 1)
    """
    word_length = rng.randint(WORD_LENGTH_MIN, WORD_LENGTH_MAX)

    class_ids = sorted(CLASS_NAMES.keys())
    weights = [CLASS_WEIGHTS[class_id] for class_id in class_ids]
    class_sequence = rng.choices(class_ids, weights=weights, k=word_length)

    spacings = [
        rng.randint(LETTER_SPACING_MIN, LETTER_SPACING_MAX)
        for _ in range(max(0, word_length - 1))
    ]

    return word_length, class_sequence, spacings


def load_letter_pool(letter_src_root: Path) -> dict[int, list[Path]]:
    """
    Load all available letter image paths into memory, organized by class.

    Args:
        letter_src_root: Path to kaggle_preprocessed/Train directory.

    Returns:
        Dictionary:
        {
            0: [Paths from Normal],
            1: [Paths from Reversal],
            2: [Paths from Corrected]
        }
    """
    pool: dict[int, list[Path]] = {}

    for class_id, class_name in CLASS_NAMES.items():
        class_dir = letter_src_root / class_name
        if not class_dir.exists():
            raise FileNotFoundError(f"Missing class directory: {class_dir}")

        paths = sorted(
            p for p in class_dir.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS
        )

        class_rng = random.Random(RANDOM_SEED + class_id)
        class_rng.shuffle(paths)
        pool[class_id] = paths

        print(f"Loaded {class_name}: {len(paths):,} paths")

    return pool


def clear_directory_files(directory: Path) -> None:
    """
    Create directory (if needed) and remove all files currently inside it.

    Args:
        directory: Target directory to initialize.
    """
    directory.mkdir(parents=True, exist_ok=True)
    for path in directory.iterdir():
        if path.is_file():
            path.unlink()


def save_yolo_labels(
    label_path: Path, bboxes: list[tuple[int, float, float, float, float]]
) -> None:
    """
    Save YOLO label annotations to text file with 6-decimal float formatting.

    Args:
        label_path: Output label file path.
        bboxes: List of (class_id, cx, cy, w, h) tuples.
    """
    with label_path.open("w", encoding="utf-8") as file:
        for class_id, cx, cy, width, height in bboxes:
            file.write(
                f"{class_id} {cx:.6f} {cy:.6f} {width:.6f} {height:.6f}\n"
            )


def write_generation_log(output_root: Path, train_count: int, val_count: int) -> None:
    """
    Write generation summary log file.

    Args:
        output_root: synthetic_words root directory.
        train_count: Number of generated train words.
        val_count: Number of generated validation words.
    """
    log_path = output_root / "generation_log.txt"
    lines = [
        f"Date and time of generation: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"Total words generated: {TOTAL_WORDS:,}",
        f"Train words: {train_count:,}",
        f"Val words: {val_count:,}",
        f"Word length range: {WORD_LENGTH_MIN}-{WORD_LENGTH_MAX} letters",
        f"Letter spacing range: {LETTER_SPACING_MIN}-{LETTER_SPACING_MAX} pixels",
        f"Canvas padding: {CANVAS_PADDING} pixels",
        "Class distribution: balanced (equal Normal/Reversal/Corrected)",
        f"Random seed: {RANDOM_SEED}",
        "Source letters: data/processed/handwriting/kaggle_preprocessed/Train/",
        "Output: data/processed/handwriting/synthetic_words/",
    ]
    log_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_data_yaml(output_root: Path) -> None:
    """
    Write YOLO data.yaml for synthetic words dataset.

    Args:
        output_root: Absolute synthetic_words output root path.
    """
    yaml_path = output_root / "data.yaml"
    normalized_path = str(output_root.resolve()).replace("\\", "/")
    content = (
        f"path: {normalized_path}\n"
        "train: images/train\n"
        "val: images/val\n"
        "nc: 3\n"
        "names:\n"
        "  0: Normal\n"
        "  1: Reversal\n"
        "  2: Corrected\n"
    )
    yaml_path.write_text(content, encoding="utf-8")


def main() -> int:
    """
    Generate synthetic word images, YOLO labels, split outputs, and metadata files.
    """
    project_root = Path(__file__).resolve().parents[2]
    letter_src_root = project_root / LETTER_SRC
    output_root = project_root / OUTPUT_ROOT

    rng = random.Random(RANDOM_SEED)
    letter_pool = load_letter_pool(letter_src_root)
    print("Letter pool loaded. Ready for word generation.")

    train_count = int(TOTAL_WORDS * TRAIN_SPLIT)
    val_count = TOTAL_WORDS - train_count

    images_train_dir = output_root / "images" / "train"
    images_val_dir = output_root / "images" / "val"
    labels_train_dir = output_root / "labels" / "train"
    labels_val_dir = output_root / "labels" / "val"

    clear_directory_files(images_train_dir)
    clear_directory_files(images_val_dir)
    clear_directory_files(labels_train_dir)
    clear_directory_files(labels_val_dir)

    generated_train = 0
    generated_val = 0

    for i in range(1, TOTAL_WORDS + 1):
        word_length, class_sequence, spacings = generate_word_config(rng)
        if len(class_sequence) != word_length:
            raise ValueError("Generated class sequence length does not match word length.")
        if len(spacings) != max(0, word_length - 1):
            raise ValueError("Generated spacing length does not match word length.")

        letter_paths = [
            sample_letter_for_class(class_id, letter_pool, rng)
            for class_id in class_sequence
        ]
        word_image, bboxes = generate_word_image(letter_paths, class_sequence, spacings)

        split = "train" if i <= train_count else "val"
        image_name = f"word_{i:05d}.png"
        label_name = f"word_{i:05d}.txt"

        image_dir = images_train_dir if split == "train" else images_val_dir
        label_dir = labels_train_dir if split == "train" else labels_val_dir

        image_path = image_dir / image_name
        label_path = label_dir / label_name

        word_image.save(image_path, format="PNG")
        save_yolo_labels(label_path, bboxes)

        if split == "train":
            generated_train += 1
        else:
            generated_val += 1

        if i % 1000 == 0:
            print(f"Generated {i:,}/{TOTAL_WORDS:,} words")

    write_generation_log(output_root, generated_train, generated_val)
    write_data_yaml(output_root)

    print(f"Generated {generated_train:,} train word images")
    print(f"Generated {generated_val:,} val word images")
    print(f"Total: {TOTAL_WORDS:,} synthetic word images")
    print("Saved to: data/processed/handwriting/synthetic_words/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
