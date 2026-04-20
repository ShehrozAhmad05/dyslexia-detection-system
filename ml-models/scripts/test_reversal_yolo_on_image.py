"""
Run YOLO reversal detection on a single user-provided handwriting image.

Run from project root:
    python ml-models/scripts/test_reversal_yolo_on_image.py
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image
from ultralytics import YOLO


@dataclass
class CandidateResult:
    name: str
    image_path: Path
    result: object
    detection_count: int
    avg_confidence: float


def otsu_threshold(gray: np.ndarray) -> int:
    histogram = np.bincount(gray.ravel(), minlength=256).astype(np.float64)
    total = gray.size
    sum_total = float(np.dot(np.arange(256), histogram))

    sum_background = 0.0
    weight_background = 0.0
    max_variance = -1.0
    threshold = 127

    for level in range(256):
        weight_background += histogram[level]
        if weight_background == 0.0:
            continue

        weight_foreground = total - weight_background
        if weight_foreground == 0.0:
            break

        sum_background += level * histogram[level]
        mean_background = sum_background / weight_background
        mean_foreground = (sum_total - sum_background) / weight_foreground

        variance_between = (
            weight_background
            * weight_foreground
            * (mean_background - mean_foreground) ** 2
        )
        if variance_between > max_variance:
            max_variance = variance_between
            threshold = level

    return threshold


def crop_to_text_region(
    image: np.ndarray, text_mask: np.ndarray, margin: int = 10
) -> np.ndarray:
    ys, xs = np.where(text_mask)
    if xs.size == 0 or ys.size == 0:
        return image

    height, width = image.shape[:2]
    x1 = max(int(xs.min()) - margin, 0)
    y1 = max(int(ys.min()) - margin, 0)
    x2 = min(int(xs.max()) + margin, width - 1)
    y2 = min(int(ys.max()) + margin, height - 1)
    return image[y1 : y2 + 1, x1 : x2 + 1]


def save_grayscale(image: np.ndarray, path: Path) -> None:
    Image.fromarray(image.astype(np.uint8)).save(path)


def prepare_preprocessed_candidates(
    input_path: Path, output_dir: Path
) -> tuple[int, int, list[tuple[str, Path]]]:
    with Image.open(input_path) as image:
        grayscale = image.convert("L")
        width, height = grayscale.size
        gray_np = np.array(grayscale, dtype=np.uint8)

    threshold = otsu_threshold(gray_np)
    binary = np.where(gray_np > threshold, 255, 0).astype(np.uint8)

    # Candidate A: black background + white text.
    white_pixels = int(np.count_nonzero(binary == 255))
    black_pixels = int(binary.size - white_pixels)
    black_bg_white_text = binary if black_pixels >= white_pixels else 255 - binary

    # Candidate B: white background + black text (inverse).
    white_bg_black_text = 255 - black_bg_white_text

    stem = input_path.stem
    candidates: list[tuple[str, Path]] = []

    full_a_path = output_dir / f"{stem}_pre_blackbg_whitetext_full.png"
    save_grayscale(black_bg_white_text, full_a_path)
    candidates.append(("blackbg_whitetext_full", full_a_path))

    crop_a = crop_to_text_region(black_bg_white_text, black_bg_white_text == 255)
    crop_a_path = output_dir / f"{stem}_pre_blackbg_whitetext_crop.png"
    save_grayscale(crop_a, crop_a_path)
    candidates.append(("blackbg_whitetext_crop", crop_a_path))

    full_b_path = output_dir / f"{stem}_pre_whitebg_blacktext_full.png"
    save_grayscale(white_bg_black_text, full_b_path)
    candidates.append(("whitebg_blacktext_full", full_b_path))

    crop_b = crop_to_text_region(white_bg_black_text, white_bg_black_text == 0)
    crop_b_path = output_dir / f"{stem}_pre_whitebg_blacktext_crop.png"
    save_grayscale(crop_b, crop_b_path)
    candidates.append(("whitebg_blacktext_crop", crop_b_path))

    return width, height, candidates


def run_candidate(model: YOLO, candidate_name: str, candidate_path: Path) -> CandidateResult:
    results = model.predict(
        source=str(candidate_path),
        conf=0.10,
        iou=0.45,
        imgsz=640,
        verbose=False,
    )
    result = results[0]
    detection_count = 0
    avg_confidence = 0.0

    if result.boxes is not None and len(result.boxes) > 0:
        detection_count = int(len(result.boxes))
        avg_confidence = float(result.boxes.conf.mean().item())

    return CandidateResult(
        name=candidate_name,
        image_path=candidate_path,
        result=result,
        detection_count=detection_count,
        avg_confidence=avg_confidence,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run YOLO test on a handwriting image.")
    parser.add_argument(
        "--image",
        default="data/raw/handwriting/test_image.png",
        help="Absolute or project-relative path to input image.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    project_root = Path(__file__).resolve().parents[2]
    model_path = (
        project_root / "ml-models" / "handwriting" / "models" / "reversal_yolo_v2.pt"
    )
    input_image_arg = Path(args.image)
    image_path = (
        input_image_arg if input_image_arg.is_absolute() else project_root / input_image_arg
    )
    output_dir = project_root / "ml-models" / "handwriting" / "testing"

    if not model_path.exists():
        print(f"ERROR: Model not found: {model_path}")
        return 1
    if not image_path.exists():
        print(f"ERROR: Test image not found: {image_path}")
        return 1

    output_dir.mkdir(parents=True, exist_ok=True)
    width, height, candidates = prepare_preprocessed_candidates(image_path, output_dir)

    model = YOLO(str(model_path))
    candidate_results: list[CandidateResult] = [
        run_candidate(model, name, path) for name, path in candidates
    ]
    best = max(
        candidate_results,
        key=lambda item: (item.detection_count, item.avg_confidence),
    )

    output_image = output_dir / f"{image_path.stem}_detected_best.png"
    best.result.save(filename=str(output_image))

    class_names = best.result.names if isinstance(best.result.names, dict) else {}
    detections: list[dict[str, float | int | str]] = []
    class_counts = {"Normal": 0, "Reversal": 0, "Corrected": 0}

    if best.result.boxes is not None:
        for box in best.result.boxes:
            class_id = int(box.cls.item())
            confidence = float(box.conf.item())
            x1, y1, x2, y2 = [float(v) for v in box.xyxy[0].tolist()]
            class_name = str(class_names.get(class_id, f"class_{class_id}"))
            detections.append(
                {
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": confidence,
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                }
            )
            if class_name in class_counts:
                class_counts[class_name] += 1

    detections.sort(key=lambda item: (float(item["x1"]), float(item["y1"])))

    print("================================")
    print("YOLO TEST ON USER IMAGE")
    print("Prompt text: i have a big dog")
    print("================================")
    print(f"Model: {model_path}")
    print(f"Source image: {image_path}")
    print(f"Image size preserved: {width}x{height}")
    print("Candidate preprocessing results:")
    for item in candidate_results:
        print(
            f"- {item.name}: {item.image_path} | "
            f"detections={item.detection_count}, avg_conf={item.avg_confidence:.3f}"
        )
    print(f"Chosen candidate: {best.name}")
    print(f"Chosen preprocessed image: {best.image_path}")
    print(f"Annotated output: {output_image}")
    print("--------------------------------")
    print(f"Total detections: {len(detections)}")
    print(
        "Counts -> "
        f"Normal: {class_counts['Normal']}, "
        f"Reversal: {class_counts['Reversal']}, "
        f"Corrected: {class_counts['Corrected']}"
    )

    if not detections:
        print("No letters detected.")
        print("================================")
        return 0

    print("--------------------------------")
    print("Detections:")
    for idx, det in enumerate(detections, start=1):
        print(
            f"{idx:02d}. {det['class_name']} "
            f"(conf={float(det['confidence']):.3f}) "
            f"bbox=({float(det['x1']):.1f}, {float(det['y1']):.1f}, "
            f"{float(det['x2']):.1f}, {float(det['y2']):.1f})"
        )

    print("================================")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
